import { Effect, type Layer } from "effect";
import {
  getRewardUseCase,
  createRewardUseCase,
  updateRewardUseCase,
  setRewardHiddenUseCase,
  deleteRewardUseCase,
  listRewardsUseCase,
  purchaseRewardUseCase,
  updatePurchaseStatusUseCase,
  updateMyPurchaseStatusUseCase,
  getPurchaseHistoryUseCase,
  type GetRewardOutput,
  type ListRewardsOutput,
  type CreateRewardOutput,
  type UpdateRewardOutput,
  type SetRewardHiddenOutput,
  type DeleteRewardOutput,
  type PurchaseRewardOutput,
  type UpdatePurchaseStatusOutput,
  type UpdateMyPurchaseStatusOutput,
  type GetPurchaseHistoryOutput,
} from "@mirai-app/use-cases";
import {
  validateGetByIdInput,
  validateGetByTripInput,
  validateGetByTripAdminInput,
  validateCreateInput,
  validateUpdateInput,
  validateSetHiddenInput,
  validateDeleteInput,
  validatePurchaseInput,
  validateUpdatePurchaseStatusInput,
  validateUpdateMyPurchaseStatusInput,
  validateGetPurchaseHistoryInput,
} from "./validators/reward-validators";

export {
  validateGetByIdInput,
  validateGetByTripInput,
  validateGetByTripAdminInput,
  validateCreateInput,
  validateUpdateInput,
  validateSetHiddenInput,
  validateDeleteInput,
  validatePurchaseInput,
  validateUpdatePurchaseStatusInput,
  validateUpdateMyPurchaseStatusInput,
  validateGetPurchaseHistoryInput,
};

import {
  RewardRepositoryTag,
  TripPointsCalculatorTag,
} from "@mirai-app/use-cases";

import type { RewardId } from "@mirai-app/domain";
import { UserRole, RewardPurchaseStatus } from "@mirai-app/domain";

/**
 * Input validation schemas for reward controller
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
 * RewardController
 *
 * Thin controller that delegates to use cases.
 * No business logic here - just input validation, use case orchestration,
 * and error handling.
 *
 * Updated for Step 4: Now uses Effect Layers instead of direct repository injection.
 */
export class RewardController {
  constructor(private appLayer: Layer.Layer<unknown>) {}

  /**
   * Get a reward by ID
   */
  async getById(
    input: unknown,
  ): Promise<
    { success: true; data: GetRewardOutput } | { success: false; error: string }
  > {
    const parsed = validateGetByIdInput(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const program = getRewardUseCase({
      rewardId: parsed.data.id as RewardId,
    });

    return (await runWithLayer(program, this.appLayer)) as unknown as
      | {
          success: true;
          data: GetRewardOutput;
        }
      | { success: false; error: string };
  }

  /**
   * Get rewards by trip (public view - excludes hidden)
   */
  async getByTrip(
    input: unknown,
  ): Promise<
    | { success: true; data: ListRewardsOutput }
    | { success: false; error: string }
  > {
    const parsed = validateGetByTripInput(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const program = listRewardsUseCase({
      tripId: parsed.data.tripId,
      groupCoins: parsed.data.groupCoins,
    }).pipe();

    return (await runWithLayer(program, this.appLayer)) as unknown as
      | {
          success: true;
          data: ListRewardsOutput;
        }
      | { success: false; error: string };
  }

  /**
   * Get all rewards for a trip (admin view - includes hidden)
   */
  async getByTripAdmin(
    input: unknown,
  ): Promise<
    | { success: true; data: ListRewardsOutput }
    | { success: false; error: string }
  > {
    const parsed = validateGetByTripAdminInput(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const program = listRewardsUseCase({
      tripId: parsed.data.tripId,
      includeHidden: true,
      pagination: parsed.data.pagination,
    }).pipe();

    return (await runWithLayer(program, this.appLayer)) as unknown as
      | {
          success: true;
          data: ListRewardsOutput;
        }
      | { success: false; error: string };
  }

  /**
   * Create a new reward
   */
  async create(
    input: unknown,
  ): Promise<
    | { success: true; data: CreateRewardOutput }
    | { success: false; error: string }
  > {
    const parsed = validateCreateInput(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const program = createRewardUseCase({
      name: parsed.data.name,
      description: parsed.data.description,
      availableQuantity: parsed.data.availableQuantity,
      coinCostPercentage: parsed.data.coinCostPercentage,
      images: parsed.data.images,
      isHidden: parsed.data.isHidden,
      tripId: parsed.data.tripId,
      createdById: parsed.data.createdById,
      creatorRole: parsed.data.creatorRole,
    }).pipe();

    return (await runWithLayer(program, this.appLayer)) as unknown as
      | {
          success: true;
          data: CreateRewardOutput;
        }
      | { success: false; error: string };
  }

  /**
   * Update a reward
   */
  async update(
    input: unknown,
  ): Promise<
    | { success: true; data: UpdateRewardOutput }
    | { success: false; error: string }
  > {
    const parsed = validateUpdateInput(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const program = updateRewardUseCase({
      rewardId: parsed.data.rewardId as RewardId,
      name: parsed.data.name,
      description: parsed.data.description,
      availableQuantity: parsed.data.availableQuantity,
      images: parsed.data.images,
      coinCostPercentage: parsed.data.coinCostPercentage,
    });

    return (await runWithLayer(program, this.appLayer)) as unknown as
      | {
          success: true;
          data: UpdateRewardOutput;
        }
      | { success: false; error: string };
  }

  /**
   * Set reward hidden status
   */
  async setHidden(input: unknown): Promise<
    | {
        success: true;
        data: SetRewardHiddenOutput;
      }
    | { success: false; error: string }
  > {
    const parsed = validateSetHiddenInput(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const program = setRewardHiddenUseCase({
      rewardId: parsed.data.rewardId as RewardId,
      isHidden: parsed.data.isHidden,
    });

    return (await runWithLayer(program, this.appLayer)) as unknown as
      | {
          success: true;
          data: SetRewardHiddenOutput;
        }
      | { success: false; error: string };
  }

  /**
   * Delete a reward (only if no purchases)
   */
  async delete(
    input: unknown,
  ): Promise<
    | { success: true; data: DeleteRewardOutput }
    | { success: false; error: string }
  > {
    const parsed = validateDeleteInput(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const program = deleteRewardUseCase({
      rewardId: parsed.data.rewardId as RewardId,
    });

    return (await runWithLayer(program, this.appLayer)) as unknown as
      | {
          success: true;
          data: DeleteRewardOutput;
        }
      | { success: false; error: string };
  }

  /**
   * Purchase a reward
   */
  async purchase(input: unknown): Promise<
    | {
        success: true;
        data: PurchaseRewardOutput;
      }
    | { success: false; error: string }
  > {
    const parsed = validatePurchaseInput(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const program = purchaseRewardUseCase({
      rewardId: parsed.data.rewardId as RewardId,
      quantity: parsed.data.quantity,
      userId: parsed.data.userId,
    });

    return (await runWithLayer(program, this.appLayer)) as unknown as
      | {
          success: true;
          data: PurchaseRewardOutput;
        }
      | { success: false; error: string };
  }

  /**
   * Update purchase status (admin/staff only)
   */
  async updatePurchaseStatus(input: unknown): Promise<
    | {
        success: true;
        data: UpdatePurchaseStatusOutput;
      }
    | { success: false; error: string }
  > {
    const parsed = validateUpdatePurchaseStatusInput(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const program = updatePurchaseStatusUseCase({
      purchaseId: parsed.data.purchaseId,
      newStatus: parsed.data.status,
      updatedById: parsed.data.updatedById,
      collectionMethod: parsed.data.collectionMethod,
    });

    return (await runWithLayer(program, this.appLayer)) as unknown as
      | {
          success: true;
          data: UpdatePurchaseStatusOutput;
        }
      | { success: false; error: string };
  }

  /**
   * Update my purchase status (group leader only - limited transitions)
   */
  async updateMyPurchaseStatus(input: unknown): Promise<
    | {
        success: true;
        data: UpdateMyPurchaseStatusOutput;
      }
    | { success: false; error: string }
  > {
    const parsed = validateUpdateMyPurchaseStatusInput(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const program = updateMyPurchaseStatusUseCase({
      purchaseId: parsed.data.purchaseId,
      newStatus: parsed.data.status,
      updatedById: parsed.data.userId,
    });

    return (await runWithLayer(program, this.appLayer)) as unknown as
      | {
          success: true;
          data: UpdateMyPurchaseStatusOutput;
        }
      | { success: false; error: string };
  }

  /**
   * Get total available points for a trip
   */
  async getTotalAvailablePoints(input: {
    tripId: string;
  }): Promise<
    | { success: true; data: { totalPoints: number } }
    | { success: false; error: string }
  > {
    const program = Effect.gen(function* () {
      const calculator = yield* TripPointsCalculatorTag;
      const totalPoints = yield* calculator.calculateTotalAvailablePoints(
        input.tripId,
      );
      return { totalPoints };
    });

    return (await runWithLayer(program, this.appLayer)) as unknown as
      | {
          success: true;
          data: { totalPoints: number };
        }
      | { success: false; error: string };
  }

  /**
   * Get purchase history for a trip
   */
  async getPurchaseHistory(input: unknown): Promise<
    | {
        success: true;
        data: GetPurchaseHistoryOutput;
      }
    | { success: false; error: string }
  > {
    const parsed = validateGetPurchaseHistoryInput(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const program = getPurchaseHistoryUseCase({
      tripId: parsed.data.tripId,
      userId: parsed.data.userId,
      isStaff: parsed.data.isStaff,
      pagination: parsed.data.pagination,
    });

    return (await runWithLayer(program, this.appLayer)) as unknown as
      | {
          success: true;
          data: GetPurchaseHistoryOutput;
        }
      | { success: false; error: string };
  }
}
