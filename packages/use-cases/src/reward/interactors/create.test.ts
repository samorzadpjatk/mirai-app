import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import {
  createRewardUseCase,
  type CreateRewardInput,
  CreateRewardError,
  RewardRepositoryError,
} from "./create";
import { RewardGatewayTag, type RewardGateway } from "../ports/gateway";
import type {
  TripAccessChecker,
  GroupCoinsService,
} from "../../trip/ports/gateway";
import {
  TripAccessCheckerTag,
  GroupCoinsServiceTag,
} from "../../trip/ports/gateway";
import type { RewardDTO } from "../dto";
import { DatabaseError, RewardStatus, UserRole } from "@mirai-app/domain";

/**
 * Mock RewardGateway for testing
 */
function createMockRewardGateway(
  rewards: RewardDTO[] = [],
  options: {
    shouldFailCreate?: boolean;
  } = {},
): RewardGateway {
  const rewardMap = new Map(rewards.map((r) => [r.id, r]));

  return {
    create: (reward: RewardDTO) => {
      if (options.shouldFailCreate) {
        return Effect.fail(
          new DatabaseError({
            operation: "create",
            message: "Database error",
          }),
        );
      }
      rewardMap.set(reward.id, reward);
      return Effect.succeed(reward);
    },

    findById: (id: string) => {
      const reward = rewardMap.get(id);
      return Effect.succeed(reward ?? null);
    },

    findByTripIdConnection: () =>
      Effect.succeed({
        edges: [],
        nodes: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
        totalCount: 0,
      }),

    findVisibleByTripIdConnection: () =>
      Effect.succeed({
        edges: [],
        nodes: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
        totalCount: 0,
      }),

    update: (reward: RewardDTO) => Effect.succeed(reward),

    delete: () => Effect.succeed(void 0),

    hasPurchases: () => Effect.succeed(false),

    getPurchaseCount: () => Effect.succeed(0),

    decrementQuantity: (id: string) => {
      const reward = rewardMap.get(id);
      return reward
        ? Effect.succeed(reward)
        : Effect.fail(
            new DatabaseError({
              operation: "decrementQuantity",
              message: "Reward not found",
            }),
          );
    },

    incrementQuantity: (id: string) => {
      const reward = rewardMap.get(id);
      return reward
        ? Effect.succeed(reward)
        : Effect.fail(
            new DatabaseError({
              operation: "incrementQuantity",
              message: "Reward not found",
            }),
          );
    },
  };
}

/**
 * Extended TripAccessChecker for testing with hasTripEnded
 */
interface ExtendedTripAccessChecker extends TripAccessChecker {
  hasTripEnded(tripId: string): Effect.Effect<boolean, Error, never>;
}

/**
 * Mock TripAccessChecker for testing
 */
function createMockTripAccessChecker(
  options: {
    isStaff?: boolean;
    hasTripEnded?: boolean;
    shouldFailIsStaff?: boolean;
    shouldFailHasTripEnded?: boolean;
  } = {},
): ExtendedTripAccessChecker {
  return {
    isStaff: () => {
      if (options.shouldFailIsStaff) {
        return Effect.fail(new Error("Failed to check staff status"));
      }
      return Effect.succeed(options.isStaff ?? true);
    },
    isGroupLeader: () =>
      Effect.succeed({
        isLeader: true,
        groupId: "group-123",
        groupName: "Test Group",
        coins: 1000,
      }),
    hasTripEnded: () => {
      if (options.shouldFailHasTripEnded) {
        return Effect.fail(new Error("Failed to check trip status"));
      }
      return Effect.succeed(options.hasTripEnded ?? false);
    },
  };
}

/**
 * Mock GroupCoinsService for testing
 */
function createMockGroupCoinsService(): GroupCoinsService {
  return {
    addCoins: () =>
      Effect.succeed({
        id: "transaction-123",
        groupId: "group-123",
        amount: 100,
        type: "ADD",
        reason: "Test",
        createdById: "user-123",
        createdAt: new Date(),
      }),
  };
}

describe("[UNIT] createRewardUseCase", () => {
  it("should create reward successfully when user is staff", async () => {
    const mockGateway = createMockRewardGateway([]);
    const mockAccessChecker = createMockTripAccessChecker({ isStaff: true });
    const mockCoinsService = createMockGroupCoinsService();

    const rewardLayer = Layer.succeed(RewardGatewayTag, mockGateway);
    const accessLayer = Layer.succeed(
      TripAccessCheckerTag,
      mockAccessChecker as TripAccessChecker,
    );
    const coinsLayer = Layer.succeed(GroupCoinsServiceTag, mockCoinsService);
    const combinedLayer = Layer.mergeAll(rewardLayer, accessLayer, coinsLayer);

    const input: CreateRewardInput = {
      name: "New Reward",
      description: "A test reward",
      availableQuantity: 10,
      coinCostPercentage: 50,
      tripId: "trip-123",
      createdById: "user-123",
      creatorRole: UserRole.MODERATOR,
    };

    const program = createRewardUseCase(input).pipe(
      Effect.provide(combinedLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.name).toBe("New Reward");
    expect(result.description).toBe("A test reward");
    expect(result.availableQuantity).toBe(10);
    expect(result.coinCostPercentage).toBe(50);
    expect(result.tripId).toBe("trip-123");
    expect(result.createdById).toBe("user-123");
    expect(result.isInStock).toBe(true);
    expect(result.canBePurchased).toBe(true);
    expect(result.images).toEqual([]);
    expect(result.isHidden).toBe(false);
  });

  it("should fail with CreateRewardError when user is not staff", async () => {
    const mockGateway = createMockRewardGateway([]);
    const mockAccessChecker = createMockTripAccessChecker({ isStaff: false });
    const mockCoinsService = createMockGroupCoinsService();

    const rewardLayer = Layer.succeed(RewardGatewayTag, mockGateway);
    const accessLayer = Layer.succeed(
      TripAccessCheckerTag,
      mockAccessChecker as TripAccessChecker,
    );
    const coinsLayer = Layer.succeed(GroupCoinsServiceTag, mockCoinsService);
    const combinedLayer = Layer.mergeAll(rewardLayer, accessLayer, coinsLayer);

    const input: CreateRewardInput = {
      name: "New Reward",
      description: "A test reward",
      availableQuantity: 10,
      coinCostPercentage: 50,
      tripId: "trip-123",
      createdById: "user-123",
      creatorRole: UserRole.USER,
    };

    const program = createRewardUseCase(input).pipe(
      Effect.provide(combinedLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(CreateRewardError);
      expect(either.left.message).toBe(
        "Only moderators and admins can create rewards",
      );
    }
  });

  it("should fail with CreateRewardError when trip has ended", async () => {
    const mockGateway = createMockRewardGateway([]);
    const mockAccessChecker = createMockTripAccessChecker({
      isStaff: true,
      hasTripEnded: true,
    });
    const mockCoinsService = createMockGroupCoinsService();

    const rewardLayer = Layer.succeed(RewardGatewayTag, mockGateway);
    const accessLayer = Layer.succeed(
      TripAccessCheckerTag,
      mockAccessChecker as TripAccessChecker,
    );
    const coinsLayer = Layer.succeed(GroupCoinsServiceTag, mockCoinsService);
    const combinedLayer = Layer.mergeAll(rewardLayer, accessLayer, coinsLayer);

    const input: CreateRewardInput = {
      name: "New Reward",
      description: "A test reward",
      availableQuantity: 10,
      coinCostPercentage: 50,
      tripId: "trip-123",
      createdById: "user-123",
      creatorRole: UserRole.ADMIN,
    };

    const program = createRewardUseCase(input).pipe(
      Effect.provide(combinedLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(CreateRewardError);
      expect(either.left.message).toBe("Cannot create rewards for ended trips");
    }
  });

  it("should fail with CreateRewardError for invalid input", async () => {
    const mockGateway = createMockRewardGateway([]);
    const mockAccessChecker = createMockTripAccessChecker({ isStaff: true });
    const mockCoinsService = createMockGroupCoinsService();

    const rewardLayer = Layer.succeed(RewardGatewayTag, mockGateway);
    const accessLayer = Layer.succeed(
      TripAccessCheckerTag,
      mockAccessChecker as TripAccessChecker,
    );
    const coinsLayer = Layer.succeed(GroupCoinsServiceTag, mockCoinsService);
    const combinedLayer = Layer.mergeAll(rewardLayer, accessLayer, coinsLayer);

    const input: CreateRewardInput = {
      name: "",
      description: "A test reward",
      availableQuantity: -1,
      coinCostPercentage: 50,
      tripId: "trip-123",
      createdById: "user-123",
      creatorRole: UserRole.ADMIN,
    };

    const program = createRewardUseCase(input).pipe(
      Effect.provide(combinedLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(CreateRewardError);
    }
  });

  it("should fail with RewardRepositoryError when database fails", async () => {
    const mockGateway = createMockRewardGateway([], { shouldFailCreate: true });
    const mockAccessChecker = createMockTripAccessChecker({ isStaff: true });
    const mockCoinsService = createMockGroupCoinsService();

    const rewardLayer = Layer.succeed(RewardGatewayTag, mockGateway);
    const accessLayer = Layer.succeed(
      TripAccessCheckerTag,
      mockAccessChecker as TripAccessChecker,
    );
    const coinsLayer = Layer.succeed(GroupCoinsServiceTag, mockCoinsService);
    const combinedLayer = Layer.mergeAll(rewardLayer, accessLayer, coinsLayer);

    const input: CreateRewardInput = {
      name: "New Reward",
      description: "A test reward",
      availableQuantity: 10,
      coinCostPercentage: 50,
      tripId: "trip-123",
      createdById: "user-123",
      creatorRole: UserRole.ADMIN,
    };

    const program = createRewardUseCase(input).pipe(
      Effect.provide(combinedLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(RewardRepositoryError);
      expect(either.left.message).toBe("Failed to create reward");
    }
  });

  it("should create hidden reward when isHidden is true", async () => {
    const mockGateway = createMockRewardGateway([]);
    const mockAccessChecker = createMockTripAccessChecker({ isStaff: true });
    const mockCoinsService = createMockGroupCoinsService();

    const rewardLayer = Layer.succeed(RewardGatewayTag, mockGateway);
    const accessLayer = Layer.succeed(
      TripAccessCheckerTag,
      mockAccessChecker as TripAccessChecker,
    );
    const coinsLayer = Layer.succeed(GroupCoinsServiceTag, mockCoinsService);
    const combinedLayer = Layer.mergeAll(rewardLayer, accessLayer, coinsLayer);

    const input: CreateRewardInput = {
      name: "Hidden Reward",
      description: "A hidden test reward",
      availableQuantity: 5,
      coinCostPercentage: 100,
      isHidden: true,
      tripId: "trip-123",
      createdById: "user-123",
      creatorRole: UserRole.MODERATOR,
    };

    const program = createRewardUseCase(input).pipe(
      Effect.provide(combinedLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.isHidden).toBe(true);
    expect(result.name).toBe("Hidden Reward");
  });

  it("should create reward with images", async () => {
    const mockGateway = createMockRewardGateway([]);
    const mockAccessChecker = createMockTripAccessChecker({ isStaff: true });
    const mockCoinsService = createMockGroupCoinsService();

    const rewardLayer = Layer.succeed(RewardGatewayTag, mockGateway);
    const accessLayer = Layer.succeed(
      TripAccessCheckerTag,
      mockAccessChecker as TripAccessChecker,
    );
    const coinsLayer = Layer.succeed(GroupCoinsServiceTag, mockCoinsService);
    const combinedLayer = Layer.mergeAll(rewardLayer, accessLayer, coinsLayer);

    const input: CreateRewardInput = {
      name: "Reward With Images",
      description: "A reward with images",
      availableQuantity: 10,
      coinCostPercentage: 75,
      images: ["image1.jpg", "image2.jpg"],
      tripId: "trip-123",
      createdById: "user-123",
      creatorRole: UserRole.ADMIN,
    };

    const program = createRewardUseCase(input).pipe(
      Effect.provide(combinedLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.images).toEqual(["image1.jpg", "image2.jpg"]);
  });
});
