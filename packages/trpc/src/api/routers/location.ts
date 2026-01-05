import { z } from "zod";
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
});
