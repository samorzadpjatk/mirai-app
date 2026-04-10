import { builder } from "../builder";
import {
  LocationType,
  UpdateLocationInput,
  UpdateSharingSettingsInput,
  SharingUserInfoType,
} from "../types/Location";
import {
  GetLocationUseCase,
  CreateLocationUseCase,
  UpdateLocationUseCase,
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
      const useCase =
        context.container.resolve<GetLocationUseCase>("getLocationUseCase");
      const result = await useCase.execute({ userId: args.userId });

      if (result.kind === "err") {
        throw new Error(result.error);
      }

      return result.value;
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

      const useCase =
        context.container.resolve<GetLocationUseCase>("getLocationUseCase");
      const result = await useCase.execute({
        userId: context.authContext.userId,
      });

      if (result.kind === "err") {
        return null;
      }

      return result.value;
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

      const locationRepository =
        context.container.resolve("locationRepository");
      return locationRepository.findSharingWithUser(context.authContext.userId);
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

      const useCase = context.container.resolve<UpdateLocationUseCase>(
        "updateLocationUseCase",
      );

      const result = await useCase.execute({
        userId: context.authContext.userId,
        latitude: args.input.latitude,
        longitude: args.input.longitude,
        accuracy: args.input.accuracy,
        altitude: args.input.altitude,
        altitudeAccuracy: args.input.altitudeAccuracy,
        heading: args.input.heading,
        speed: args.input.speed,
        isSharingLocation: args.input.isSharingLocation,
      });

      if (result.kind === "err") {
        throw new Error(result.error);
      }

      return result.value;
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

      // Update sharing settings logic
      const useCase = context.container.resolve<UpdateLocationUseCase>(
        "updateLocationUseCase",
      );

      const result = await useCase.execute({
        userId: context.authContext.userId,
        isSharingLocation: args.input.isSharingLocation,
      });

      if (result.kind === "err") {
        throw new Error(result.error);
      }

      return result.value;
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

      // Logic to create location sharing request
      return true;
    },
  }),
}));
