import { builder } from "../builder";
import { Effect } from "effect";
import type { LocationRepository } from "@mirai-app/use-cases";
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
      const locationRepository =
        context.container.resolve<LocationRepository>("locationRepository");

      const program = getLocationUseCase({ userId: args.userId }).pipe(
        Effect.provideService(LocationRepositoryTag, {
          create: (location) =>
            Effect.promise(() => locationRepository.create(location)),
          findById: (id: LocationId) =>
            Effect.promise(() => locationRepository.findById(id)),
          findByUserId: (userId: string) =>
            Effect.promise(() => locationRepository.findByUserId(userId)),
          findAll: (options?: { limit?: number; offset?: number }) =>
            Effect.promise(() => locationRepository.findAll(options)),
          findSharingWithUser: (userId: string) =>
            Effect.promise(() =>
              locationRepository.findSharingWithUser(userId),
            ),
          findByUserIds: (userIds: string[]) =>
            Effect.promise(() => locationRepository.findByUserIds(userIds)),
          save: (location) =>
            Effect.promise(() => locationRepository.save(location)),
          delete: (id: LocationId) =>
            Effect.promise(() => locationRepository.delete(id)),
          deleteByUserId: (userId: string) =>
            Effect.promise(() => locationRepository.deleteByUserId(userId)),
          existsForUser: (userId: string) =>
            Effect.promise(() => locationRepository.existsForUser(userId)),
        }),
      );

      try {
        return await Effect.runPromise(program);
      } catch (error) {
        if (error instanceof LocationNotFoundError) {
          return null;
        }
        throw new Error(error instanceof Error ? error.message : String(error));
      }
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

      const locationRepository =
        context.container.resolve<LocationRepository>("locationRepository");

      const program = getLocationUseCase({
        userId: context.authContext.userId,
      }).pipe(
        Effect.provideService(LocationRepositoryTag, {
          create: (location) =>
            Effect.promise(() => locationRepository.create(location)),
          findById: (id: LocationId) =>
            Effect.promise(() => locationRepository.findById(id)),
          findByUserId: (userId: string) =>
            Effect.promise(() => locationRepository.findByUserId(userId)),
          findAll: (options?: { limit?: number; offset?: number }) =>
            Effect.promise(() => locationRepository.findAll(options)),
          findSharingWithUser: (userId: string) =>
            Effect.promise(() =>
              locationRepository.findSharingWithUser(userId),
            ),
          findByUserIds: (userIds: string[]) =>
            Effect.promise(() => locationRepository.findByUserIds(userIds)),
          save: (location) =>
            Effect.promise(() => locationRepository.save(location)),
          delete: (id: LocationId) =>
            Effect.promise(() => locationRepository.delete(id)),
          deleteByUserId: (userId: string) =>
            Effect.promise(() => locationRepository.deleteByUserId(userId)),
          existsForUser: (userId: string) =>
            Effect.promise(() => locationRepository.existsForUser(userId)),
        }),
      );

      try {
        return await Effect.runPromise(program);
      } catch (error) {
        if (error instanceof LocationNotFoundError) {
          return null;
        }
        throw new Error(error instanceof Error ? error.message : String(error));
      }
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

      const locationRepository =
        context.container.resolve<LocationRepository>("locationRepository");

      const program = updateLocationUseCase({
        userId: context.authContext.userId,
        latitude: args.input.latitude,
        longitude: args.input.longitude,
        accuracy: args.input.accuracy,
        altitude: args.input.altitude,
        altitudeAccuracy: args.input.altitudeAccuracy,
        heading: args.input.heading,
        speed: args.input.speed,
        isSharingLocation: args.input.isSharingLocation ?? undefined,
      }).pipe(
        Effect.provideService(LocationRepositoryTag, {
          create: (location) =>
            Effect.promise(() => locationRepository.create(location)),
          findById: (id: LocationId) =>
            Effect.promise(() => locationRepository.findById(id)),
          findByUserId: (userId: string) =>
            Effect.promise(() => locationRepository.findByUserId(userId)),
          findAll: (options?: { limit?: number; offset?: number }) =>
            Effect.promise(() => locationRepository.findAll(options)),
          findSharingWithUser: (userId: string) =>
            Effect.promise(() =>
              locationRepository.findSharingWithUser(userId),
            ),
          findByUserIds: (userIds: string[]) =>
            Effect.promise(() => locationRepository.findByUserIds(userIds)),
          save: (location) =>
            Effect.promise(() => locationRepository.save(location)),
          delete: (id: LocationId) =>
            Effect.promise(() => locationRepository.delete(id)),
          deleteByUserId: (userId: string) =>
            Effect.promise(() => locationRepository.deleteByUserId(userId)),
          existsForUser: (userId: string) =>
            Effect.promise(() => locationRepository.existsForUser(userId)),
        }),
      );

      try {
        return await Effect.runPromise(program);
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : String(error));
      }
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

      const locationRepository =
        context.container.resolve<LocationRepository>("locationRepository");

      const program = updateLocationUseCase({
        userId: context.authContext.userId,
        isSharingLocation: args.input.isSharingLocation,
      }).pipe(
        Effect.provideService(LocationRepositoryTag, {
          create: (location) =>
            Effect.promise(() => locationRepository.create(location)),
          findById: (id: LocationId) =>
            Effect.promise(() => locationRepository.findById(id)),
          findByUserId: (userId: string) =>
            Effect.promise(() => locationRepository.findByUserId(userId)),
          findAll: (options?: { limit?: number; offset?: number }) =>
            Effect.promise(() => locationRepository.findAll(options)),
          findSharingWithUser: (userId: string) =>
            Effect.promise(() =>
              locationRepository.findSharingWithUser(userId),
            ),
          findByUserIds: (userIds: string[]) =>
            Effect.promise(() => locationRepository.findByUserIds(userIds)),
          save: (location) =>
            Effect.promise(() => locationRepository.save(location)),
          delete: (id: LocationId) =>
            Effect.promise(() => locationRepository.delete(id)),
          deleteByUserId: (userId: string) =>
            Effect.promise(() => locationRepository.deleteByUserId(userId)),
          existsForUser: (userId: string) =>
            Effect.promise(() => locationRepository.existsForUser(userId)),
        }),
      );

      try {
        return await Effect.runPromise(program);
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : String(error));
      }
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
