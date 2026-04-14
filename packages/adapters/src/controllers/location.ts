import { z } from "zod";
import { Effect, type Layer } from "effect";
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
 * Helper to run an Effect with the provided Layer and convert to controller result
 */
async function runWithLayer<T>(
  effect: Effect.Effect<T, unknown, unknown>,
  layer: Layer.Layer<unknown>,
  transform?: (value: T) => unknown,
): Promise<
  { success: true; data: unknown } | { success: false; error: string }
> {
  const provided = effect.pipe(Effect.provide(layer));
  const result = await Effect.runPromise(Effect.either(provided));

  if (result._tag === "Left") {
    const error = result.left;
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message };
  }

  return {
    success: true,
    data: transform ? transform(result.right) : result.right,
  };
}

/**
 * LocationController
 *
 * Thin controller that delegates to use cases.
 * No business logic here - just input validation, use case orchestration,
 * and error handling.
 *
 * Updated for Step 4: Now uses Effect Layers instead of direct repository injection.
 */
export class LocationController {
  constructor(private appLayer: Layer.Layer<unknown>) {}

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

    const effect = getLocationUseCase({ userId: parsed.data.userId });

    const result = await runWithLayer(effect, this.appLayer);

    return result as
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
      | { success: false; error: string };
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
    });

    const result = await runWithLayer(effect, this.appLayer);

    return result as
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
      | { success: false; error: string };
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
    });

    const result = await runWithLayer(effect, this.appLayer);

    return result as
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
      | { success: false; error: string };
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
    });

    return (await runWithLayer(effect, this.appLayer)) as Promise<
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
    >;
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
    });

    return await runWithLayer(effect, this.appLayer);
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
    });

    return await runWithLayer(effect, this.appLayer);
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
    });

    return await runWithLayer(effect, this.appLayer);
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
    });

    return await runWithLayer(effect, this.appLayer);
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

    const effect = Effect.gen(function* () {
      const repo = yield* LocationRepositoryTag;
      yield* repo.deleteByUserId(parsed.data.userId);
      return { deleted: true as const };
    });

    const result = await runWithLayer(effect, this.appLayer);

    if (!result.success) {
      return result as { success: false; error: string };
    }

    return {
      success: true,
      data: { deleted: (result.data as { deleted: true }).deleted },
    };
  }
}
