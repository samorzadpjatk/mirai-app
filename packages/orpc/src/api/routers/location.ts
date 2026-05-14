import { z } from "zod";
import { createORPCRouter, protectedProcedure } from "../../api/trpc";
import {
  locationDataSchema,
  calculateDistance,
  latitudeSchema,
  longitudeSchema,
} from "../../utils/location-validation";
import {
  type RealtimeChannel,
  REALTIME_CHANNEL_STATES,
  type SupabaseClient,
} from "@mirai-app/supabase";
import { IMAGE_BUCKET } from "../../utils/storage";
import type { Location as DbLocation, DB } from "@mirai-app/db";
import { tracked } from "../../api/trpc";
import { ORPCError } from "@orpc/server";
import { ensureTripNotEnded } from "../../utils/tripGuards";
import { eq, and, ne, inArray } from "drizzle-orm";
import {
  locations,
  locationShares,
  locationSharingRequests,
  tripParticipants,
} from "@mirai-app/db";

/**
 * Check if user is in any active trips (not ended)
 */
async function ensureUserInActiveTrip(db: DB, userId: string): Promise<void> {
  const memberships = await db.query.tripParticipants.findMany({
    where: (tp, { eq }) => eq(tp.userId, userId),
    with: {
      trip: {
        columns: { id: true, endDate: true },
      },
    },
  });

  if (memberships.length === 0) {
    throw new ORPCError("FORBIDDEN", { message: "Location sharing requires trip participation" });
  }

  // Check if all user's trips have ended
  for (const membership of memberships) {
    try {
      await ensureTripNotEnded(db, membership.trip.id);
      // If we find any active trip, allow the operation
      return;
    } catch {
      // Trip has ended, continue checking others
      continue;
    }
  }

  // All trips have ended
  throw new ORPCError("FORBIDDEN", { message: "Location sharing is not available for past trips" });
}

/**
 * Expo-compliant location object type
 * Based on https://docs.expo.dev/versions/latest/sdk/location/#locationobject
 */
export interface ExpoLocationObject {
  coords: {
    latitude: number;
    longitude: number;
    altitude: number | null;
    accuracy: number | null;
    altitudeAccuracy: number | null;
    heading: number | null;
    speed: number | null;
  };
  timestamp: number;
}

/**
 * Extended location object with user and sharing info
 */
export interface LocationWithUser extends ExpoLocationObject {
  isSharingLocation: boolean;
  user?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    image: string | null;
  };
}

export interface FriendLocationEvent {
  id: string;
  type: "upsert" | "delete";
  location?: LocationWithUser;
  userId?: string;
}

export interface SharingUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  image: string | null;
}

export interface SharingSettings {
  isSharingLocation: boolean;
  usersToShareWith: SharingUser[];
}

const AVATAR_FILE_EXTENSION = "jpg";
const AVATAR_SIGNED_URL_SECONDS = 60 * 60 * 24;

const getUserAvatarPath = (userId: string): string => `avatar/${userId}.${AVATAR_FILE_EXTENSION}`;

const getUserAvatarUrl = async (
  supabase: SupabaseClient,
  userId: string | null | undefined,
  hasAvatar: boolean | null | undefined,
): Promise<string | null> => {
  if (!userId || !hasAvatar) return null;

  const { data, error } = await supabase.storage
    .from(IMAGE_BUCKET)
    .createSignedUrl(getUserAvatarPath(userId), AVATAR_SIGNED_URL_SECONDS);

  if (error || !data?.signedUrl) return null;

  return data.signedUrl;
};

const mapUserWithAvatar = async (
  supabase: SupabaseClient,
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    hasAvatar: boolean | null;
  } | null,
): Promise<LocationWithUser["user"] | null> => {
  if (!user) return null;
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    image: await getUserAvatarUrl(supabase, user.id, user.hasAvatar),
  };
};

/**
 * Convert database location to Expo-compliant format
 */
function toExpoLocation(dbLocation: DbLocation): ExpoLocationObject {
  return {
    coords: {
      latitude: dbLocation.latitude ?? 0,
      longitude: dbLocation.longitude ?? 0,
      altitude: dbLocation.altitude ?? null,
      accuracy: dbLocation.accuracy ?? null,
      altitudeAccuracy: dbLocation.altitudeAccuracy ?? null,
      heading: dbLocation.heading ?? null,
      speed: dbLocation.speed ?? null,
    },
    timestamp: dbLocation.timestamp.getTime(),
  };
}

/**
 * Convert database location with user to extended format
 */
async function toLocationWithUser(
  db: DB,
  supabase: SupabaseClient,
  dbLocation: DbLocation,
): Promise<LocationWithUser> {
  const expoLocation = toExpoLocation(dbLocation);
  const user = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.id, dbLocation.userId),
    columns: {
      id: true,
      firstName: true,
      lastName: true,
      hasAvatar: true,
    },
  });

  if (!user) {
    throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "User not found for location" });
  }

  return {
    ...expoLocation,
    isSharingLocation: dbLocation.isSharingLocation,
    user: (await mapUserWithAvatar(supabase, user)) ?? undefined,
  };
}

async function getShareableUserIdsForCurrentUser({
  db,
  currentUserId,
  tripId,
}: {
  db: DB;
  currentUserId: string;
  tripId?: string;
}): Promise<Set<string>> {
  let scopedTripIds: string[] = [];

  if (tripId) {
    const isMember = await db.query.tripParticipants.findFirst({
      where: (tp, { and, eq }) => and(eq(tp.tripId, tripId), eq(tp.userId, currentUserId)),
      columns: { id: true },
    });

    if (!isMember) {
      return new Set();
    }

    scopedTripIds = [tripId];
  } else {
    const memberships = await db.query.tripParticipants.findMany({
      where: (tp, { eq }) => eq(tp.userId, currentUserId),
      columns: { tripId: true },
    });
    scopedTripIds = memberships.map((membership) => membership.tripId);
  }

  if (scopedTripIds.length === 0) {
    return new Set();
  }

  const participants = await db
    .select({ userId: tripParticipants.userId })
    .from(tripParticipants)
    .where(
      and(
        inArray(tripParticipants.tripId, scopedTripIds),
        ne(tripParticipants.userId, currentUserId),
      ),
    )
    .groupBy(tripParticipants.userId);

  return new Set(participants.map((participant) => participant.userId));
}

async function assertShareableTargets({
  db,
  currentUserId,
  targetUserIds,
  tripId,
  allowAlreadyShared = false,
}: {
  db: DB;
  currentUserId: string;
  targetUserIds: string[];
  tripId?: string;
  allowAlreadyShared?: boolean;
}): Promise<void> {
  const uniqueTargetUserIds = [...new Set(targetUserIds)];
  if (uniqueTargetUserIds.length === 0) return;

  if (uniqueTargetUserIds.some((targetId) => targetId === currentUserId)) {
    throw new ORPCError("BAD_REQUEST", {
      message: "You cannot share location settings with yourself",
    });
  }

  const allowedIds = await getShareableUserIdsForCurrentUser({
    db,
    currentUserId,
    tripId,
  });

  if (allowAlreadyShared) {
    const location = await db.query.locations.findFirst({
      where: (l, { eq }) => eq(l.userId, currentUserId),
      with: {
        usersToShareWith: {
          columns: { userId: true },
        },
      },
    });

    for (const share of location?.usersToShareWith ?? []) {
      allowedIds.add(share.userId);
    }
  }

  const invalidTargetIds = uniqueTargetUserIds.filter((targetId) => !allowedIds.has(targetId));

  if (invalidTargetIds.length > 0) {
    throw new ORPCError("BAD_REQUEST", {
      message: "One or more selected users are outside your allowed sharing scope",
    });
  }
}

export const locationRouter = createORPCRouter({
  /**
   * WebSocket subscription for updating current user's location
   * Client sends location updates through this subscription
   */
  updateLocationStream: protectedProcedure.input(locationDataSchema).handler(async function* ({
    context,
    input,
  }) {
    // Update location in database
    const [location] = await context.db
      .insert(locations)
      .values({
        userId: context.dbUser.id,
        latitude: input.latitude,
        longitude: input.longitude,
        accuracy: input.accuracy,
        altitude: input.altitude,
        altitudeAccuracy: input.altitudeAccuracy,
        heading: input.heading,
        speed: input.speed,
        timestamp: new Date(),
        isSharingLocation: true,
      })
      .onConflictDoUpdate({
        target: locations.userId,
        set: {
          latitude: input.latitude,
          longitude: input.longitude,
          accuracy: input.accuracy,
          altitude: input.altitude,
          altitudeAccuracy: input.altitudeAccuracy,
          heading: input.heading,
          speed: input.speed,
          timestamp: new Date(),
          isSharingLocation: true,
        },
      })
      .returning();

    if (!location) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Failed to update location" });
    }

    yield toExpoLocation(location);
  }),

  /**
   * Update location sharing settings
   */
  updateSharingSettings: protectedProcedure
    .input(
      z.object({
        isSharingLocation: z.boolean(),
        userIdsToShareWith: z.array(z.string()).optional(),
        tripId: z.string().optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      const { isSharingLocation, userIdsToShareWith, tripId } = input;

      if (tripId) {
        await ensureTripNotEnded(context.db, tripId);
      } else {
        await ensureUserInActiveTrip(context.db, context.dbUser.id);
      }

      if ((userIdsToShareWith?.length ?? 0) > 0) {
        await assertShareableTargets({
          db: context.db,
          currentUserId: context.dbUser.id,
          targetUserIds: userIdsToShareWith ?? [],
          tripId,
          allowAlreadyShared: true,
        });
      }

      // Upsert location for user
      const [locationRow] = await context.db
        .insert(locations)
        .values({
          userId: context.dbUser.id,
          isSharingLocation,
          timestamp: new Date(),
        })
        .onConflictDoUpdate({
          target: locations.userId,
          set: {
            isSharingLocation,
            timestamp: new Date(),
          },
        })
        .returning();

      if (!locationRow) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Failed to upsert location" });
      }

      // Update shares if userIdsToShareWith provided
      if ((userIdsToShareWith?.length ?? 0) > 0) {
        await context.db
          .delete(locationShares)
          .where(eq(locationShares.locationId, locationRow.id));

        await context.db
          .insert(locationShares)
          .values(userIdsToShareWith!.map((id) => ({ locationId: locationRow.id, userId: id })));
      }

      // Query users to share with
      const shareUserIds = await context.db
        .select({ userId: locationShares.userId })
        .from(locationShares)
        .where(eq(locationShares.locationId, locationRow.id));

      const usersToShareWith =
        shareUserIds.length > 0
          ? await context.db.query.users.findMany({
              where: (u, { inArray }) =>
                inArray(
                  u.id,
                  shareUserIds.map((s) => s.userId),
                ),
              columns: {
                id: true,
                firstName: true,
                lastName: true,
                hasAvatar: true,
              },
            })
          : [];

      return {
        isSharingLocation: Boolean(locationRow.isSharingLocation),
        usersToShareWith,
      };
    }),

  /**
   * WebSocket subscription for getting locations of friends
   * Returns real-time updates when friends' locations change.
   * Optionally accepts a radius (latitude, longitude, radiusKm) to limit events to users within the given radius.
   */
  getFriendsLocationsStream: protectedProcedure
    .input(
      z.object({
        connectionId: z.string().nullable(),
        radiusKm: z.number().positive().max(1000).optional(),
        latitude: latitudeSchema.optional(),
        longitude: longitudeSchema.optional(),
      }),
    )
    .handler(async function* ({ context, input }) {
      const supabase = context.supabase;
      let channel: RealtimeChannel | null = null;
      const queue: FriendLocationEvent[] = [];
      const connectionId = input.connectionId ?? crypto.randomUUID();

      const { radiusKm, latitude, longitude } = input;
      if (radiusKm !== undefined && (latitude === undefined || longitude === undefined)) {
        throw new ORPCError("BAD_REQUEST", {
          message: "When providing radiusKm, both latitude and longitude are required",
        });
      }

      // Emituj początkowe lokalizacje znajomych (filtrowane jeśli radius podany)
      const shareEntries = await context.db
        .select({ locationId: locationShares.locationId })
        .from(locationShares)
        .where(eq(locationShares.userId, context.dbUser.id));

      const locationIds = shareEntries.map((s) => s.locationId);

      const dbLocations =
        locationIds.length > 0
          ? await context.db.query.locations.findMany({
              where: (l, { and, eq, inArray }) =>
                and(eq(l.isSharingLocation, true), inArray(l.id, locationIds)),
              with: {
                user: {
                  columns: {
                    id: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            })
          : [];

      // Track which friends are currently within the radius (when radius filtering is used)
      const inRadius = new Set<string>();

      for (const dbLocation of dbLocations) {
        const lw = await toLocationWithUser(context.db, context.supabase, dbLocation);
        if (radiusKm !== undefined) {
          if (!dbLocation.latitude || !dbLocation.longitude) continue;
          const dist = calculateDistance(
            latitude!,
            longitude!,
            Number(dbLocation.latitude),
            Number(dbLocation.longitude),
          );
          if (dist <= radiusKm) {
            inRadius.add(dbLocation.userId);
            yield tracked(connectionId, {
              type: "upsert",
              location: { ...lw },
            });
          }
        } else {
          yield tracked(connectionId, { type: "upsert", location: lw });
        }
      }

      const friendIds = dbLocations.map((l) => l.userId);
      const allowedFriendIds = new Set(friendIds);

      console.log(
        `[Location Stream] Setting up subscription for user ${context.dbUser.id}, watching ${friendIds.length} friends`,
      );

      if (friendIds.length > 0) {
        // Subskrybuj zmiany tylko dla lokalizacji znajomych (jeden kanał, filtr in)
        const filter = `userId=in.(${friendIds.join(",")})`;

        channel = supabase
          .channel(`friends_locations_${context.dbUser.id}`)
          .on<DbLocation>(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "Location",
              filter,
            },
            (payload) => {
              switch (payload.eventType) {
                case "DELETE": {
                  const userId = payload.old.userId;
                  if (!userId || !allowedFriendIds.has(userId)) {
                    return;
                  }

                  if (radiusKm !== undefined) {
                    if (inRadius.has(userId)) {
                      inRadius.delete(userId);
                      queue.push({ id: connectionId, type: "delete", userId });
                    }
                  } else {
                    queue.push({ id: connectionId, type: "delete", userId });
                  }
                  break;
                }
                default: {
                  const newLocation = payload.new;

                  const userIdFromEvent = newLocation.userId;
                  if (!userIdFromEvent || !allowedFriendIds.has(userIdFromEvent)) {
                    return;
                  }

                  if (!newLocation.userId || !newLocation.timestamp) {
                    void context.db.query.locations
                      .findFirst({
                        where: (l, { eq }) => eq(l.userId, userIdFromEvent),
                        with: {
                          user: {
                            columns: {
                              id: true,
                              firstName: true,
                              lastName: true,
                              hasAvatar: true,
                            },
                          },
                        },
                      })
                      .then(async (dbLocation) => {
                        if (!dbLocation) {
                          return;
                        }

                        if (!allowedFriendIds.has(dbLocation.userId)) {
                          return;
                        }

                        const userWithAvatar = await mapUserWithAvatar(
                          context.supabase,
                          dbLocation.user,
                        );

                        const location: LocationWithUser = {
                          coords: {
                            latitude: dbLocation.latitude ?? 0,
                            longitude: dbLocation.longitude ?? 0,
                            altitude: dbLocation.altitude ?? null,
                            accuracy: dbLocation.accuracy ?? null,
                            altitudeAccuracy: dbLocation.altitudeAccuracy ?? null,
                            heading: dbLocation.heading ?? null,
                            speed: dbLocation.speed ?? null,
                          },
                          timestamp: dbLocation.timestamp.getTime(),
                          isSharingLocation: dbLocation.isSharingLocation,
                          user: userWithAvatar ?? undefined,
                        };

                        const userId = dbLocation.userId;

                        if (radiusKm !== undefined) {
                          if (!dbLocation.latitude || !dbLocation.longitude) {
                            if (inRadius.delete(userId)) {
                              queue.push({
                                id: connectionId,
                                type: "delete",
                                userId,
                              });
                            }
                            return;
                          }

                          const dist = calculateDistance(
                            latitude!,
                            longitude!,
                            Number(dbLocation.latitude),
                            Number(dbLocation.longitude),
                          );

                          if (dist <= radiusKm) {
                            inRadius.add(userId);
                            queue.push({
                              id: connectionId,
                              type: "upsert",
                              location,
                            });
                          } else {
                            if (inRadius.delete(userId)) {
                              queue.push({
                                id: connectionId,
                                type: "delete",
                                userId,
                              });
                            }
                          }
                        } else {
                          queue.push({
                            id: connectionId,
                            type: "upsert",
                            location,
                          });
                        }
                      });
                    return;
                  }

                  void toLocationWithUser(context.db, context.supabase, newLocation).then(
                    (location) => {
                      const userId = newLocation.userId;

                      if (radiusKm !== undefined) {
                        if (!newLocation?.latitude || !newLocation?.longitude) {
                          if (inRadius.delete(userId)) {
                            queue.push({
                              id: connectionId,
                              type: "delete",
                              userId,
                            });
                          }
                          return;
                        }

                        const dist = calculateDistance(
                          latitude!,
                          longitude!,
                          Number(newLocation.latitude),
                          Number(newLocation.longitude),
                        );

                        if (dist <= radiusKm) {
                          inRadius.add(userId);
                          queue.push({
                            id: connectionId,
                            type: "upsert",
                            location,
                          });
                        } else {
                          if (inRadius.delete(userId)) {
                            queue.push({
                              id: connectionId,
                              type: "delete",
                              userId,
                            });
                          }
                        }
                      } else {
                        queue.push({
                          id: connectionId,
                          type: "upsert",
                          location,
                        });
                      }
                    },
                  );
                  break;
                }
              }
            },
          )
          .subscribe((status, err) => {
            console.log(`[Location Stream] Subscription status: ${status}`);
            if (err) {
              console.error(`[Location Stream] Subscription error:`, err);
            }
          });
      }

      try {
        while (
          (channel?.state && channel?.state === REALTIME_CHANNEL_STATES.joined) ||
          queue.length > 0
        ) {
          if (queue.length === 0) {
            // Wait for new events
            await new Promise((resolve) => setTimeout(resolve, 100));
            continue;
          }
          const event = queue.shift();
          if (event) yield tracked(connectionId, event);
        }
      } finally {
        if (channel) {
          void supabase.removeChannel(channel);
        }
      }
    }),

  /**
   * Mutation variant for updating current user's location (non-stream)
   */
  updateLocation: protectedProcedure
    .input(locationDataSchema)
    .handler(async ({ context, input }) => {
      const [location] = await context.db
        .insert(locations)
        .values({
          userId: context.dbUser.id,
          latitude: input.latitude,
          longitude: input.longitude,
          accuracy: input.accuracy,
          altitude: input.altitude,
          altitudeAccuracy: input.altitudeAccuracy,
          heading: input.heading,
          speed: input.speed,
          timestamp: new Date(),
        })
        .onConflictDoUpdate({
          target: locations.userId,
          set: {
            latitude: input.latitude,
            longitude: input.longitude,
            accuracy: input.accuracy,
            altitude: input.altitude,
            altitudeAccuracy: input.altitudeAccuracy,
            heading: input.heading,
            speed: input.speed,
            timestamp: new Date(),
          },
        })
        .returning();

      return location;
    }),

  /**
   * Query variant to get current user's location (non-stream)
   */
  getMyLocation: protectedProcedure.handler(async ({ context }) => {
    const location = await context.db.query.locations.findFirst({
      where: (l, { eq }) => eq(l.userId, context.dbUser.id),
    });

    return location;
  }),

  /**
   * Query to get friends' last known locations (non-stream)
   */
  getFriendsLocations: protectedProcedure.handler(async ({ context }) => {
    const shareEntries = await context.db
      .select({ locationId: locationShares.locationId })
      .from(locationShares)
      .where(eq(locationShares.userId, context.dbUser.id));

    const locationIds = shareEntries.map((s) => s.locationId);

    const dbLocations =
      locationIds.length > 0
        ? await context.db.query.locations.findMany({
            where: (l, { and, eq, inArray }) =>
              and(eq(l.isSharingLocation, true), inArray(l.id, locationIds)),
            with: {
              user: {
                columns: { id: true, firstName: true, lastName: true, hasAvatar: true },
              },
            },
          })
        : [];

    const mapped = await Promise.all(
      dbLocations.map(async (location) => ({
        ...location,
        user: (await mapUserWithAvatar(context.supabase, location.user)) ?? undefined,
      })),
    );

    return mapped;
  }),

  /**
   * Get sharing settings for current user
   */
  getMySharingSettings: protectedProcedure.handler(
    async ({ context }): Promise<SharingSettings> => {
      const location = await context.db.query.locations.findFirst({
        where: (l, { eq }) => eq(l.userId, context.dbUser.id),
        with: {
          usersToShareWith: {
            with: {
              user: {
                columns: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  hasAvatar: true,
                },
              },
            },
          },
        },
      });

      if (!location) {
        return {
          isSharingLocation: false,
          usersToShareWith: [],
        };
      }

      const usersToShareWith = Array.isArray(location.usersToShareWith)
        ? location.usersToShareWith.map((share) => share.user).filter(Boolean)
        : [];

      const usersWithAvatars = await Promise.all(
        usersToShareWith.map((user) => mapUserWithAvatar(context.supabase, user)),
      );

      return {
        isSharingLocation: Boolean(location.isSharingLocation),
        usersToShareWith: usersWithAvatars.filter(Boolean) as SharingUser[],
      };
    },
  ),

  /**
   * Get users available for sharing selection
   */
  getAllUsersForSharing: protectedProcedure
    .input(
      z
        .object({
          tripId: z.string().optional(),
        })
        .optional(),
    )
    .handler(async ({ context, input }) => {
      const shareableUserIds = await getShareableUserIdsForCurrentUser({
        db: context.db,
        currentUserId: context.dbUser.id,
        tripId: input?.tripId,
      });

      if (shareableUserIds.size === 0) {
        return [];
      }

      const dbUsers = await context.db.query.users.findMany({
        where: (u, { inArray }) => inArray(u.id, [...shareableUserIds]),
        columns: {
          id: true,
          firstName: true,
          lastName: true,
          hasAvatar: true,
        },
        orderBy: (u, { asc }) => [asc(u.firstName), asc(u.lastName)],
      });

      const safeUsers = Array.isArray(dbUsers) ? dbUsers : [];

      const usersWithAvatars = await Promise.all(
        safeUsers.map((user) => mapUserWithAvatar(context.supabase, user)),
      );

      return usersWithAvatars.filter(Boolean) as SharingUser[];
    }),

  /**
   * Add a user to sharing list
   */
  addUserToSharing: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .handler(async ({ context, input }) => {
      await ensureUserInActiveTrip(context.db, context.dbUser.id);
      await assertShareableTargets({
        db: context.db,
        currentUserId: context.dbUser.id,
        targetUserIds: [input.userId],
      });

      const [locationRow] = await context.db
        .insert(locations)
        .values({
          userId: context.dbUser.id,
          timestamp: new Date(),
          isSharingLocation: true,
        })
        .onConflictDoUpdate({
          target: locations.userId,
          set: {
            timestamp: new Date(),
            isSharingLocation: true,
          },
        })
        .returning();

      if (!locationRow) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Failed to upsert location" });
      }

      await context.db
        .insert(locationShares)
        .values({ locationId: locationRow.id, userId: input.userId })
        .onConflictDoNothing();

      const shareUserIds = await context.db
        .select({ userId: locationShares.userId })
        .from(locationShares)
        .where(eq(locationShares.locationId, locationRow.id));

      const usersToShareWith =
        shareUserIds.length > 0
          ? await context.db.query.users.findMany({
              where: (u, { inArray }) =>
                inArray(
                  u.id,
                  shareUserIds.map((s) => s.userId),
                ),
              columns: {
                id: true,
                firstName: true,
                lastName: true,
                hasAvatar: true,
              },
            })
          : [];

      const usersWithAvatars = await Promise.all(
        usersToShareWith.map((user) => mapUserWithAvatar(context.supabase, user)),
      );

      return {
        success: true,
        usersToShareWith: usersWithAvatars.filter(Boolean) as SharingUser[],
      };
    }),

  /**
   * Remove a user from sharing list
   */
  removeUserFromSharing: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .handler(async ({ context, input }) => {
      await ensureUserInActiveTrip(context.db, context.dbUser.id);

      const location = await context.db.query.locations.findFirst({
        where: (l, { eq }) => eq(l.userId, context.dbUser.id),
        columns: { id: true },
      });

      if (!location) {
        return {
          success: true,
          usersToShareWith: [],
        };
      }

      await context.db
        .delete(locationShares)
        .where(
          and(eq(locationShares.locationId, location.id), eq(locationShares.userId, input.userId)),
        );

      const shareUserIds = await context.db
        .select({ userId: locationShares.userId })
        .from(locationShares)
        .where(eq(locationShares.locationId, location.id));

      const usersToShareWith =
        shareUserIds.length > 0
          ? await context.db.query.users.findMany({
              where: (u, { inArray }) =>
                inArray(
                  u.id,
                  shareUserIds.map((s) => s.userId),
                ),
              columns: {
                id: true,
                firstName: true,
                lastName: true,
                hasAvatar: true,
              },
            })
          : [];

      const usersWithAvatars = await Promise.all(
        usersToShareWith.map((user) => mapUserWithAvatar(context.supabase, user)),
      );

      return {
        success: true,
        usersToShareWith: usersWithAvatars.filter(Boolean) as SharingUser[],
      };
    }),

  /**
   * Send a location sharing request
   */
  requestLocationSharing: protectedProcedure
    .input(z.object({ receiverId: z.string() }))
    .handler(async ({ context, input }) => {
      await ensureUserInActiveTrip(context.db, context.dbUser.id);
      if (input.receiverId === context.dbUser.id) {
        throw new ORPCError("BAD_REQUEST", { message: "You cannot send a request to yourself" });
      }

      await assertShareableTargets({
        db: context.db,
        currentUserId: context.dbUser.id,
        targetUserIds: [input.receiverId],
      });

      const existingRequest = await context.db.query.locationSharingRequests.findFirst({
        where: (lsr, { and, eq }) =>
          and(eq(lsr.senderId, context.dbUser.id), eq(lsr.receiverId, input.receiverId)),
        orderBy: (lsr, { desc }) => [desc(lsr.createdAt)],
      });

      if (existingRequest) {
        if (existingRequest.status === "PENDING") {
          throw new ORPCError("BAD_REQUEST", { message: "Request already sent" });
        }
        if (existingRequest.status === "ACCEPTED") {
          throw new ORPCError("BAD_REQUEST", { message: "Location sharing already enabled" });
        }

        const [updated] = await context.db
          .update(locationSharingRequests)
          .set({ status: "PENDING", updatedAt: new Date() })
          .where(eq(locationSharingRequests.id, existingRequest.id))
          .returning();

        return { success: true, request: updated };
      }

      const [request] = await context.db
        .insert(locationSharingRequests)
        .values({
          senderId: context.dbUser.id,
          receiverId: input.receiverId,
          status: "PENDING",
        })
        .returning();

      return { success: true, request };
    }),

  /**
   * Accept a location sharing request
   */
  acceptLocationSharingRequest: protectedProcedure
    .input(z.object({ requestId: z.string() }))
    .handler(async ({ context, input }) => {
      await ensureUserInActiveTrip(context.db, context.dbUser.id);
      const request = await context.db.query.locationSharingRequests.findFirst({
        where: (lsr, { eq }) => eq(lsr.id, input.requestId),
      });

      if (!request) {
        throw new ORPCError("NOT_FOUND", { message: "Request not found" });
      }

      if (request.receiverId !== context.dbUser.id) {
        throw new ORPCError("FORBIDDEN", { message: "You can only accept requests sent to you" });
      }

      if (request.status !== "PENDING") {
        throw new ORPCError("BAD_REQUEST", { message: "Request is not pending" });
      }

      // Wrap all operations in a transaction for atomicity
      const result = await context.db.transaction(async (tx) => {
        // Update request status
        const [updatedRequest] = await tx
          .update(locationSharingRequests)
          .set({ status: "ACCEPTED" })
          .where(eq(locationSharingRequests.id, input.requestId))
          .returning();

        // Upsert sender location
        const [senderLocation] = await tx
          .insert(locations)
          .values({
            userId: request.senderId,
            timestamp: new Date(),
            isSharingLocation: true,
          })
          .onConflictDoUpdate({
            target: locations.userId,
            set: { timestamp: new Date(), isSharingLocation: true },
          })
          .returning();

        if (!senderLocation) {
          throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: "Failed to upsert sender location",
          });
        }

        // Add sender -> receiver share
        await tx
          .insert(locationShares)
          .values({ locationId: senderLocation.id, userId: request.receiverId })
          .onConflictDoNothing();

        // Upsert receiver location
        const [receiverLocation] = await tx
          .insert(locations)
          .values({
            userId: request.receiverId,
            timestamp: new Date(),
            isSharingLocation: true,
          })
          .onConflictDoUpdate({
            target: locations.userId,
            set: { timestamp: new Date(), isSharingLocation: true },
          })
          .returning();

        if (!receiverLocation) {
          throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: "Failed to upsert receiver location",
          });
        }

        // Add receiver -> sender share
        await tx
          .insert(locationShares)
          .values({ locationId: receiverLocation.id, userId: request.senderId })
          .onConflictDoNothing();

        return updatedRequest;
      });

      return { success: true, request: result };
    }),

  /**
   * Reject a location sharing request
   */
  rejectLocationSharingRequest: protectedProcedure
    .input(z.object({ requestId: z.string() }))
    .handler(async ({ context, input }) => {
      await ensureUserInActiveTrip(context.db, context.dbUser.id);
      const request = await context.db.query.locationSharingRequests.findFirst({
        where: (lsr, { eq }) => eq(lsr.id, input.requestId),
      });

      if (!request) {
        throw new ORPCError("NOT_FOUND", { message: "Request not found" });
      }

      if (request.receiverId !== context.dbUser.id) {
        throw new ORPCError("FORBIDDEN", { message: "You can only reject requests sent to you" });
      }

      const [updatedRequest] = await context.db
        .update(locationSharingRequests)
        .set({ status: "REJECTED" })
        .where(eq(locationSharingRequests.id, input.requestId))
        .returning();

      return { success: true, request: updatedRequest };
    }),

  /**
   * Get pending location sharing requests
   */
  getPendingLocationSharingRequests: protectedProcedure.handler(async ({ context }) => {
    const requests = await context.db.query.locationSharingRequests.findMany({
      where: (lsr, { and, eq }) =>
        and(eq(lsr.receiverId, context.dbUser.id), eq(lsr.status, "PENDING")),
      with: {
        sender: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            hasAvatar: true,
          },
        },
      },
      orderBy: (lsr, { desc }) => [desc(lsr.createdAt)],
    });

    return await Promise.all(
      requests.map(async (request) => ({
        ...request,
        sender: await mapUserWithAvatar(context.supabase, request.sender),
      })),
    );
  }),

  /**
   * Get all location sharing requests (sent and received)
   */
  getMyLocationSharingRequests: protectedProcedure.handler(async ({ context }) => {
    const [sent, received] = await Promise.all([
      context.db.query.locationSharingRequests.findMany({
        where: (lsr, { eq }) => eq(lsr.senderId, context.dbUser.id),
        with: {
          receiver: {
            columns: {
              id: true,
              firstName: true,
              lastName: true,
              hasAvatar: true,
            },
          },
        },
        orderBy: (lsr, { desc }) => [desc(lsr.createdAt)],
      }),
      context.db.query.locationSharingRequests.findMany({
        where: (lsr, { eq }) => eq(lsr.receiverId, context.dbUser.id),
        with: {
          sender: {
            columns: {
              id: true,
              firstName: true,
              lastName: true,
              hasAvatar: true,
            },
          },
        },
        orderBy: (lsr, { desc }) => [desc(lsr.createdAt)],
      }),
    ]);

    return {
      sent: await Promise.all(
        sent.map(async (request) => ({
          ...request,
          receiver: await mapUserWithAvatar(context.supabase, request.receiver),
        })),
      ),
      received: await Promise.all(
        received.map(async (request) => ({
          ...request,
          sender: await mapUserWithAvatar(context.supabase, request.sender),
        })),
      ),
    };
  }),
});
