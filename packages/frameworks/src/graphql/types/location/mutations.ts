import { builder } from "../../builder.js";
import { LocationType } from "./types.js";
import type { LocationDTO } from "@mirai-app/use-cases";
import type { GraphQLContext } from "../../context.js";

/**
 * Update Location Input
 */
const UpdateLocationInput = builder.inputType("UpdateLocationInput", {
  description: "Input for updating user's current location",
  fields: (t) => ({
    latitude: t.field({
      type: "BigInt",
      required: true,
      description: "Latitude in microdegrees (multiply by 1e6 for precision)",
    }),
    longitude: t.field({
      type: "BigInt",
      required: true,
      description: "Longitude in microdegrees (multiply by 1e6 for precision)",
    }),
    accuracy: t.field({
      type: "BigInt",
      description: "Location accuracy in meters",
    }),
    altitude: t.field({
      type: "BigInt",
      description: "Altitude in meters above sea level",
    }),
    altitudeAccuracy: t.field({
      type: "BigInt",
      description: "Altitude accuracy in meters",
    }),
    heading: t.field({
      type: "BigInt",
      description: "Heading in degrees (0-360)",
    }),
    speed: t.field({
      type: "BigInt",
      description: "Speed in meters per second",
    }),
  }),
});

/**
 * Start Location Sharing Input
 */
const StartLocationSharingInput = builder.inputType(
  "StartLocationSharingInput",
  {
    description: "Input for starting location sharing with friends",
    fields: (t) => ({
      userIds: t.field({
        type: ["ID"],
        description:
          "IDs of users to share location with (optional - if empty, shares with all friends)",
      }),
    }),
  },
);

/**
 * Stop Location Sharing Input
 */
const StopLocationSharingInput = builder.inputType("StopLocationSharingInput", {
  description: "Input for stopping location sharing",
  fields: (t) => ({
    removeAll: t.field({
      type: "Boolean",
      description: "If true, removes all shared users (default: true)",
    }),
  }),
});

/**
 * Location Sharing Result Type
 */
const LocationSharingResultType = builder.objectType("LocationSharingResult", {
  description: "Result of starting or stopping location sharing",
  fields: (t) => ({
    success: t.exposeBoolean("success"),
    isSharingLocation: t.exposeBoolean("isSharingLocation"),
    sharedWithCount: t.field({
      type: "Int",
      nullable: true,
      resolve: (parent: { sharedWithCount?: number }) => parent.sharedWithCount,
    }),
  }),
});

/**
 * Location controller interface for mutations
 */
interface LocationMutationController {
  update: (input: {
    userId: string;
    latitude: number;
    longitude: number;
    accuracy?: number | null;
    altitude?: number | null;
    altitudeAccuracy?: number | null;
    heading?: number | null;
    speed?: number | null;
  }) => Promise<
    | {
        success: true;
        data: LocationDTO;
      }
    | { success: false; error: string }
  >;
  updateSharingSettings: (input: {
    userId: string;
    isSharingLocation: boolean;
    usersToShareWith?: Array<{
      id: string;
      firstName: string | null;
      lastName: string | null;
    }>;
  }) => Promise<
    { success: true; data: unknown } | { success: false; error: string }
  >;
  getSharingSettings: (input: { userId: string }) => Promise<
    | {
        success: true;
        data: {
          isSharingLocation: boolean;
          usersToShareWith?: Array<{
            id: string;
            firstName: string | null;
            lastName: string | null;
          }>;
        };
      }
    | { success: false; error: string }
  >;
}

/**
 * Extended context with location controller
 */
interface LocationMutationContext extends GraphQLContext {
  controllers: {
    locationController: LocationMutationController;
  };
}

/**
 * Location Mutations
 */
builder.mutationFields((t) => ({
  /**
   * Update user's current location
   */
  updateLocation: t.field({
    type: LocationType,
    description: "Update the current user's location coordinates",
    args: {
      input: t.arg({ type: UpdateLocationInput, required: true }),
    },
    resolve: async (
      _parent,
      args: {
        input: {
          latitude: bigint;
          longitude: bigint;
          accuracy?: bigint | null;
          altitude?: bigint | null;
          altitudeAccuracy?: bigint | null;
          heading?: bigint | null;
          speed?: bigint | null;
        };
      },
      ctx: LocationMutationContext,
    ) => {
      // Get current user ID from auth context
      const userId = ctx.authContext?.user?.id;
      if (!userId) {
        throw new Error("Authentication required");
      }

      const controller = ctx.controllers.locationController;

      // Convert BigInt to number (microdegrees to degrees)
      const latitude = Number(args.input.latitude) / 1e6;
      const longitude = Number(args.input.longitude) / 1e6;

      const result = await controller.update({
        userId,
        latitude,
        longitude,
        accuracy: args.input.accuracy ? Number(args.input.accuracy) : null,
        altitude: args.input.altitude ? Number(args.input.altitude) : null,
        altitudeAccuracy: args.input.altitudeAccuracy
          ? Number(args.input.altitudeAccuracy)
          : null,
        heading: args.input.heading ? Number(args.input.heading) : null,
        speed: args.input.speed ? Number(args.input.speed) : null,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
  }),

  /**
   * Start sharing location with friends
   */
  startLocationSharing: t.field({
    type: LocationSharingResultType,
    description: "Start sharing location with specified friends or all friends",
    args: {
      input: t.arg({ type: StartLocationSharingInput, required: true }),
    },
    resolve: async (
      _parent,
      args: {
        input: {
          userIds?: string[] | null;
        };
      },
      ctx: LocationMutationContext,
    ) => {
      const userId = ctx.authContext?.user?.id;
      if (!userId) {
        throw new Error("Authentication required");
      }

      const controller = ctx.controllers.locationController;

      // Build usersToShareWith if specific userIds provided
      let usersToShareWith:
        | Array<{
            id: string;
            firstName: string | null;
            lastName: string | null;
          }>
        | undefined;

      if (args.input.userIds && args.input.userIds.length > 0) {
        // Note: In a full implementation, we'd fetch user details from a user service
        // For now, we pass IDs and let the controller handle the rest
        usersToShareWith = args.input.userIds.map((id) => ({
          id,
          firstName: null,
          lastName: null,
        }));
      }

      const result = await controller.updateSharingSettings({
        userId,
        isSharingLocation: true,
        usersToShareWith,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      // Get updated sharing settings to return count
      const settingsResult = await controller.getSharingSettings({ userId });
      const sharedWithCount =
        settingsResult.success && settingsResult.data.usersToShareWith
          ? settingsResult.data.usersToShareWith.length
          : 0;

      return {
        success: true,
        isSharingLocation: true,
        sharedWithCount,
      };
    },
  }),

  /**
   * Stop sharing location with friends
   */
  stopLocationSharing: t.field({
    type: LocationSharingResultType,
    description: "Stop sharing location with all friends",
    args: {
      input: t.arg({ type: StopLocationSharingInput, required: true }),
    },
    resolve: async (
      _parent,
      _args: {
        input: {
          removeAll?: boolean | null;
        };
      },
      ctx: LocationMutationContext,
    ) => {
      const userId = ctx.authContext?.user?.id;
      if (!userId) {
        throw new Error("Authentication required");
      }

      const controller = ctx.controllers.locationController;

      // Stop sharing by setting isSharingLocation to false
      // and clearing usersToShareWith
      const result = await controller.updateSharingSettings({
        userId,
        isSharingLocation: false,
        usersToShareWith: [],
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      return {
        success: true,
        isSharingLocation: false,
        sharedWithCount: 0,
      };
    },
  }),
}));
