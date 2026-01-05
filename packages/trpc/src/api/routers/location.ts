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

export const locationRouter = createTRPCRouter({
  /**
   * Update current user's location
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
   * Get current user's location
   */
  getMyLocation: protectedProcedure.query(async ({ ctx }) => {
    const location = await ctx.db.location.findUnique({
      where: { userId: ctx.dbUser.id },
    });

    return location;
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
   * Get locations of users who are sharing their location with current user
   */
  getFriendsLocations: protectedProcedure.query(async ({ ctx }) => {
    // Find all locations where the current user is in the usersToShareWith list
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
   * Search for users within a specified radius (in kilometers)
   */
  searchUsersInRadius: protectedProcedure
    .input(
      z.object({
        latitude: latitudeSchema,
        longitude: longitudeSchema,
        radiusKm: z.number().positive().max(1000), // Max 1000km
      }),
    )
    .query(async ({ ctx, input }) => {
      const { latitude, longitude, radiusKm } = input;

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

      // Filter by distance
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
   * Subscribe to real-time location updates of friends
   * Uses Supabase Realtime to listen for Location table changes
   */
  onFriendsLocationUpdate: protectedProcedure.subscription(({ ctx }) => {
    return observable<{
      userId: string;
      location: {
        id: string;
        userId: string;
        latitude: number | null;
        longitude: number | null;
        accuracy: number | null;
        altitude: number | null;
        altitudeAccuracy: number | null;
        heading: number | null;
        speed: number | null;
        timestamp: Date;
        isSharingLocation: boolean;
      };
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

                    emit.next({
                      userId: record.userId,
                      location: {
                        id: location.id,
                        userId: location.userId,
                        latitude: location.latitude ? Number(location.latitude) : null,
                        longitude: location.longitude ? Number(location.longitude) : null,
                        accuracy: location.accuracy ? Number(location.accuracy) : null,
                        altitude: location.altitude ? Number(location.altitude) : null,
                        altitudeAccuracy: location.altitudeAccuracy
                          ? Number(location.altitudeAccuracy)
                          : null,
                        heading: location.heading ? Number(location.heading) : null,
                        speed: location.speed ? Number(location.speed) : null,
                        timestamp: location.timestamp,
                        isSharingLocation: location.isSharingLocation,
                      },
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
