import { describe, it, expect, beforeEach } from "bun:test";
import {
  createRewardUseCase,
  type CreateRewardInput,
  CreateRewardError,
  RewardRepositoryError,
} from "./CreateReward";
import { Reward, UserRole, RewardId } from "@mirai-app/domain";
import { Effect, Either } from "effect";
import {
  RewardRepositoryTag,
  TripAccessCheckerTag,
} from "../ports/RewardRepository";
import { InMemoryRewardGateway } from "@mirai-app/adapters/gateways/_shared/in-memory-exports";

describe("[UNIT] createRewardUseCase (Effect)", () => {
  let rewardRepo: InMemoryRewardGateway;

  beforeEach(() => {
    rewardRepo = new InMemoryRewardGateway();
  });

  // Helper to create a valid reward input
  const createValidInput = (): CreateRewardInput => ({
    name: "Test Reward",
    description: "A test reward description",
    availableQuantity: 10,
    coinCostPercentage: 15,
    tripId: "trip-123",
    createdById: "user-123",
    creatorRole: UserRole.MODERATOR,
  });

  // Helper to run use case with mocked services
  const runUseCase = async (
    input: CreateRewardInput,
    isStaff: boolean = true,
    hasTripEnded: boolean = false,
  ) => {
    const program = createRewardUseCase(input).pipe(
      Effect.provideService(RewardRepositoryTag, {
        create: (reward: Reward) => rewardRepo.create(reward),
        findById: (id: RewardId) => rewardRepo.findById(id),
        findByTripId: (tripId: string, options?) =>
          rewardRepo.findByTripId(tripId, options),
        findVisibleByTripId: (tripId: string, options?) =>
          rewardRepo.findVisibleByTripId(tripId, options),
        update: (reward: Reward) => rewardRepo.update(reward),
        delete: (id: RewardId) => rewardRepo.delete(id),
        hasPurchases: (id: RewardId) => rewardRepo.hasPurchases(id),
        getPurchaseCount: (id: RewardId) => rewardRepo.getPurchaseCount(id),
        decrementQuantity: (id: RewardId, amount: number) =>
          rewardRepo.decrementQuantity(id, amount),
        incrementQuantity: (id: RewardId, amount: number) =>
          rewardRepo.incrementQuantity(id, amount),
      }),
      Effect.provideService(TripAccessCheckerTag, {
        isGroupLeader: () =>
          Effect.succeed({ isLeader: true, groupId: "group-123" }),
        isStaff: () => Effect.succeed(isStaff),
        hasTripEnded: () => Effect.succeed(hasTripEnded),
      }),
    );
    return await Effect.runPromise(program);
  };

  describe("[UNIT] execute", () => {
    it("should create reward with valid input", async () => {
      // Arrange
      const input = createValidInput();

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.name).toBe("Test Reward");
      expect(result.description).toBe("A test reward description");
      expect(result.availableQuantity).toBe(10);
      expect(result.coinCostPercentage).toBe(15);
      expect(result.tripId).toBe("trip-123");
      expect(result.createdById).toBe("user-123");
      expect(result.isInStock).toBe(true);
      expect(result.canBePurchased).toBe(true);

      // Verify reward was actually stored
      const stored = Effect.runSync(rewardRepo.findByTripId("trip-123"));
      expect(stored.items).toHaveLength(1);
      expect(stored.items[0]?.name).toBe("Test Reward");
    });

    it("should create reward with images", async () => {
      // Arrange
      const input: CreateRewardInput = {
        ...createValidInput(),
        images: [
          "https://example.com/image1.png",
          "https://example.com/image2.png",
        ],
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.images).toEqual([
        "https://example.com/image1.png",
        "https://example.com/image2.png",
      ]);

      // Verify stored reward
      const stored = Effect.runSync(rewardRepo.findByTripId("trip-123"));
      expect(stored.items[0]?.images).toHaveLength(2);
    });

    it("should create hidden reward when isHidden is true", async () => {
      // Arrange
      const input: CreateRewardInput = {
        ...createValidInput(),
        isHidden: true,
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.isHidden).toBe(true);
    });

    it("should reject non-staff users", async () => {
      // Arrange
      const input: CreateRewardInput = {
        ...createValidInput(),
        creatorRole: UserRole.USER,
      };

      // Act
      const program = createRewardUseCase(input).pipe(
        Effect.provideService(RewardRepositoryTag, {
          create: (reward: Reward) => rewardRepo.create(reward),
          findById: (id: RewardId) => rewardRepo.findById(id),
          findByTripId: (tripId: string, options?) =>
            rewardRepo.findByTripId(tripId, options),
          findVisibleByTripId: (tripId: string, options?) =>
            rewardRepo.findVisibleByTripId(tripId, options),
          update: (reward: Reward) => rewardRepo.update(reward),
          delete: (id: RewardId) => rewardRepo.delete(id),
          hasPurchases: (id: RewardId) => rewardRepo.hasPurchases(id),
          getPurchaseCount: (id: RewardId) => rewardRepo.getPurchaseCount(id),
          decrementQuantity: (id: RewardId, amount: number) =>
            rewardRepo.decrementQuantity(id, amount),
          incrementQuantity: (id: RewardId, amount: number) =>
            rewardRepo.incrementQuantity(id, amount),
        }),
        Effect.provideService(TripAccessCheckerTag, {
          isGroupLeader: () => Effect.succeed({ isLeader: false }),
          isStaff: () => Effect.succeed(false),
          hasTripEnded: () => Effect.succeed(false),
        }),
      );

      // Act & Assert - use Either to properly check error type
      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(CreateRewardError);
        expect(either.left.message).toContain("moderators");
      }

      // Verify no reward was stored
      const stored = Effect.runSync(rewardRepo.findByTripId("trip-123"));
      expect(stored.items).toHaveLength(0);
    });

    it("should reject creation for ended trips", async () => {
      // Arrange
      const input = createValidInput();

      // Act
      const program = createRewardUseCase(input).pipe(
        Effect.provideService(RewardRepositoryTag, {
          create: (reward: Reward) => rewardRepo.create(reward),
          findById: (id: RewardId) => rewardRepo.findById(id),
          findByTripId: (tripId: string, options?) =>
            rewardRepo.findByTripId(tripId, options),
          findVisibleByTripId: (tripId: string, options?) =>
            rewardRepo.findVisibleByTripId(tripId, options),
          update: (reward: Reward) => rewardRepo.update(reward),
          delete: (id: RewardId) => rewardRepo.delete(id),
          hasPurchases: (id: RewardId) => rewardRepo.hasPurchases(id),
          getPurchaseCount: (id: RewardId) => rewardRepo.getPurchaseCount(id),
          decrementQuantity: (id: RewardId, amount: number) =>
            rewardRepo.decrementQuantity(id, amount),
          incrementQuantity: (id: RewardId, amount: number) =>
            rewardRepo.incrementQuantity(id, amount),
        }),
        Effect.provideService(TripAccessCheckerTag, {
          isGroupLeader: () =>
            Effect.succeed({ isLeader: true, groupId: "group-123" }),
          isStaff: () => Effect.succeed(true),
          hasTripEnded: () => Effect.succeed(true),
        }),
      );

      // Act & Assert - use Either to properly check error type
      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(CreateRewardError);
        expect(either.left.message).toContain("ended");
      }

      // Verify no reward was stored
      const stored = Effect.runSync(rewardRepo.findByTripId("trip-123"));
      expect(stored.items).toHaveLength(0);
    });

    it("should fail when coinCostPercentage is out of range", async () => {
      // Arrange
      const input: CreateRewardInput = {
        ...createValidInput(),
        coinCostPercentage: 150, // Out of range (1-100)
      };

      // Act
      const program = createRewardUseCase(input).pipe(
        Effect.provideService(RewardRepositoryTag, {
          create: (reward: Reward) => rewardRepo.create(reward),
          findById: (id: RewardId) => rewardRepo.findById(id),
          findByTripId: (tripId: string, options?) =>
            rewardRepo.findByTripId(tripId, options),
          findVisibleByTripId: (tripId: string, options?) =>
            rewardRepo.findVisibleByTripId(tripId, options),
          update: (reward: Reward) => rewardRepo.update(reward),
          delete: (id: RewardId) => rewardRepo.delete(id),
          hasPurchases: (id: RewardId) => rewardRepo.hasPurchases(id),
          getPurchaseCount: (id: RewardId) => rewardRepo.getPurchaseCount(id),
          decrementQuantity: (id: RewardId, amount: number) =>
            rewardRepo.decrementQuantity(id, amount),
          incrementQuantity: (id: RewardId, amount: number) =>
            rewardRepo.incrementQuantity(id, amount),
        }),
        Effect.provideService(TripAccessCheckerTag, {
          isGroupLeader: () =>
            Effect.succeed({ isLeader: true, groupId: "group-123" }),
          isStaff: () => Effect.succeed(true),
          hasTripEnded: () => Effect.succeed(false),
        }),
      );

      // Act & Assert - use Either to properly check error type
      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(CreateRewardError);
        expect(either.left.message).toContain("percentage");
      }

      // Verify no reward was stored
      const stored = Effect.runSync(rewardRepo.findByTripId("trip-123"));
      expect(stored.items).toHaveLength(0);
    });

    it("should fail when description is empty", async () => {
      // Arrange
      const input: CreateRewardInput = {
        ...createValidInput(),
        description: "", // Empty description
      };

      // Act
      const program = createRewardUseCase(input).pipe(
        Effect.provideService(RewardRepositoryTag, {
          create: (reward: Reward) => rewardRepo.create(reward),
          findById: (id: RewardId) => rewardRepo.findById(id),
          findByTripId: (tripId: string, options?) =>
            rewardRepo.findByTripId(tripId, options),
          findVisibleByTripId: (tripId: string, options?) =>
            rewardRepo.findVisibleByTripId(tripId, options),
          update: (reward: Reward) => rewardRepo.update(reward),
          delete: (id: RewardId) => rewardRepo.delete(id),
          hasPurchases: (id: RewardId) => rewardRepo.hasPurchases(id),
          getPurchaseCount: (id: RewardId) => rewardRepo.getPurchaseCount(id),
          decrementQuantity: (id: RewardId, amount: number) =>
            rewardRepo.decrementQuantity(id, amount),
          incrementQuantity: (id: RewardId, amount: number) =>
            rewardRepo.incrementQuantity(id, amount),
        }),
        Effect.provideService(TripAccessCheckerTag, {
          isGroupLeader: () =>
            Effect.succeed({ isLeader: true, groupId: "group-123" }),
          isStaff: () => Effect.succeed(true),
          hasTripEnded: () => Effect.succeed(false),
        }),
      );

      // Act & Assert - use Either to properly check error type
      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(CreateRewardError);
        expect(either.left.message).toContain("Description");
      }
    });

    it("should allow admin users to create rewards", async () => {
      // Arrange
      const input: CreateRewardInput = {
        ...createValidInput(),
        creatorRole: UserRole.ADMIN,
      };

      // Act
      const result = await runUseCase(input, true, false);

      // Assert
      expect(result.name).toBe("Test Reward");
    });

    it("should allow moderator users to create rewards", async () => {
      // Arrange
      const input: CreateRewardInput = {
        ...createValidInput(),
        creatorRole: UserRole.MODERATOR,
      };

      // Act
      const result = await runUseCase(input, true, false);

      // Assert
      expect(result.name).toBe("Test Reward");
    });
  });
});
