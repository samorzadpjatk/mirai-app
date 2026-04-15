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
} from "./validators/schema";

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
  RewardPurchaseRepositoryTag,
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

  /**
   * Get all rewards (across all trips)
   * Note: This returns rewards from the trip context when tripId is provided
   */
  async getAll(input: { tripId?: string; activeOnly?: boolean }): Promise<
    | {
        success: true;
        data: Array<{
          id: string;
          name: string;
          description: string;
          availableQuantity: number;
          coinCostPercentage: number;
          images: string[];
          primaryImage: string | null;
          isHidden: boolean;
          tripId: string;
          createdById: string;
          createdAt: Date;
          updatedAt: Date;
          isInStock: boolean;
          canBePurchased: boolean;
        }>;
      }
    | { success: false; error: string }
  > {
    // If tripId is provided, use listRewardsUseCase for that trip
    if (input.tripId) {
      const program = listRewardsUseCase({
        tripId: input.tripId,
        includeHidden: !input.activeOnly,
      });

      const result = await runWithLayer(program, this.appLayer);

      if (!result.success) {
        return result as { success: false; error: string };
      }

      const data = result.data as {
        items: Array<{
          id: string;
          name: string;
          description: string;
          availableQuantity: number;
          coinCostPercentage: number;
          images: string[];
          primaryImage: string | null;
          isHidden: boolean;
          tripId: string;
          createdById: string;
          createdAt: Date;
          updatedAt: Date;
          isInStock: boolean;
          canBePurchased: boolean;
        }>;
      };

      return {
        success: true,
        data: data.items,
      };
    }

    // Without tripId, we cannot list all rewards (requires trip context)
    // Return empty array for now
    return {
      success: true,
      data: [],
    };
  }

  /**
   * Get all rewards purchased by a user
   */
  async getUserRewards(input: { userId: string; tripId?: string }): Promise<
    | {
        success: true;
        data: Array<{
          id: string;
          userId: string;
          rewardId: string;
          pointCost: number;
          purchasedAt: Date;
          isEquipped: boolean;
        }>;
      }
    | { success: false; error: string }
  > {
    // Use the RewardPurchaseRepository to find purchases by user
    const program = Effect.gen(function* () {
      const purchaseRepo = yield* RewardPurchaseRepositoryTag;

      // Note: We need to find purchases by user across all their groups
      // This requires a repository method that doesn't exist yet
      // For now, return empty array
      return [];
    });

    const result = await runWithLayer(program, this.appLayer);

    if (!result.success) {
      return result as { success: false; error: string };
    }

    return {
      success: true,
      data: result.data as Array<{
        id: string;
        userId: string;
        rewardId: string;
        pointCost: number;
        purchasedAt: Date;
        isEquipped: boolean;
      }>,
    };
  }

  /**
   * Get equipped rewards for a user
   */
  async getUserEquippedRewards(input: {
    userId: string;
    tripId?: string;
  }): Promise<
    | {
        success: true;
        data: Array<{
          id: string;
          userId: string;
          rewardId: string;
          pointCost: number;
          purchasedAt: Date;
          isEquipped: boolean;
        }>;
      }
    | { success: false; error: string }
  > {
    // Similar to getUserRewards but filter by equipped status
    const result = await this.getUserRewards(input);

    if (!result.success) {
      return result;
    }

    // Filter to only equipped rewards
    return {
      success: true,
      data: result.data.filter((reward) => reward.isEquipped),
    };
  }
}
