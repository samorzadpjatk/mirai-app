import { z } from "zod";
import { observable } from "@trpc/server/observable";
import {
  createTRPCRouter,
  protectedProcedure,
  moderatorProcedure,
} from "../../api/trpc";
import {
  locationDataSchema,
  calculateDistance,
  latitudeSchema,
  longitudeSchema,
} from "../../utils/location-validation";
import {
  createSupabaseClient,
  type RealtimePostgresChangesPayload,
  type RealtimeChannel,
} from "@integral-2025-app/supabase";

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
  userId: string;
  isSharingLocation: boolean;
  user?: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

/**
 * Database location type (simplified)
 */
interface DbLocation {
  id: string;
  userId: string;
  latitude: { toNumber: () => number } | null;
  longitude: { toNumber: () => number } | null;
  altitude: { toNumber: () => number } | null;
  accuracy: { toNumber: () => number } | null;
  altitudeAccuracy: { toNumber: () => number } | null;
  heading: { toNumber: () => number } | null;
  speed: { toNumber: () => number } | null;
  timestamp: Date;
  isSharingLocation: boolean;
  user?: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

/**
 * Convert database location to Expo-compliant format
 */
function toExpoLocation(dbLocation: DbLocation): ExpoLocationObject {
  return {
    coords: {
      latitude: dbLocation.latitude ? dbLocation.latitude.toNumber() : 0,
      longitude: dbLocation.longitude ? dbLocation.longitude.toNumber() : 0,
      altitude: dbLocation.altitude ? dbLocation.altitude.toNumber() : null,
      accuracy: dbLocation.accuracy ? dbLocation.accuracy.toNumber() : null,
      altitudeAccuracy: dbLocation.altitudeAccuracy ? dbLocation.altitudeAccuracy.toNumber() : null,
      heading: dbLocation.heading ? dbLocation.heading.toNumber() : null,
      speed: dbLocation.speed ? dbLocation.speed.toNumber() : null,
    },
    timestamp: dbLocation.timestamp.getTime(),
  };
}

/**
 * Convert database location with user to extended format
 */
function toLocationWithUser(dbLocation: DbLocation): LocationWithUser {
  const expoLocation = toExpoLocation(dbLocation);
  return {
    ...expoLocation,
    userId: dbLocation.userId,
    isSharingLocation: dbLocation.isSharingLocation,
    user: dbLocation.user,
  };
}

export const locationRouter = createTRPCRouter({
  /**
   * WebSocket subscription for updating current user's location
   * Client sends location updates through this subscription
   */
  updateLocationStream: protectedProcedure
    .input(locationDataSchema)
    .subscription(async ({ ctx, input }) => {
      // Update location in database
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

      // Return Expo-compliant location object
      return observable<ExpoLocationObject>((emit) => {
        emit.next(toExpoLocation(location));
        emit.complete();
        return () => {
          // Cleanup
        };
      });
    }),

  /**
   * @deprecated Use updateLocationStream with WebSocket for real-time updates
   * Update current user's location (HTTP mutation for backwards compatibility)
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
   * @deprecated Use Expo Location API directly on client side for device location
   * Get current user's location (HTTP query for backwards compatibility)
   */
  getMyLocation: protectedProcedure.query(async ({ ctx }) => {
    const location = await ctx.db.location.findUnique({
      where: { userId: ctx.dbUser.id },
    });

    return location;
  }),

  /**
   * Update location sharing settings
   * Note: This remains a mutation as it's a configuration change, not a location update
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

      // Get or create location for user
      let location = await ctx.db.location.findUnique({
        where: { userId: ctx.dbUser.id },
      });

      location ??= await ctx.db.location.create({
        data: {
          userId: ctx.dbUser.id,
          isSharingLocation,
        },
      });

      // Update sharing settings
      const updatedLocation = await ctx.db.location.update({
        where: { userId: ctx.dbUser.id },
        data: {
          isSharingLocation,
          usersToShareWith: userIdsToShareWith
            ? {
                set: userIdsToShareWith.map((id) => ({ id })),
              }
            : undefined,
        },
        include: {
          usersToShareWith: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return updatedLocation;
    }),

  /**
   * WebSocket subscription for getting locations of friends
   * Returns real-time updates when friends' locations change
   */
  getFriendsLocationsStream: protectedProcedure.subscription(({ ctx }) => {
    return observable<LocationWithUser[]>((emit) => {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        emit.error(
          new Error("Supabase URL and Key are required for realtime subscriptions")
        );
        return;
      }

      const supabase = createSupabaseClient(supabaseUrl, supabaseKey);
      let channel: RealtimeChannel | null = null;

      const fetchAndEmitLocations = async () => {
        const locations = await ctx.db.location.findMany({
          where: {
            isSharingLocation: true,
            usersToShareWith: {
              some: {
                id: ctx.dbUser.id,
              },
            },
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        });

        emit.next(locations.map(toLocationWithUser));
      };

      const setupSubscription = async () => {
        try {
          // Send initial locations
          await fetchAndEmitLocations();

          // Subscribe to Location table changes
          channel = supabase
            .channel(`friends_locations_${ctx.dbUser.id}`)
            .on(
              "postgres_changes",
              {
                event: "*",
                schema: "public",
                table: "Location",
              },
              () => {
                // Refresh all friend locations on any change
                void fetchAndEmitLocations();
              }
            )
            .subscribe();
        } catch (err) {
          emit.error(err as Error);
        }
      };

      void setupSubscription();

      return () => {
        if (channel) {
          void supabase.removeChannel(channel);
        }
      };
    });
  }),

  /**
   * @deprecated Use getFriendsLocationsStream with WebSocket for real-time updates
   * Get locations of friends (HTTP query for backwards compatibility)
   */
  getFriendsLocations: protectedProcedure.query(async ({ ctx }) => {
    const locations = await ctx.db.location.findMany({
      where: {
        isSharingLocation: true,
        usersToShareWith: {
          some: {
            id: ctx.dbUser.id,
          },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return locations;
  }),

  /**
   * WebSocket subscription for searching users within a radius
   * Returns real-time updates as users move in/out of range
   */
  searchUsersInRadiusStream: protectedProcedure
    .input(
      z.object({
        latitude: latitudeSchema,
        longitude: longitudeSchema,
        radiusKm: z.number().positive().max(1000), // Max 1000km
      }),
    )
    .subscription(({ ctx, input }) => {
      return observable<(LocationWithUser & { distance: number })[]>((emit) => {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
          emit.error(
            new Error("Supabase URL and Key are required for realtime subscriptions")
          );
          return;
        }

        const supabase = createSupabaseClient(supabaseUrl, supabaseKey);
        let channel: RealtimeChannel | null = null;

        const { latitude, longitude, radiusKm } = input;

        const fetchAndEmitUsersInRadius = async () => {
          // Get all locations that are sharing and include the current user in sharing list
          const allLocations = await ctx.db.location.findMany({
            where: {
              isSharingLocation: true,
              usersToShareWith: {
                some: {
                  id: ctx.dbUser.id,
                },
              },
              latitude: { not: null },
              longitude: { not: null },
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
            },
          });

          // Filter by distance and add distance property
          const usersInRadius = allLocations
            .filter((location) => {
              if (!location.latitude || !location.longitude) return false;

              const distance = calculateDistance(
                latitude,
                longitude,
                Number(location.latitude),
                Number(location.longitude),
              );

              return distance <= radiusKm;
            })
            .map((location) => ({
              ...toLocationWithUser(location),
              distance: calculateDistance(
                latitude,
                longitude,
                Number(location.latitude!),
                Number(location.longitude!),
              ),
            }))
            .sort((a, b) => a.distance - b.distance);

          emit.next(usersInRadius);
        };

        const setupSubscription = async () => {
          try {
            // Send initial results
            await fetchAndEmitUsersInRadius();

            // Subscribe to Location table changes
            channel = supabase
              .channel(`radius_search_${ctx.dbUser.id}`)
              .on(
                "postgres_changes",
                {
                  event: "*",
                  schema: "public",
                  table: "Location",
                },
                () => {
                  // Recalculate users in radius on any location change
                  void fetchAndEmitUsersInRadius();
                }
              )
              .subscribe();
          } catch (err) {
            emit.error(err as Error);
          }
        };

        void setupSubscription();

        return () => {
          if (channel) {
            void supabase.removeChannel(channel);
          }
        };
      });
    }),

  /**
   * @deprecated Use searchUsersInRadiusStream with WebSocket for real-time updates
   * Search for users within a radius (HTTP query for backwards compatibility)
   */
  searchUsersInRadius: protectedProcedure
    .input(
      z.object({
        latitude: latitudeSchema,
        longitude: longitudeSchema,
        radiusKm: z.number().positive().max(1000),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { latitude, longitude, radiusKm } = input;

      const allLocations = await ctx.db.location.findMany({
        where: {
          isSharingLocation: true,
          usersToShareWith: {
            some: {
              id: ctx.dbUser.id,
            },
          },
          latitude: { not: null },
          longitude: { not: null },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      });

      const usersInRadius = allLocations
        .filter((location) => {
          if (!location.latitude || !location.longitude) return false;

          const distance = calculateDistance(
            latitude,
            longitude,
            Number(location.latitude),
            Number(location.longitude),
          );

          return distance <= radiusKm;
        })
        .map((location) => ({
          ...location,
          distance: calculateDistance(
            latitude,
            longitude,
            Number(location.latitude!),
            Number(location.longitude!),
          ),
        }))
        .sort((a, b) => a.distance - b.distance);

      return usersInRadius;
    }),

  /**
   * Get sharing settings for current user
   */
  getMySharingSettings: protectedProcedure.query(async ({ ctx }) => {
    const location = await ctx.db.location.findUnique({
      where: { userId: ctx.dbUser.id },
      include: {
        usersToShareWith: {
          select: {
            id: true,
            name: true,
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

    return {
      isSharingLocation: location.isSharingLocation,
      usersToShareWith: location.usersToShareWith,
    };
  }),

  /**
   * Get all users (for sharing selection) - moderator only
   */
  getAllUsersForSharing: moderatorProcedure.query(async ({ ctx }) => {
    const users = await ctx.db.user.findMany({
      where: {
        id: { not: ctx.dbUser.id }, // Exclude current user
      },
      select: {
        id: true,
        name: true,
        image: true,
      },
      orderBy: { name: "asc" },
    });

    return users;
  }),

  /**
   * Subscribe to real-time location updates of friends (event-based)
   * Uses Supabase Realtime to listen for Location table changes
   * Emits individual update events with Expo-compliant format
   */
  onFriendsLocationUpdate: protectedProcedure.subscription(({ ctx }) => {
    return observable<{
      userId: string;
      location: ExpoLocationObject;
      user: {
        id: string;
        name: string | null;
        image: string | null;
      };
      action: "INSERT" | "UPDATE" | "DELETE";
    }>((emit) => {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        emit.error(
          new Error("Supabase URL and Key are required for realtime subscriptions")
        );
        return;
      }

      const supabase = createSupabaseClient(supabaseUrl, supabaseKey);
      let channel: RealtimeChannel | null = null;

      // Get list of user IDs that are sharing their location with current user
      const setupSubscription = async () => {
        try {
          const locations = await ctx.db.location.findMany({
            where: {
              isSharingLocation: true,
              usersToShareWith: {
                some: {
                  id: ctx.dbUser.id,
                },
              },
            },
            select: {
              userId: true,
            },
          });

          const sharedUserIds = locations.map((loc) => loc.userId);

          // Subscribe to Location table changes
          channel = supabase
            .channel(`location_updates_${ctx.dbUser.id}`)
            .on(
              "postgres_changes",
              {
                event: "*",
                schema: "public",
                table: "Location",
              },
              (
                payload: RealtimePostgresChangesPayload<{
                  id: string;
                  userId: string;
                  latitude: string | null;
                  longitude: string | null;
                  accuracy: string | null;
                  altitude: string | null;
                  altitudeAccuracy: string | null;
                  heading: string | null;
                  speed: string | null;
                  timestamp: string;
                  isSharingLocation: boolean;
                }>
              ) => {
                const eventType = payload.eventType;
                
                // Get the record from new or old depending on event type
                interface LocationRecord {
                  id: string;
                  userId: string;
                  latitude: string | null;
                  longitude: string | null;
                  accuracy: string | null;
                  altitude: string | null;
                  altitudeAccuracy: string | null;
                  heading: string | null;
                  speed: string | null;
                  timestamp: string;
                  isSharingLocation: boolean;
                }
                
                const record = (payload.new as LocationRecord)?.userId
                  ? payload.new as LocationRecord
                  : payload.old as LocationRecord;

                // Only emit if the location belongs to a user sharing with current user
                if (!record?.userId || !sharedUserIds.includes(record.userId)) {
                  return;
                }

                void (async () => {
                  try {
                    // Fetch complete location data with user information
                    const location = await ctx.db.location.findUnique({
                      where: { userId: record.userId },
                      include: {
                        user: {
                          select: {
                            id: true,
                            name: true,
                            image: true,
                          },
                        },
                      },
                    });

                    if (!location) {
                      return;
                    }

                    // Emit Expo-compliant format
                    emit.next({
                      userId: record.userId,
                      location: toExpoLocation(location),
                      user: location.user,
                      action: eventType,
                    });
                  } catch (err) {
                    console.error("Error fetching location update:", err);
                  }
                })();
              }
            )
            .subscribe((status) => {
              console.log(
                `Realtime subscription status for user ${ctx.dbUser.id}:`,
                status
              );
            });
        } catch (err) {
                    emit.error(err as Error);
        }
      };
      
      void setupSubscription();

      // Cleanup function
      return () => {
        if (channel) {
          void supabase.removeChannel(channel);
        }
      };
    });
  }),
});
