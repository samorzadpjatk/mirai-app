import { z } from "zod";
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
} from "@mirai-app/use-cases";
import {
  RewardRepositoryTag,
  TripPointsCalculatorTag,
} from "@mirai-app/use-cases";
import type { RewardId } from "@mirai-app/domain";
import { UserRole, RewardPurchaseStatus } from "@mirai-app/domain";

/**
 * Input validation schemas for reward controller
 */
const schemas = {
  getById: z.object({
    id: z.string().min(1, "Reward ID is required"),
  }),

  getByTrip: z.object({
    tripId: z.string().min(1, "Trip ID is required"),
    groupCoins: z.number().optional(),
  }),

  getByTripAdmin: z.object({
    tripId: z.string().min(1, "Trip ID is required"),
    pagination: z
      .object({
        limit: z.number().int().min(1).max(100).default(30),
        offset: z.number().int().min(0).default(0),
      })
      .optional(),
  }),

  create: z.object({
    name: z.string().min(1, "Name is required").max(200),
    description: z.string().min(1, "Description is required").max(2000),
    availableQuantity: z.number().int().min(0).max(1_000_000),
    coinCostPercentage: z.number().int().min(1).max(100),
    images: z.array(z.string().min(1).max(2000)).max(10).optional(),
    isHidden: z.boolean().optional(),
    tripId: z.string().min(1, "Trip ID is required"),
    createdById: z.string().min(1, "Creator ID is required"),
    creatorRole: z.nativeEnum(UserRole),
  }),

  update: z.object({
    rewardId: z.string().min(1, "Reward ID is required"),
    name: z.string().min(1).max(200).optional(),
    description: z.string().min(1).max(2000).optional(),
    availableQuantity: z.number().int().min(0).max(1_000_000).optional(),
    images: z.array(z.string().min(1).max(2000)).max(10).optional(),
    coinCostPercentage: z.number().int().min(1).max(100).optional(),
  }),

  setHidden: z.object({
    rewardId: z.string().min(1, "Reward ID is required"),
    isHidden: z.boolean(),
  }),

  delete: z.object({
    rewardId: z.string().min(1, "Reward ID is required"),
  }),

  purchase: z.object({
    rewardId: z.string().min(1, "Reward ID is required"),
    quantity: z.number().int().min(1),
    userId: z.string().min(1, "User ID is required"),
  }),

  updatePurchaseStatus: z.object({
    purchaseId: z.string().min(1, "Purchase ID is required"),
    status: z.nativeEnum(RewardPurchaseStatus),
    updatedById: z.string().min(1, "Updater ID is required"),
    collectionMethod: z.string().min(1).max(500).optional(),
  }),

  updateMyPurchaseStatus: z.object({
    purchaseId: z.string().min(1, "Purchase ID is required"),
    status: z.nativeEnum(RewardPurchaseStatus),
    userId: z.string().min(1, "User ID is required"),
  }),

  getPurchaseHistory: z.object({
    tripId: z.string().min(1, "Trip ID is required"),
    userId: z.string().min(1, "User ID is required"),
    isStaff: z.boolean().optional(),
    pagination: z
      .object({
        limit: z.number().int().min(1).max(100).default(30),
        offset: z.number().int().min(0).default(0),
      })
      .optional(),
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
    const parsed = schemas.getById.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const program = getRewardUseCase({
      rewardId: parsed.data.id as RewardId,
    });

    return await runWithLayer(program, this.appLayer);
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
    const parsed = schemas.getByTrip.safeParse(input);
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

    return await runWithLayer(program, this.appLayer);
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
    const parsed = schemas.getByTripAdmin.safeParse(input);
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

    return await runWithLayer(program, this.appLayer);
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
    const parsed = schemas.create.safeParse(input);
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

    return await runWithLayer(program, this.appLayer);
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
    const parsed = schemas.update.safeParse(input);
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

    return await runWithLayer(program, this.appLayer);
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
    const parsed = schemas.setHidden.safeParse(input);
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

    return await runWithLayer(program, this.appLayer);
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
    const parsed = schemas.delete.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const program = deleteRewardUseCase({
      rewardId: parsed.data.rewardId as RewardId,
    });

    return await runWithLayer(program, this.appLayer);
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
    const parsed = schemas.purchase.safeParse(input);
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

    return await runWithLayer(program, this.appLayer);
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
    const parsed = schemas.updatePurchaseStatus.safeParse(input);
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

    return await runWithLayer(program, this.appLayer);
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
    const parsed = schemas.updateMyPurchaseStatus.safeParse(input);
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

    return await runWithLayer(program, this.appLayer);
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

    return await runWithLayer(program, this.appLayer);
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
    const parsed = schemas.getPurchaseHistory.safeParse(input);
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

    return await runWithLayer(program, this.appLayer);
  }
}
