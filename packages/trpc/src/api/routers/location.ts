import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
} from "../../api/trpc";
import {
  locationDataSchema,
  calculateDistance,
  latitudeSchema,
  longitudeSchema,
} from "../../utils/location-validation";
import {
  type RealtimeChannel,
  REALTIME_CHANNEL_STATES,
} from "@integral-2025-app/supabase";
import type {
  Location as DbLocation,
  PrismaClient,
} from "@integral-2025-app/db";
import { TRPCError, tracked } from "@trpc/server";

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

type FriendLocationEvent =
  | { id: string; type: "upsert"; location: LocationWithUser }
  | { id: string; type: "delete"; userId: string };

interface SharingUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  image: string | null;
}

interface SharingSettings {
  isSharingLocation: boolean;
  usersToShareWith: SharingUser[];
}

/**
 * Convert database location to Expo-compliant format
 */
function toExpoLocation(dbLocation: DbLocation): ExpoLocationObject {
  return {
    coords: {
      latitude: dbLocation.latitude?.toNumber() ?? 0,
      longitude: dbLocation.longitude?.toNumber() ?? 0,
      altitude: dbLocation.altitude?.toNumber() ?? null,
      accuracy: dbLocation.accuracy?.toNumber() ?? null,
      altitudeAccuracy: dbLocation.altitudeAccuracy?.toNumber() ?? null,
      heading: dbLocation.heading?.toNumber() ?? null,
      speed: dbLocation.speed?.toNumber() ?? null,
    },
    timestamp: dbLocation.timestamp.getTime(),
  };
}

/**
 * Convert database location with user to extended format
 */
async function toLocationWithUser(
  db: PrismaClient,
  dbLocation: DbLocation,
): Promise<LocationWithUser> {
  const expoLocation = toExpoLocation(dbLocation);
  const user = await db.user.findUnique({
    where: { id: dbLocation.userId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      image: true,
    },
  });

  return {
    ...expoLocation,
    isSharingLocation: dbLocation.isSharingLocation,
    user: user ?? undefined,
  };
}

export const locationRouter = createTRPCRouter({
  /**
   * WebSocket subscription for updating current user's location
   * Client sends location updates through this subscription
   */
  updateLocationStream: protectedProcedure
    .input(locationDataSchema)
    .subscription(async function* ({ ctx, input }) {
      // Update location in database
      const location = await ctx.db.location.upsert({
        where: { userId: ctx.dbUser.id, isSharingLocation: true },
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
          userId: ctx.dbUser.id,
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
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { isSharingLocation, userIdsToShareWith } = input;

      // Upsert location for user
      const updatedLocation = await ctx.db.location.upsert({
        where: { userId: ctx.dbUser.id },
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
          userId: ctx.dbUser.id,
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
    .subscription(async function* ({ ctx, input }) {
      const supabase = ctx.supabase;
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
      const locations = await ctx.db.location.findMany({
        where: {
          isSharingLocation: true,
          usersToShareWith: {
            some: { id: ctx.dbUser.id },
          },
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              image: true,
            },
          },
        },
      });

      // Track which friends are currently within the radius (when radius filtering is used)
      const inRadius = new Set<string>();

      for (const location of locations) {
        const lw = await toLocationWithUser(ctx.db, location);
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

      console.log(
        `[Location Stream] Setting up subscription for user ${ctx.dbUser.id}, watching ${friendIds.length} friends`,
      );
      console.log(`[Location Stream] Friend IDs: [${friendIds.join(", ")}]`);

      if (friendIds.length > 0) {
        // Subskrybuj zmiany tylko dla lokalizacji znajomych (jeden kanał, filtr in)
        const filter = `userId=in.(${friendIds.join(",")})`;
        console.log(`[Location Stream] Filter: ${filter}`);
        console.log(`[Location Stream] Testing WITHOUT filter first...`);

        channel = supabase
          .channel(`friends_locations_${ctx.dbUser.id}`)
          .on<DbLocation>(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "Location",
              // TEMPORARILY REMOVED FILTER FOR TESTING
              // filter,
            },
            (payload) => {
              switch (payload.eventType) {
                case "DELETE": {
                  const userId = payload.old.userId!;
                  console.log(
                    `[Location Stream] DELETE event for userId: ${userId}`,
                  );
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
                  console.log(
                    `[Location Stream] ${payload.eventType} event for userId: ${newLocation.userId}, coords: [${newLocation.latitude?.toString()}, ${newLocation.longitude?.toString()}]`,
                  );

                  const userIdFromEvent = newLocation.userId;
                  if (!userIdFromEvent) {
                    console.error(`[Location Stream] No userId in payload`);
                    return;
                  }

                  if (!newLocation.userId || !newLocation.timestamp) {
                    console.log(
                      `[Location Stream] payload.new is incomplete, fetching from DB for userId: ${userIdFromEvent}`,
                    );
                    void ctx.db.location
                      .findUnique({
                        where: { userId: userIdFromEvent },
                        include: {
                          user: {
                            select: {
                              id: true,
                              firstName: true,
                              lastName: true,
                              image: true,
                            },
                          },
                        },
                      })
                      .then((dbLocation) => {
                        if (!dbLocation) {
                          console.error(
                            `[Location Stream] Location not found in DB for userId: ${userIdFromEvent}`,
                          );
                          return;
                        }

                        const location: LocationWithUser = {
                          coords: {
                            latitude: dbLocation.latitude?.toNumber() ?? 0,
                            longitude: dbLocation.longitude?.toNumber() ?? 0,
                            altitude: dbLocation.altitude?.toNumber() ?? null,
                            accuracy: dbLocation.accuracy?.toNumber() ?? null,
                            altitudeAccuracy:
                              dbLocation.altitudeAccuracy?.toNumber() ?? null,
                            heading: dbLocation.heading?.toNumber() ?? null,
                            speed: dbLocation.speed?.toNumber() ?? null,
                          },
                          timestamp: dbLocation.timestamp.getTime(),
                          isSharingLocation: dbLocation.isSharingLocation,
                          user: dbLocation.user ?? undefined,
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

                  void toLocationWithUser(ctx.db, newLocation).then(
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

        console.log(`[Location Stream] Waiting for channel to join...`);
        console.log(
          `[Location Stream] Channel state after subscribe: ${channel?.state}`,
        );

        // Wait a bit for subscription to establish
        await new Promise((resolve) => setTimeout(resolve, 1000));
        console.log(
          `[Location Stream] Channel state after 1s: ${channel?.state}`,
        );
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
    .mutation(async ({ ctx, input }) => {
      const location = await ctx.db.location.upsert({
        where: { userId: ctx.dbUser.id },
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
          userId: ctx.dbUser.id,
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
  getMyLocation: protectedProcedure.query(async ({ ctx }) => {
    const location = await ctx.db.location.findUnique({
      where: { userId: ctx.dbUser.id },
    });

    return location;
  }),

  /**
   * Query to get friends' last known locations (non-stream)
   */
  getFriendsLocations: protectedProcedure.query(async ({ ctx }) => {
    const locations = await ctx.db.location.findMany({
      where: {
        isSharingLocation: true,
        usersToShareWith: {
          some: { id: ctx.dbUser.id },
        },
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, image: true },
        },
      },
    });

    return locations;
  }),

  /**
   * Get sharing settings for current user
   */
  getMySharingSettings: protectedProcedure.query(
    async ({ ctx }): Promise<SharingSettings> => {
      const location = await ctx.db.location.findUnique({
        where: { userId: ctx.dbUser.id },
        include: {
          usersToShareWith: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              image: true,
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

      return {
        isSharingLocation: Boolean(location.isSharingLocation),
        usersToShareWith: usersToShareWith.map(
          (user): SharingUser => ({
            id: String(user.id),
            firstName: user.firstName ?? null,
            lastName: user.lastName ?? null,
            image: user.image ?? null,
          }),
        ),
      };
    },
  ),

  /**
   * Get all users (for sharing selection) - moderator only
   */
  getAllUsersForSharing: protectedProcedure.query(async ({ ctx }) => {
    const users = await ctx.db.user.findMany({
      where: {
        id: { not: ctx.dbUser.id }, // Exclude current user
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        image: true,
      },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    });

    const safeUsers = Array.isArray(users) ? users : [];

    return safeUsers.map(
      (user): SharingUser => ({
        id: String(user.id),
        firstName: user.firstName ?? null,
        lastName: user.lastName ?? null,
        image: user.image ?? null,
      }),
    );
  }),

  /**
   * Add a user to sharing list
   */
  addUserToSharing: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const location = await ctx.db.location.upsert({
        where: { userId: ctx.dbUser.id },
        update: {
          usersToShareWith: {
            connect: { id: input.userId },
          },
        },
        create: {
          userId: ctx.dbUser.id,
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
              image: true,
            },
          },
        },
      });

      return {
        success: true,
        usersToShareWith: location.usersToShareWith.map(
          (user): SharingUser => ({
            id: String(user.id),
            firstName: user.firstName ?? null,
            lastName: user.lastName ?? null,
            image: user.image ?? null,
          }),
        ),
      };
    }),

  /**
   * Remove a user from sharing list
   */
  removeUserFromSharing: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const location = await ctx.db.location.update({
        where: { userId: ctx.dbUser.id },
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
              image: true,
            },
          },
        },
      });

      return {
        success: true,
        usersToShareWith: location.usersToShareWith.map(
          (user): SharingUser => ({
            id: String(user.id),
            firstName: user.firstName ?? null,
            lastName: user.lastName ?? null,
            image: user.image ?? null,
          }),
        ),
      };
    }),
});
