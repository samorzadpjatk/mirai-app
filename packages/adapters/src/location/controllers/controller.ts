import { Effect, type Layer } from "effect";
import {
  listLocationsUseCase,
  updateSharingSettingsUseCase,
  addSharingUserUseCase,
  removeSharingUserUseCase,
  getSharingSettingsUseCase,
  createLocationUseCase,
  updateLocationUseCase,
  getLocationUseCase,
  LocationGatewayTag,
} from "@mirai-app/use-cases";
import {
  validateGetByUserIdInput,
  validateCreateInput,
  validateUpdateInput,
  validateListInput,
  validateUpdateSharingSettingsInput,
  validateAddSharingUserInput,
  validateRemoveSharingUserInput,
  validateGetSharingSettingsInput,
  validateDeleteByUserIdInput,
} from "./validators/schema";

export {
  validateGetByUserIdInput,
  validateCreateInput,
  validateUpdateInput,
  validateListInput,
  validateUpdateSharingSettingsInput,
  validateAddSharingUserInput,
  validateRemoveSharingUserInput,
  validateGetSharingSettingsInput,
  validateDeleteByUserIdInput,
};

/**
 * Input validation schemas for location controller
 */

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
    const parsed = validateGetByUserIdInput(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const effect = Effect.gen(function* () {
      return yield* getLocationUseCase({ userId: parsed.data.userId });
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
    const parsed = validateCreateInput(input);
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
    const parsed = validateUpdateInput(input);
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
    const parsed = validateListInput(input);
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

    const result = await runWithLayer(effect, this.appLayer);
    return result as
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
      | { success: false; error: string };
  }

  /**
   * Update sharing settings
   */
  async updateSharingSettings(input: unknown) {
    const parsed = validateUpdateSharingSettingsInput(input);
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
    const parsed = validateAddSharingUserInput(input);
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
    const parsed = validateRemoveSharingUserInput(input);
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
    const parsed = validateGetSharingSettingsInput(input);
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
    const parsed = validateDeleteByUserIdInput(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const effect = Effect.gen(function* () {
      const repo = yield* LocationGatewayTag;
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
