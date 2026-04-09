import { z } from "zod";
import type { LocationRepository } from "@repo/use-cases";
import {
  GetLocationUseCase,
  CreateLocationUseCase,
  UpdateLocationUseCase,
  ListLocationsUseCase,
  UpdateSharingSettingsUseCase,
  AddSharingUserUseCase,
  RemoveSharingUserUseCase,
  GetSharingSettingsUseCase,
  type CreateLocationInput,
  type UpdateLocationInput,
  type UpdateSharingSettingsInput,
  type AddSharingUserInput,
  type RemoveSharingUserInput,
} from "@repo/use-cases";

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

    const useCase = new GetLocationUseCase(this.locationRepository);
    const result = await useCase.execute({ userId: parsed.data.userId });

    if (result.kind === "err") {
      return { success: false, error: result.error };
    }

    return { success: true, data: result.value };
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

    const useCase = new CreateLocationUseCase(this.locationRepository);
    const result = await useCase.execute({
      userId: parsed.data.userId,
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
      accuracy: parsed.data.accuracy,
      altitude: parsed.data.altitude,
      altitudeAccuracy: parsed.data.altitudeAccuracy,
      heading: parsed.data.heading,
      speed: parsed.data.speed,
      isSharingLocation: parsed.data.isSharingLocation,
    });

    if (result.kind === "err") {
      return { success: false, error: result.error };
    }

    return { success: true, data: result.value };
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

    const useCase = new UpdateLocationUseCase(this.locationRepository);
    const result = await useCase.execute({
      userId: parsed.data.userId,
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
      accuracy: parsed.data.accuracy,
      altitude: parsed.data.altitude,
      altitudeAccuracy: parsed.data.altitudeAccuracy,
      heading: parsed.data.heading,
      speed: parsed.data.speed,
      isSharingLocation: parsed.data.isSharingLocation,
    });

    if (result.kind === "err") {
      return { success: false, error: result.error };
    }

    return { success: true, data: result.value };
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

    const useCase = new ListLocationsUseCase(this.locationRepository);
    const result = await useCase.execute({
      viewerUserId: parsed.data.viewerUserId,
      targetUserIds: parsed.data.targetUserIds,
      radiusKm: parsed.data.radiusKm,
      centerLatitude: parsed.data.centerLatitude,
      centerLongitude: parsed.data.centerLongitude,
    });

    if (result.kind === "err") {
      return { success: false, error: result.error };
    }

    return { success: true, data: result.value };
  }

  /**
   * Update sharing settings
   */
  async updateSharingSettings(input: unknown): Promise<
    | {
        success: true;
        data: {
          id: string;
          userId: string;
          isSharingLocation: boolean;
          usersToShareWith: Array<{
            id: string;
            firstName: string | null;
            lastName: string | null;
          }>;
          timestamp: Date;
        };
      }
    | { success: false; error: string }
  > {
    const parsed = schemas.updateSharingSettings.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const useCase = new UpdateSharingSettingsUseCase(this.locationRepository);
    const result = await useCase.execute({
      userId: parsed.data.userId,
      isSharingLocation: parsed.data.isSharingLocation,
      usersToShareWith: parsed.data.usersToShareWith,
    });

    if (result.kind === "err") {
      return { success: false, error: result.error };
    }

    return { success: true, data: result.value };
  }

  /**
   * Add a user to sharing list
   */
  async addSharingUser(input: unknown): Promise<
    | {
        success: true;
        data: {
          id: string;
          userId: string;
          isSharingLocation: boolean;
          usersToShareWith: Array<{
            id: string;
            firstName: string | null;
            lastName: string | null;
          }>;
        };
      }
    | { success: false; error: string }
  > {
    const parsed = schemas.addSharingUser.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const useCase = new AddSharingUserUseCase(this.locationRepository);
    const result = await useCase.execute({
      ownerUserId: parsed.data.ownerUserId,
      userToAddId: parsed.data.userToAddId,
      userFirstName: parsed.data.userFirstName,
      userLastName: parsed.data.userLastName,
    });

    if (result.kind === "err") {
      return { success: false, error: result.error };
    }

    return { success: true, data: result.value };
  }

  /**
   * Remove a user from sharing list
   */
  async removeSharingUser(input: unknown): Promise<
    | {
        success: true;
        data: {
          id: string;
          userId: string;
          isSharingLocation: boolean;
          usersToShareWith: Array<{
            id: string;
            firstName: string | null;
            lastName: string | null;
          }>;
        };
      }
    | { success: false; error: string }
  > {
    const parsed = schemas.removeSharingUser.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const useCase = new RemoveSharingUserUseCase(this.locationRepository);
    const result = await useCase.execute({
      ownerUserId: parsed.data.ownerUserId,
      userToRemoveId: parsed.data.userToRemoveId,
    });

    if (result.kind === "err") {
      return { success: false, error: result.error };
    }

    return { success: true, data: result.value };
  }

  /**
   * Get sharing settings
   */
  async getSharingSettings(input: unknown): Promise<
    | {
        success: true;
        data: {
          isSharingLocation: boolean;
          usersToShareWith: Array<{
            id: string;
            firstName: string | null;
            lastName: string | null;
          }>;
        };
      }
    | { success: false; error: string }
  > {
    const parsed = schemas.getSharingSettings.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const useCase = new GetSharingSettingsUseCase(this.locationRepository);
    const result = await useCase.execute({ userId: parsed.data.userId });

    if (result.kind === "err") {
      return { success: false, error: result.error };
    }

    return { success: true, data: result.value };
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

    await this.locationRepository.deleteByUserId(parsed.data.userId);

    return { success: true, data: { deleted: true } };
  }
}
