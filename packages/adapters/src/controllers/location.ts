import { z } from "zod";
import { Effect } from "effect";
import type { LocationRepository } from "@mirai-app/use-cases";
import {
  listLocationsUseCase,
  updateSharingSettingsUseCase,
  addSharingUserUseCase,
  removeSharingUserUseCase,
  getSharingSettingsUseCase,
  getLocationUseCase,
  createLocationUseCase,
  updateLocationUseCase,
  LocationRepositoryTag,
} from "@mirai-app/use-cases";
import { effectToControllerResult } from "../utils/controller-helpers";

/**
 * Input validation schemas for location controller
 */
const schemas = {
  getByUserId: z.object({
    userId: z.string().min(1, "User ID is required"),
  }),

  create: z.object({
    userId: z.string().min(1, "User ID is required"),
    latitude: z.number().min(-90).max(90).optional().nullable(),
    longitude: z.number().min(-180).max(180).optional().nullable(),
    accuracy: z.number().nonnegative().optional().nullable(),
    altitude: z.number().optional().nullable(),
    altitudeAccuracy: z.number().nonnegative().optional().nullable(),
    heading: z.number().min(0).max(360).optional().nullable(),
    speed: z.number().nonnegative().optional().nullable(),
    isSharingLocation: z.boolean().optional(),
  }),

  update: z.object({
    userId: z.string().min(1, "User ID is required"),
    latitude: z.number().min(-90).max(90).optional().nullable(),
    longitude: z.number().min(-180).max(180).optional().nullable(),
    accuracy: z.number().nonnegative().optional().nullable(),
    altitude: z.number().optional().nullable(),
    altitudeAccuracy: z.number().nonnegative().optional().nullable(),
    heading: z.number().min(0).max(360).optional().nullable(),
    speed: z.number().nonnegative().optional().nullable(),
    isSharingLocation: z.boolean().optional(),
  }),

  list: z
    .object({
      viewerUserId: z.string().min(1, "Viewer user ID is required"),
      targetUserIds: z.array(z.string()).optional(),
      radiusKm: z.number().positive().max(1000).optional(),
      centerLatitude: z.number().min(-90).max(90).optional(),
      centerLongitude: z.number().min(-180).max(180).optional(),
    })
    .refine(
      (data) => {
        // If radiusKm is provided, both center coordinates are required
        if (data.radiusKm !== undefined) {
          return (
            data.centerLatitude !== undefined &&
            data.centerLongitude !== undefined
          );
        }
        return true;
      },
      {
        message:
          "centerLatitude and centerLongitude are required when radiusKm is provided",
      },
    ),

  updateSharingSettings: z.object({
    userId: z.string().min(1, "User ID is required"),
    isSharingLocation: z.boolean(),
    usersToShareWith: z
      .array(
        z.object({
          id: z.string(),
          firstName: z.string().nullable(),
          lastName: z.string().nullable(),
        }),
      )
      .optional(),
  }),

  addSharingUser: z.object({
    ownerUserId: z.string().min(1, "Owner user ID is required"),
    userToAddId: z.string().min(1, "User to add ID is required"),
    userFirstName: z.string().nullable(),
    userLastName: z.string().nullable(),
  }),

  removeSharingUser: z.object({
    ownerUserId: z.string().min(1, "Owner user ID is required"),
    userToRemoveId: z.string().min(1, "User to remove ID is required"),
  }),

  getSharingSettings: z.object({
    userId: z.string().min(1, "User ID is required"),
  }),

  deleteByUserId: z.object({
    userId: z.string().min(1, "User ID is required"),
  }),
};

/**
 * LocationController
 *
 * Thin controller that delegates to use cases.
 * No business logic here - just input validation, use case orchestration,
 * and error handling.
 */
export class LocationController {
  constructor(private locationRepository: LocationRepository) {}

  /**
   * Get a location by user ID
   */
  async getByUserId(input: unknown): Promise<
    | {
        success: true;
        data: {
          id: string;
          userId: string;
          latitude: number | null;
          longitude: number | null;
          accuracy: number | null;
          altitude: number | null;
          altitudeAccuracy: number | null;
          heading: number | null;
          speed: number | null;
          isSharingLocation: boolean;
          timestamp: Date;
          usersToShareWith: Array<{
            id: string;
            firstName: string | null;
            lastName: string | null;
          }>;
        };
      }
    | { success: false; error: string }
  > {
    const parsed = schemas.getByUserId.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const effect = getLocationUseCase({ userId: parsed.data.userId }).pipe(
      Effect.provideService(LocationRepositoryTag, this.locationRepository),
    );

    return await effectToControllerResult(effect);
  }

  /**
   * Create or update a location (upsert pattern)
   */
  async create(input: unknown): Promise<
    | {
        success: true;
        data: {
          id: string;
          userId: string;
          latitude: number | null;
          longitude: number | null;
          accuracy: number | null;
          isSharingLocation: boolean;
          timestamp: Date;
          usersToShareWith: Array<{
            id: string;
            firstName: string | null;
            lastName: string | null;
          }>;
        };
      }
    | { success: false; error: string }
  > {
    const parsed = schemas.create.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const effect = createLocationUseCase({
      userId: parsed.data.userId,
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
      accuracy: parsed.data.accuracy,
      altitude: parsed.data.altitude,
      altitudeAccuracy: parsed.data.altitudeAccuracy,
      heading: parsed.data.heading,
      speed: parsed.data.speed,
      isSharingLocation: parsed.data.isSharingLocation,
    }).pipe(
      Effect.provideService(LocationRepositoryTag, this.locationRepository),
    );

    return await effectToControllerResult(effect);
  }

  /**
   * Update an existing location
   */
  async update(input: unknown): Promise<
    | {
        success: true;
        data: {
          id: string;
          userId: string;
          latitude: number | null;
          longitude: number | null;
          accuracy: number | null;
          altitude: number | null;
          altitudeAccuracy: number | null;
          heading: number | null;
          speed: number | null;
          isSharingLocation: boolean;
          timestamp: Date;
          usersToShareWith: Array<{
            id: string;
            firstName: string | null;
            lastName: string | null;
          }>;
        };
      }
    | { success: false; error: string }
  > {
    const parsed = schemas.update.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const effect = updateLocationUseCase({
      userId: parsed.data.userId,
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
      accuracy: parsed.data.accuracy,
      altitude: parsed.data.altitude,
      altitudeAccuracy: parsed.data.altitudeAccuracy,
      heading: parsed.data.heading,
      speed: parsed.data.speed,
      isSharingLocation: parsed.data.isSharingLocation,
    }).pipe(
      Effect.provideService(LocationRepositoryTag, this.locationRepository),
    );

    return await effectToControllerResult(effect);
  }

  /**
   * List locations viewable by a user
   */
  async list(input: unknown): Promise<
    | {
        success: true;
        data: {
          locations: Array<{
            id: string;
            userId: string;
            latitude: number | null;
            longitude: number | null;
            accuracy: number | null;
            altitude: number | null;
            heading: number | null;
            speed: number | null;
            isSharingLocation: boolean;
            timestamp: Date;
            distanceKm?: number;
          }>;
          total: number;
        };
      }
    | { success: false; error: string }
  > {
    const parsed = schemas.list.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const effect = listLocationsUseCase({
      viewerUserId: parsed.data.viewerUserId,
      targetUserIds: parsed.data.targetUserIds,
      radiusKm: parsed.data.radiusKm,
      centerLatitude: parsed.data.centerLatitude,
      centerLongitude: parsed.data.centerLongitude,
    }).pipe(
      Effect.provideService(LocationRepositoryTag, this.locationRepository),
    );

    return await effectToControllerResult(effect);
  }

  /**
   * Update sharing settings
   */
  async updateSharingSettings(input: unknown) {
    const parsed = schemas.updateSharingSettings.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const usersToShareWith:
      | Array<{
          id: string;
          firstName: string | null;
          lastName: string | null;
        }>
      | undefined = parsed.data.usersToShareWith?.filter(
      (
        user,
      ): user is {
        id: string;
        firstName: string | null;
        lastName: string | null;
      } => typeof user.id === "string",
    );

    const effect = updateSharingSettingsUseCase({
      userId: parsed.data.userId,
      isSharingLocation: parsed.data.isSharingLocation,
      usersToShareWith,
    }).pipe(
      Effect.provideService(LocationRepositoryTag, this.locationRepository),
    );

    return await effectToControllerResult(effect);
  }

  /**
   * Add a user to sharing list
   */
  async addSharingUser(input: unknown) {
    const parsed = schemas.addSharingUser.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const effect = addSharingUserUseCase({
      ownerUserId: parsed.data.ownerUserId,
      userToAddId: parsed.data.userToAddId,
      userFirstName: parsed.data.userFirstName,
      userLastName: parsed.data.userLastName,
    }).pipe(
      Effect.provideService(LocationRepositoryTag, this.locationRepository),
    );

    return await effectToControllerResult(effect);
  }

  /**
   * Remove a user from sharing list
   */
  async removeSharingUser(input: unknown) {
    const parsed = schemas.removeSharingUser.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const effect = removeSharingUserUseCase({
      ownerUserId: parsed.data.ownerUserId,
      userToRemoveId: parsed.data.userToRemoveId,
    }).pipe(
      Effect.provideService(LocationRepositoryTag, this.locationRepository),
    );

    return await effectToControllerResult(effect);
  }

  /**
   * Get sharing settings
   */
  async getSharingSettings(input: unknown) {
    const parsed = schemas.getSharingSettings.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const effect = getSharingSettingsUseCase({
      userId: parsed.data.userId,
    }).pipe(
      Effect.provideService(LocationRepositoryTag, this.locationRepository),
    );

    return await effectToControllerResult(effect);
  }

  /**
   * Delete location by user ID
   */
  async deleteByUserId(
    input: unknown,
  ): Promise<
    | { success: true; data: { deleted: true } }
    | { success: false; error: string }
  > {
    const parsed = schemas.deleteByUserId.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const effect = this.locationRepository.deleteByUserId(parsed.data.userId);
    await Effect.runPromise(effect);

    return { success: true, data: { deleted: true } };
  }
}
