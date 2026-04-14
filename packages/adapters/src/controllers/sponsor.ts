import { Effect, type Layer } from "effect";
import {
  getSponsorUseCase,
  createSponsorUseCase,
  updateSponsorUseCase,
  deleteSponsorUseCase,
  listSponsorsUseCase,
  linkSponsorToTripUseCase,
  unlinkSponsorFromTripUseCase,
  SponsorRepositoryTag,
} from "@mirai-app/use-cases";
import {
  validateGetByIdInput,
  validateGetByTripIdInput,
  validateCreateSponsorInput,
  validateUpdateSponsorInput,
  validateDeleteSponsorInput,
  validateListInput,
  validateLinkToTripInput,
  validateUnlinkFromTripInput,
} from "./validators/sponsor-validators";

export {
  validateGetByIdInput,
  validateGetByTripIdInput,
  validateCreateSponsorInput,
  validateUpdateSponsorInput,
  validateDeleteSponsorInput,
  validateListInput,
  validateLinkToTripInput,
  validateUnlinkFromTripInput,
};

/**
 * Input validation schemas for sponsor controller
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
 * SponsorController
 *
 * Thin controller that delegates to use cases.
 * No business logic here - just input validation, use case orchestration,
 * and error handling.
 *
 * Updated for Step 4: Now uses Effect Layers instead of direct repository injection.
 */
export class SponsorController {
  constructor(private appLayer: Layer.Layer<unknown>) {}

  /**
   * Get a sponsor by ID
   */
  async getById(input: unknown): Promise<
    | {
        success: true;
        data: {
          id: string;
          name: string;
          description: string;
          logoPath: string;
          height: number | null;
          offsetX: number | null;
          offsetY: number | null;
          isActive: boolean;
          createdAt: Date;
          updatedAt: Date;
          hasLogoAdjustments: boolean;
        };
      }
    | { success: false; error: string }
  > {
    const parsed = validateGetByIdInput(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const effect = getSponsorUseCase({ sponsorId: parsed.data.id });

    return (await runWithLayer(effect, this.appLayer)) as unknown as 
      | {
          success: true;
          data: {
            id: string;
            name: string;
            description: string;
            logoPath: string;
            height: number | null;
            offsetX: number | null;
            offsetY: number | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            hasLogoAdjustments: boolean;
          };
        }
      | { success: false; error: string }
  }

  /**
   * Get sponsors by trip ID
   */
  async getByTripId(input: unknown): Promise<
    | {
        success: true;
        data: Array<{
          id: string;
          name: string;
          description: string;
          logoPath: string;
          height: number | null;
          offsetX: number | null;
          offsetY: number | null;
          isActive: boolean;
          createdAt: Date;
        }>;
      }
    | { success: false; error: string }
  > {
    const parsed = validateGetByTripIdInput(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const effect = Effect.gen(function* () {
      const repo = yield* SponsorRepositoryTag;
      return yield* repo.findByTripId(parsed.data.tripId);
    });

    const result = await runWithLayer(effect, this.appLayer, (sponsors) =>
      sponsors.map((sponsor) => ({
        id: sponsor.id,
        name: sponsor.name,
        description: sponsor.description,
        logoPath: sponsor.logoPath,
        height: sponsor.height,
        offsetX: sponsor.offsetX,
        offsetY: sponsor.offsetY,
        isActive: sponsor.isActive,
        createdAt: sponsor.createdAt,
      })),
    );

    return result as
      | {
          success: true;
          data: Array<{
            id: string;
            name: string;
            description: string;
            logoPath: string;
            height: number | null;
            offsetX: number | null;
            offsetY: number | null;
            isActive: boolean;
            createdAt: Date;
          }>;
        }
      | { success: false; error: string };
  }

  /**
   * Create a new sponsor
   */
  async create(input: unknown): Promise<
    | {
        success: true;
        data: {
          id: string;
          name: string;
          description: string;
          logoPath: string;
          height: number | null;
          offsetX: number | null;
          offsetY: number | null;
          isActive: boolean;
          createdAt: Date;
        };
      }
    | { success: false; error: string }
  > {
    const parsed = validateCreateSponsorInput(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const effect = createSponsorUseCase({
      name: parsed.data.name,
      description: parsed.data.description,
      logoPath: parsed.data.logoPath,
      height: parsed.data.height,
      offsetX: parsed.data.offsetX,
      offsetY: parsed.data.offsetY,
      isActive: parsed.data.isActive,
    });

    return (await runWithLayer(effect, this.appLayer)) as unknown as 
      | {
          success: true;
          data: {
            id: string;
            name: string;
            description: string;
            logoPath: string;
            height: number | null;
            offsetX: number | null;
            offsetY: number | null;
            isActive: boolean;
            createdAt: Date;
          };
        }
      | { success: false; error: string }
  }

  /**
   * Update a sponsor
   */
  async update(input: unknown): Promise<
    | {
        success: true;
        data: {
          id: string;
          name: string;
          description: string;
          logoPath: string;
          height: number | null;
          offsetX: number | null;
          offsetY: number | null;
          isActive: boolean;
          updatedAt: Date;
        };
      }
    | { success: false; error: string }
  > {
    const parsed = validateUpdateSponsorInput(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const effect = updateSponsorUseCase({
      sponsorId: parsed.data.sponsorId,
      name: parsed.data.name,
      description: parsed.data.description,
      logoPath: parsed.data.logoPath,
      height: parsed.data.height,
      offsetX: parsed.data.offsetX,
      offsetY: parsed.data.offsetY,
      isActive: parsed.data.isActive,
    });

    return (await runWithLayer(effect, this.appLayer)) as unknown as 
      | {
          success: true;
          data: {
            id: string;
            name: string;
            description: string;
            logoPath: string;
            height: number | null;
            offsetX: number | null;
            offsetY: number | null;
            isActive: boolean;
            updatedAt: Date;
          };
        }
      | { success: false; error: string }
  }

  /**
   * Delete a sponsor
   */
  async delete(input: unknown): Promise<
    | {
        success: true;
        data: {
          id: string;
          deleted: boolean;
        };
      }
    | { success: false; error: string }
  > {
    const parsed = validateDeleteSponsorInput(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const effect = deleteSponsorUseCase({ sponsorId: parsed.data.id });

    return (await runWithLayer(effect, this.appLayer)) as unknown as 
      | {
          success: true;
          data: {
            id: string;
            deleted: boolean;
          };
        }
      | { success: false; error: string }
  }

  /**
   * List all sponsors
   */
  async list(input: unknown): Promise<
    | {
        success: true;
        data: {
          sponsors: Array<{
            id: string;
            name: string;
            description: string;
            logoPath: string;
            height: number | null;
            offsetX: number | null;
            offsetY: number | null;
            isActive: boolean;
            createdAt: Date;
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

    const effect = listSponsorsUseCase({
      limit: parsed.data.limit,
      offset: parsed.data.offset,
      activeOnly: parsed.data.activeOnly,
    });

    return (await runWithLayer(effect, this.appLayer)) as unknown as 
      | {
          success: true;
          data: {
            sponsors: Array<{
              id: string;
              name: string;
              description: string;
              logoPath: string;
              height: number | null;
              offsetX: number | null;
              offsetY: number | null;
              isActive: boolean;
              createdAt: Date;
            }>;
            total: number;
          };
        }
      | { success: false; error: string }
  }

  /**
   * Link a sponsor to a trip
   */
  async linkToTrip(input: unknown): Promise<
    | {
        success: true;
        data: {
          sponsorId: string;
          tripId: string;
          linked: boolean;
        };
      }
    | { success: false; error: string }
  > {
    const parsed = validateLinkToTripInput(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const effect = linkSponsorToTripUseCase({
      sponsorId: parsed.data.sponsorId,
      tripId: parsed.data.tripId,
    });

    return (await runWithLayer(effect, this.appLayer)) as unknown as 
      | {
          success: true;
          data: {
            sponsorId: string;
            tripId: string;
            linked: boolean;
          };
        }
      | { success: false; error: string }
  }

  /**
   * Unlink a sponsor from a trip
   */
  async unlinkFromTrip(input: unknown): Promise<
    | {
        success: true;
        data: {
          sponsorId: string;
          tripId: string;
          unlinked: boolean;
        };
      }
    | { success: false; error: string }
  > {
    const parsed = validateUnlinkFromTripInput(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const effect = unlinkSponsorFromTripUseCase({
      sponsorId: parsed.data.sponsorId,
      tripId: parsed.data.tripId,
    });

    return (await runWithLayer(effect, this.appLayer)) as unknown as 
      | {
          success: true;
          data: {
            sponsorId: string;
            tripId: string;
            unlinked: boolean;
          };
        }
      | { success: false; error: string }
  }
}
