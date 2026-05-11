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
import type {
  Location as DbLocation,
  PrismaClient,
} from "@mirai-app/db";
import { TRPCError, tracked } from "../../api/trpc";
import { ensureTripNotEnded } from "../../utils/tripGuards";

/**
 * Check if user is in any active trips (not ended)
 */
async function ensureUserInActiveTrip(
  db: PrismaClient,
  userId: string,
): Promise<void> {
  const memberships = await db.tripParticipant.findMany({
    where: { userId },
    include: {
      trip: {
        select: { id: true, endDate: true },
      },
    },
  });

  if (memberships.length === 0) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Location sharing requires trip participation",
    });
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
  throw new TRPCError({
    code: "FORBIDDEN",
    message: "Location sharing is not available for past trips",
  });
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

const getUserAvatarPath = (userId: string): string =>
  `avatar/${userId}.${AVATAR_FILE_EXTENSION}`;

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
  db: PrismaClient,
  supabase: SupabaseClient,
  dbLocation: DbLocation,
): Promise<LocationWithUser> {
  const expoLocation = toExpoLocation(dbLocation);
  const user = await db.user.findUnique({
    where: { id: dbLocation.userId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      hasAvatar: true,
    },
  });

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
  db: PrismaClient;
  currentUserId: string;
  tripId?: string;
}): Promise<Set<string>> {
  let scopedTripIds: string[] = [];

  if (tripId) {
    const isMember = await db.tripParticipant.findFirst({
      where: {
        tripId,
        userId: currentUserId,
      },
      select: { id: true },
    });

    if (!isMember) {
      return new Set();
    }

    scopedTripIds = [tripId];
  } else {
    const memberships = await db.tripParticipant.findMany({
      where: { userId: currentUserId },
      select: { tripId: true },
    });
    scopedTripIds = memberships.map((membership) => membership.tripId);
  }

  if (scopedTripIds.length === 0) {
    return new Set();
  }

  const participants = await db.tripParticipant.findMany({
    where: {
      tripId: { in: scopedTripIds },
      userId: { not: currentUserId },
    },
    select: { userId: true },
    distinct: ["userId"],
  });

  return new Set(participants.map((participant) => participant.userId));
}

async function assertShareableTargets({
  db,
  currentUserId,
  targetUserIds,
  tripId,
  allowAlreadyShared = false,
}: {
  db: PrismaClient;
  currentUserId: string;
  targetUserIds: string[];
  tripId?: string;
  allowAlreadyShared?: boolean;
}): Promise<void> {
  const uniqueTargetUserIds = [...new Set(targetUserIds)];
  if (uniqueTargetUserIds.length === 0) return;

  if (uniqueTargetUserIds.some((targetId) => targetId === currentUserId)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "You cannot share location settings with yourself",
    });
  }

  const allowedIds = await getShareableUserIdsForCurrentUser({
    db,
    currentUserId,
    tripId,
  });

  if (allowAlreadyShared) {
    const location = await db.location.findUnique({
      where: { userId: currentUserId },
      select: {
        usersToShareWith: {
          select: { id: true },
        },
      },
    });

    for (const user of location?.usersToShareWith ?? []) {
      allowedIds.add(user.id);
    }
  }

  const invalidTargetIds = uniqueTargetUserIds.filter(
    (targetId) => !allowedIds.has(targetId),
  );

  if (invalidTargetIds.length > 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message:
        "One or more selected users are outside your allowed sharing scope",
    });
  }
}

export const locationRouter = createORPCRouter({
  /**
   * WebSocket subscription for updating current user's location
   * Client sends location updates through this subscription
   */
  updateLocationStream: protectedProcedure
    .input(locationDataSchema)
    .handler(async function* ({ context, input }) {
      // Update location in database
      const location = await context.db.location.upsert({
        where: { userId: context.dbUser.id, isSharingLocation: true },
        update: {
          latitude: input.latitude,
          longitude: input.longitude,
          accuracy: input.accuracy,
          altitude: input.altitude,
          altitudeAccuracy: input.altitudeAccuracy,
          heading: input.heading,
          speed: input.speed,
          timestamp: new Date(),
        },
        create: {
          userId: context.dbUser.id,
          latitude: input.latitude,
          longitude: input.longitude,
          accuracy: input.accuracy,
          altitude: input.altitude,
          altitudeAccuracy: input.altitudeAccuracy,
          heading: input.heading,
          speed: input.speed,
          timestamp: new Date(),
        },
      });
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
      const updatedLocation = await context.db.location.upsert({
        where: { userId: context.dbUser.id },
        update: {
          isSharingLocation,
          usersToShareWith: userIdsToShareWith
            ? {
                set: userIdsToShareWith.map((id) => ({ id })),
              }
            : undefined,
          timestamp: new Date(),
        },
        create: {
          userId: context.dbUser.id,
          isSharingLocation,
          timestamp: new Date(),
          usersToShareWith: userIdsToShareWith
            ? {
                connect: userIdsToShareWith.map((id) => ({ id })),
              }
            : undefined,
        },
        select: {
          isSharingLocation: true,
          usersToShareWith: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              hasAvatar: true,
            },
          },
        },
      });

      return updatedLocation;
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
      if (
        radiusKm !== undefined &&
        (latitude === undefined || longitude === undefined)
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "When providing radiusKm, both latitude and longitude are required",
        });
      }

      // Emituj początkowe lokalizacje znajomych (filtrowane jeśli radius podany)
      const locations = await context.db.location.findMany({
        where: {
          isSharingLocation: true,
          usersToShareWith: {
            some: { id: context.dbUser.id },
          },
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      // Track which friends are currently within the radius (when radius filtering is used)
      const inRadius = new Set<string>();

      for (const location of locations) {
        const lw = await toLocationWithUser(context.db, context.supabase, location);
        if (radiusKm !== undefined) {
          if (!location.latitude || !location.longitude) continue;
          const dist = calculateDistance(
            latitude!,
            longitude!,
            Number(location.latitude),
            Number(location.longitude),
          );
          if (dist <= radiusKm) {
            inRadius.add(location.userId);
            yield tracked(connectionId, {
              type: "upsert",
              location: { ...lw },
            });
          }
        } else {
          yield tracked(connectionId, { type: "upsert", location: lw });
        }
      }

      const friendIds = locations.map((l) => l.userId);
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
                  if (
                    !userIdFromEvent ||
                    !allowedFriendIds.has(userIdFromEvent)
                  ) {
                    return;
                  }

                  if (!newLocation.userId || !newLocation.timestamp) {
                    void context.db.location
                      .findUnique({
                        where: { userId: userIdFromEvent },
                        include: {
                          user: {
                            select: {
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
                            altitudeAccuracy:
                              dbLocation.altitudeAccuracy ?? null,
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
          (channel?.state &&
            channel?.state === REALTIME_CHANNEL_STATES.joined) ||
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
      const location = await context.db.location.upsert({
        where: { userId: context.dbUser.id },
        update: {
          latitude: input.latitude,
          longitude: input.longitude,
          accuracy: input.accuracy,
          altitude: input.altitude,
          altitudeAccuracy: input.altitudeAccuracy,
          heading: input.heading,
          speed: input.speed,
          timestamp: new Date(),
        },
        create: {
          userId: context.dbUser.id,
          latitude: input.latitude,
          longitude: input.longitude,
          accuracy: input.accuracy,
          altitude: input.altitude,
          altitudeAccuracy: input.altitudeAccuracy,
          heading: input.heading,
          speed: input.speed,
          timestamp: new Date(),
        },
      });

      return location;
    }),

  /**
   * Query variant to get current user's location (non-stream)
   */
  getMyLocation: protectedProcedure.handler(async ({ context }) => {
    const location = await context.db.location.findUnique({
      where: { userId: context.dbUser.id },
    });

    return location;
  }),

  /**
   * Query to get friends' last known locations (non-stream)
   */
  getFriendsLocations: protectedProcedure.handler(async ({ context }) => {
    const locations = await context.db.location.findMany({
      where: {
        isSharingLocation: true,
        usersToShareWith: {
          some: { id: context.dbUser.id },
        },
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, hasAvatar: true },
        },
      },
    });

    const mapped = await Promise.all(
      locations.map(async (location) => ({
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
      const location = await context.db.location.findUnique({
        where: { userId: context.dbUser.id },
        include: {
          usersToShareWith: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              hasAvatar: true,
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
        ? location.usersToShareWith
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

      const users = await context.db.user.findMany({
        where: {
          id: { in: [...shareableUserIds] },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          hasAvatar: true,
        },
        orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      });

      const safeUsers = Array.isArray(users) ? users : [];

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

      const location = await context.db.location.upsert({
        where: { userId: context.dbUser.id },
        update: {
          usersToShareWith: {
            connect: { id: input.userId },
          },
        },
        create: {
          userId: context.dbUser.id,
          timestamp: new Date(),
          isSharingLocation: true,
          usersToShareWith: {
            connect: { id: input.userId },
          },
        },
        include: {
          usersToShareWith: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              hasAvatar: true,
            },
          },
        },
      });

      const usersWithAvatars = await Promise.all(
        location.usersToShareWith.map((user) => mapUserWithAvatar(context.supabase, user)),
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
      const location = await context.db.location.update({
        where: { userId: context.dbUser.id },
        data: {
          usersToShareWith: {
            disconnect: { id: input.userId },
          },
        },
        include: {
          usersToShareWith: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              hasAvatar: true,
            },
          },
        },
      });

      const usersWithAvatars = await Promise.all(
        location.usersToShareWith.map((user) => mapUserWithAvatar(context.supabase, user)),
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
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot send a request to yourself",
        });
      }

      await assertShareableTargets({
        db: context.db,
        currentUserId: context.dbUser.id,
        targetUserIds: [input.receiverId],
      });

      const existingRequest = await context.db.locationSharingRequest.findFirst({
        where: {
          senderId: context.dbUser.id,
          receiverId: input.receiverId,
        },
        orderBy: { createdAt: "desc" },
      });

      if (existingRequest) {
        if (existingRequest.status === "PENDING") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Request already sent",
          });
        }
        if (existingRequest.status === "ACCEPTED") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Location sharing already enabled",
          });
        }

        const updated = await context.db.locationSharingRequest.update({
          where: { id: existingRequest.id },
          data: { status: "PENDING", updatedAt: new Date() },
        });
        return { success: true, request: updated };
      }

      const request = await context.db.locationSharingRequest.create({
        data: {
          senderId: context.dbUser.id,
          receiverId: input.receiverId,
          status: "PENDING",
        },
      });

      return { success: true, request };
    }),

  /**
   * Accept a location sharing request
   */
  acceptLocationSharingRequest: protectedProcedure
    .input(z.object({ requestId: z.string() }))
    .handler(async ({ context, input }) => {
      await ensureUserInActiveTrip(context.db, context.dbUser.id);
      const request = await context.db.locationSharingRequest.findUnique({
        where: { id: input.requestId },
      });

      if (!request) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Request not found",
        });
      }

      if (request.receiverId !== context.dbUser.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only accept requests sent to you",
        });
      }

      if (request.status !== "PENDING") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Request is not pending",
        });
      }

      // Wrap all operations in a transaction for atomicity
      const result = await context.db.$transaction(async (tx) => {
        // Update request status
        const updatedRequest = await tx.locationSharingRequest.update({
          where: { id: input.requestId },
          data: { status: "ACCEPTED" },
        });

        // Add both users to each other's sharing lists
        // Sender shares with receiver
        await tx.location.upsert({
          where: { userId: request.senderId },
          update: {
            usersToShareWith: {
              connect: { id: request.receiverId },
            },
          },
          create: {
            userId: request.senderId,
            timestamp: new Date(),
            isSharingLocation: true,
            usersToShareWith: {
              connect: { id: request.receiverId },
            },
          },
        });

        // Receiver shares with sender
        await tx.location.upsert({
          where: { userId: request.receiverId },
          update: {
            usersToShareWith: {
              connect: { id: request.senderId },
            },
          },
          create: {
            userId: request.receiverId,
            timestamp: new Date(),
            isSharingLocation: true,
            usersToShareWith: {
              connect: { id: request.senderId },
            },
          },
        });

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
      const request = await context.db.locationSharingRequest.findUnique({
        where: { id: input.requestId },
      });

      if (!request) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Request not found",
        });
      }

      if (request.receiverId !== context.dbUser.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only reject requests sent to you",
        });
      }

      const updatedRequest = await context.db.locationSharingRequest.update({
        where: { id: input.requestId },
        data: { status: "REJECTED" },
      });

      return { success: true, request: updatedRequest };
    }),

  /**
   * Get pending location sharing requests
   */
  getPendingLocationSharingRequests: protectedProcedure.handler(
    async ({ context }) => {
      const requests = await context.db.locationSharingRequest.findMany({
        where: {
          receiverId: context.dbUser.id,
          status: "PENDING",
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              hasAvatar: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return await Promise.all(
        requests.map(async (request) => ({
          ...request,
          sender: await mapUserWithAvatar(context.supabase, request.sender),
        })),
      );
    },
  ),

  /**
   * Get all location sharing requests (sent and received)
   */
  getMyLocationSharingRequests: protectedProcedure.handler(async ({ context }) => {
    const [sent, received] = await Promise.all([
      context.db.locationSharingRequest.findMany({
        where: { senderId: context.dbUser.id },
        include: {
          receiver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              hasAvatar: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      context.db.locationSharingRequest.findMany({
        where: { receiverId: context.dbUser.id },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              hasAvatar: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
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
