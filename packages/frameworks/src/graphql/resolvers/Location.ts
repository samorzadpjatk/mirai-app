import { builder } from "../builder";
import { Effect } from "effect";
import type { LocationId } from "@mirai-app/domain";
import {
  LocationType,
  UpdateLocationInput,
  UpdateSharingSettingsInput,
  SharingUserInfoType,
} from "../types/Location";
import {
  getLocationUseCase,
  updateLocationUseCase,
  LocationRepositoryTag,
  LocationNotFoundError,
  type GetLocationInput,
  type CreateLocationInput as CreateLocationUseCaseInput,
  type UpdateLocationInput as UpdateLocationUseCaseInput,
} from "@mirai-app/use-cases";

/**
 * Location Queries
 */
builder.queryFields((t) => ({
  location: t.field({
    type: LocationType,
    nullable: true,
    description: "Get location for a user",
    args: {
      userId: t.arg.id({ required: true, description: "User ID" }),
    },
    authScopes: { authenticated: true },
    resolve: async (_, args, context) => {
      const controller = context.controllers.locationController;
      const result = await controller.getByUserId({ userId: args.userId });

      if (!result.success) {
        if (result.error.toLowerCase().includes("not found")) {
          return null;
        }
        throw new Error(result.error);
      }

      return result.data;
    },
  }),

  myLocation: t.field({
    type: LocationType,
    nullable: true,
    description: "Get current user's location",
    authScopes: { authenticated: true },
    resolve: async (_, __, context) => {
      if (!context.authContext) {
        throw new Error("Not authenticated");
      }

      const controller = context.controllers.locationController;
      const result = await controller.getByUserId({
        userId: context.authContext.userId,
      });

      if (!result.success) {
        if (result.error.toLowerCase().includes("not found")) {
          return null;
        }
        throw new Error(result.error);
      }

      return result.data;
    },
  }),

  locationsSharingWithMe: t.field({
    type: [LocationType],
    description: "Get all locations that are sharing with current user",
    authScopes: { authenticated: true },
    resolve: async (_, __, context) => {
      if (!context.authContext) {
        return [];
      }

      const controller = context.controllers.locationController;
      const result = await controller.list({
        viewerUserId: context.authContext.userId,
      });

      if (!result.success) {
        return [];
      }

      return result.data.locations;
    },
  }),
}));

/**
 * Location Mutations
 */
builder.mutationFields((t) => ({
  updateMyLocation: t.field({
    type: LocationType,
    description: "Update current user's location",
    args: {
      input: t.arg({ type: UpdateLocationInput, required: true }),
    },
    authScopes: { authenticated: true },
    resolve: async (_, args, context) => {
      if (!context.authContext) {
        throw new Error("Not authenticated");
      }

      const controller = context.controllers.locationController;
      const result = await controller.update({
        userId: context.authContext.userId,
        latitude: args.input.latitude,
        longitude: args.input.longitude,
        accuracy: args.input.accuracy,
        altitude: args.input.altitude,
        altitudeAccuracy: args.input.altitudeAccuracy,
        heading: args.input.heading,
        speed: args.input.speed,
        isSharingLocation: args.input.isSharingLocation ?? undefined,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
  }),

  updateLocationSharing: t.field({
    type: LocationType,
    description: "Update location sharing settings",
    args: {
      input: t.arg({ type: UpdateSharingSettingsInput, required: true }),
    },
    authScopes: { authenticated: true },
    resolve: async (_, args, context) => {
      if (!context.authContext) {
        throw new Error("Not authenticated");
      }

      const controller = context.controllers.locationController;
      const result = await controller.updateSharingSettings({
        userId: context.authContext.userId,
        isSharingLocation: args.input.isSharingLocation,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
  }),

  requestLocationSharing: t.field({
    type: "Boolean",
    description: "Request to share location with a user",
    args: {
      targetUserId: t.arg.id({
        required: true,
        description: "User ID to share location with",
      }),
    },
    authScopes: { authenticated: true },
    resolve: async (_, args, context) => {
      if (!context.authContext) {
        throw new Error("Not authenticated");
      }

      // Logic to create location sharing request would go here
      return true;
    },
  }),
}));
