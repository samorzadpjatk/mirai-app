import { z } from "zod";
import { Effect } from "effect";
import type {
  RewardRepository,
  RewardPurchaseRepository,
  TripPointsCalculator,
  GroupCoinsService,
  TripAccessChecker,
  GetRewardOutput,
  ListRewardsOutput,
  CreateRewardOutput,
  UpdateRewardOutput,
  SetRewardHiddenOutput,
  DeleteRewardOutput,
  PurchaseRewardOutput,
  UpdatePurchaseStatusOutput,
  UpdateMyPurchaseStatusOutput,
  GetPurchaseHistoryOutput,
} from "@mirai-app/use-cases";
import {
  SetRewardHiddenUseCase,
  PurchaseRewardUseCase,
  UpdatePurchaseStatusUseCase,
  UpdateMyPurchaseStatusUseCase,
  GetPurchaseHistoryUseCase,
} from "@mirai-app/use-cases";
import {
  getRewardUseCase,
  createRewardUseCase,
  updateRewardUseCase,
  deleteRewardUseCase,
  listRewardsUseCase,
} from "@mirai-app/use-cases/interactors";
import {
  RewardRepositoryTag,
  TripAccessCheckerTag,
  TripPointsCalculatorTag,
} from "@mirai-app/use-cases";
import type { RewardId, UserId } from "@mirai-app/domain";
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
 * RewardController
 *
 * Thin controller that delegates to use cases.
 * No business logic here - just input validation, use case orchestration,
 * and error handling.
 */
export class RewardController {
  constructor(
    private rewardRepository: RewardRepository,
    private purchaseRepository: RewardPurchaseRepository,
    private pointsCalculator: TripPointsCalculator,
    private coinsService: GroupCoinsService,
    private accessChecker: TripAccessChecker,
  ) {}

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
    }).pipe(
      Effect.provideService(RewardRepositoryTag, {
        create: (reward) =>
          Effect.promise(() => this.rewardRepository.create(reward)),
        findById: (id) =>
          Effect.promise(() => this.rewardRepository.findById(id)),
        findByTripId: (tripId, options) =>
          Effect.promise(() =>
            this.rewardRepository.findByTripId(tripId, options),
          ),
        findVisibleByTripId: (tripId, options) =>
          Effect.promise(() =>
            this.rewardRepository.findVisibleByTripId(tripId, options),
          ),
        update: (reward) =>
          Effect.promise(() => this.rewardRepository.update(reward)),
        delete: (id) => Effect.promise(() => this.rewardRepository.delete(id)),
        hasPurchases: (id) =>
          Effect.promise(() => this.rewardRepository.hasPurchases(id)),
        getPurchaseCount: (id) =>
          Effect.promise(() => this.rewardRepository.getPurchaseCount(id)),
        decrementQuantity: (id, amount) =>
          Effect.promise(() =>
            this.rewardRepository.decrementQuantity(id, amount),
          ),
        incrementQuantity: (id, amount) =>
          Effect.promise(() =>
            this.rewardRepository.incrementQuantity(id, amount),
          ),
      }),
    );

    try {
      const result = await Effect.runPromise(program);
      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Set reward hidden status
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
    }).pipe(
      Effect.provideService(RewardRepositoryTag, {
        create: (reward) =>
          Effect.promise(() => this.rewardRepository.create(reward)),
        findById: (id) =>
          Effect.promise(() => this.rewardRepository.findById(id)),
        findByTripId: (tripId, options) =>
          Effect.promise(() =>
            this.rewardRepository.findByTripId(tripId, options),
          ),
        findVisibleByTripId: (tripId, options) =>
          Effect.promise(() =>
            this.rewardRepository.findVisibleByTripId(tripId, options),
          ),
        update: (reward) =>
          Effect.promise(() => this.rewardRepository.update(reward)),
        delete: (id) => Effect.promise(() => this.rewardRepository.delete(id)),
        hasPurchases: (id) =>
          Effect.promise(() => this.rewardRepository.hasPurchases(id)),
        getPurchaseCount: (id) =>
          Effect.promise(() => this.rewardRepository.getPurchaseCount(id)),
        decrementQuantity: (id, amount) =>
          Effect.promise(() =>
            this.rewardRepository.decrementQuantity(id, amount),
          ),
        incrementQuantity: (id, amount) =>
          Effect.promise(() =>
            this.rewardRepository.incrementQuantity(id, amount),
          ),
      }),
      Effect.provideService(TripPointsCalculatorTag, {
        calculateTotalAvailablePoints: (tripId) =>
          Effect.promise(() =>
            this.pointsCalculator.calculateTotalAvailablePoints(tripId),
          ),
      }),
    );

    try {
      const result = await Effect.runPromise(program);
      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
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
    }).pipe(
      Effect.provideService(RewardRepositoryTag, {
        create: (reward) =>
          Effect.promise(() => this.rewardRepository.create(reward)),
        findById: (id) =>
          Effect.promise(() => this.rewardRepository.findById(id)),
        findByTripId: (tripId, options) =>
          Effect.promise(() =>
            this.rewardRepository.findByTripId(tripId, options),
          ),
        findVisibleByTripId: (tripId, options) =>
          Effect.promise(() =>
            this.rewardRepository.findVisibleByTripId(tripId, options),
          ),
        update: (reward) =>
          Effect.promise(() => this.rewardRepository.update(reward)),
        delete: (id) => Effect.promise(() => this.rewardRepository.delete(id)),
        hasPurchases: (id) =>
          Effect.promise(() => this.rewardRepository.hasPurchases(id)),
        getPurchaseCount: (id) =>
          Effect.promise(() => this.rewardRepository.getPurchaseCount(id)),
        decrementQuantity: (id, amount) =>
          Effect.promise(() =>
            this.rewardRepository.decrementQuantity(id, amount),
          ),
        incrementQuantity: (id, amount) =>
          Effect.promise(() =>
            this.rewardRepository.incrementQuantity(id, amount),
          ),
      }),
      Effect.provideService(TripPointsCalculatorTag, {
        calculateTotalAvailablePoints: (tripId) =>
          Effect.promise(() =>
            this.pointsCalculator.calculateTotalAvailablePoints(tripId),
          ),
      }),
    );

    try {
      const result = await Effect.runPromise(program);
      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
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
    }).pipe(
      Effect.provideService(RewardRepositoryTag, {
        create: (reward) =>
          Effect.promise(() => this.rewardRepository.create(reward)),
        findById: (id) =>
          Effect.promise(() => this.rewardRepository.findById(id)),
        findByTripId: (tripId, options) =>
          Effect.promise(() =>
            this.rewardRepository.findByTripId(tripId, options),
          ),
        findVisibleByTripId: (tripId, options) =>
          Effect.promise(() =>
            this.rewardRepository.findVisibleByTripId(tripId, options),
          ),
        update: (reward) =>
          Effect.promise(() => this.rewardRepository.update(reward)),
        delete: (id) => Effect.promise(() => this.rewardRepository.delete(id)),
        hasPurchases: (id) =>
          Effect.promise(() => this.rewardRepository.hasPurchases(id)),
        getPurchaseCount: (id) =>
          Effect.promise(() => this.rewardRepository.getPurchaseCount(id)),
        decrementQuantity: (id, amount) =>
          Effect.promise(() =>
            this.rewardRepository.decrementQuantity(id, amount),
          ),
        incrementQuantity: (id, amount) =>
          Effect.promise(() =>
            this.rewardRepository.incrementQuantity(id, amount),
          ),
      }),
      Effect.provideService(TripAccessCheckerTag, {
        isGroupLeader: (userId) =>
          Effect.promise(() => this.accessChecker.isGroupLeader(userId)),
        isStaff: (userId) =>
          Effect.promise(() => this.accessChecker.isStaff(userId)),
        hasTripEnded: (tripId) =>
          Effect.promise(() => this.accessChecker.hasTripEnded(tripId)),
      }),
    );

    try {
      const result = await Effect.runPromise(program);
      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
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
    }).pipe(
      Effect.provideService(RewardRepositoryTag, {
        create: (reward) =>
          Effect.promise(() => this.rewardRepository.create(reward)),
        findById: (id) =>
          Effect.promise(() => this.rewardRepository.findById(id)),
        findByTripId: (tripId, options) =>
          Effect.promise(() =>
            this.rewardRepository.findByTripId(tripId, options),
          ),
        findVisibleByTripId: (tripId, options) =>
          Effect.promise(() =>
            this.rewardRepository.findVisibleByTripId(tripId, options),
          ),
        update: (reward) =>
          Effect.promise(() => this.rewardRepository.update(reward)),
        delete: (id) => Effect.promise(() => this.rewardRepository.delete(id)),
        hasPurchases: (id) =>
          Effect.promise(() => this.rewardRepository.hasPurchases(id)),
        getPurchaseCount: (id) =>
          Effect.promise(() => this.rewardRepository.getPurchaseCount(id)),
        decrementQuantity: (id, amount) =>
          Effect.promise(() =>
            this.rewardRepository.decrementQuantity(id, amount),
          ),
        incrementQuantity: (id, amount) =>
          Effect.promise(() =>
            this.rewardRepository.incrementQuantity(id, amount),
          ),
      }),
    );

    try {
      const result = await Effect.runPromise(program);
      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
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

    const useCase = new SetRewardHiddenUseCase(this.rewardRepository);
    const result = await useCase.execute({
      rewardId: parsed.data.rewardId as RewardId,
      isHidden: parsed.data.isHidden,
    });

    if (result.kind === "err") {
      return { success: false, error: result.error };
    }

    return { success: true, data: result.value };
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
    }).pipe(
      Effect.provideService(RewardRepositoryTag, {
        create: (reward) =>
          Effect.promise(() => this.rewardRepository.create(reward)),
        findById: (id) =>
          Effect.promise(() => this.rewardRepository.findById(id)),
        findByTripId: (tripId, options) =>
          Effect.promise(() =>
            this.rewardRepository.findByTripId(tripId, options),
          ),
        findVisibleByTripId: (tripId, options) =>
          Effect.promise(() =>
            this.rewardRepository.findVisibleByTripId(tripId, options),
          ),
        update: (reward) =>
          Effect.promise(() => this.rewardRepository.update(reward)),
        delete: (id) => Effect.promise(() => this.rewardRepository.delete(id)),
        hasPurchases: (id) =>
          Effect.promise(() => this.rewardRepository.hasPurchases(id)),
        getPurchaseCount: (id) =>
          Effect.promise(() => this.rewardRepository.getPurchaseCount(id)),
        decrementQuantity: (id, amount) =>
          Effect.promise(() =>
            this.rewardRepository.decrementQuantity(id, amount),
          ),
        incrementQuantity: (id, amount) =>
          Effect.promise(() =>
            this.rewardRepository.incrementQuantity(id, amount),
          ),
      }),
    );

    try {
      const result = await Effect.runPromise(program);
      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
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

    const useCase = new PurchaseRewardUseCase(
      this.rewardRepository,
      this.purchaseRepository,
      this.pointsCalculator,
      this.coinsService,
      this.accessChecker,
    );
    const result = await useCase.execute({
      rewardId: parsed.data.rewardId as RewardId,
      quantity: parsed.data.quantity,
      userId: parsed.data.userId,
    });

    if (result.kind === "err") {
      return { success: false, error: result.error };
    }

    return { success: true, data: result.value };
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

    const useCase = new UpdatePurchaseStatusUseCase(
      this.rewardRepository,
      this.purchaseRepository,
      this.coinsService,
      this.accessChecker,
    );
    const result = await useCase.execute({
      purchaseId: parsed.data.purchaseId,
      newStatus: parsed.data.status,
      updatedById: parsed.data.updatedById,
      collectionMethod: parsed.data.collectionMethod,
    });

    if (result.kind === "err") {
      return { success: false, error: result.error };
    }

    return { success: true, data: result.value };
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

    const useCase = new UpdateMyPurchaseStatusUseCase(
      this.rewardRepository,
      this.purchaseRepository,
      this.coinsService,
      this.accessChecker,
    );
    const result = await useCase.execute({
      purchaseId: parsed.data.purchaseId,
      newStatus: parsed.data.status,
      updatedById: parsed.data.userId,
    });

    if (result.kind === "err") {
      return { success: false, error: result.error };
    }

    return { success: true, data: result.value };
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
    try {
      const totalPoints =
        await this.pointsCalculator.calculateTotalAvailablePoints(input.tripId);
      return { success: true, data: { totalPoints } };
    } catch (error) {
      return { success: false, error: "Failed to calculate points" };
    }
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

    const useCase = new GetPurchaseHistoryUseCase(
      this.purchaseRepository,
      this.accessChecker,
    );
    const result = await useCase.execute({
      tripId: parsed.data.tripId,
      userId: parsed.data.userId,
      isStaff: parsed.data.isStaff,
      pagination: parsed.data.pagination,
    });

    if (result.kind === "err") {
      return { success: false, error: result.error };
    }

    return { success: true, data: result.value };
  }
}
