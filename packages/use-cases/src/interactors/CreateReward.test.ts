import { describe, it, expect, mock } from "bun:test";
import { CreateRewardUseCase, type CreateRewardInput } from "./CreateReward";
import { Reward, UserRole, type Result } from "@repo/domain";
import type {
  RewardRepository,
  TripAccessChecker,
} from "../ports/RewardRepository";

// Helper to unwrap Result
const unwrap = <T, E>(
  result: { kind: "ok"; value: T } | { kind: "err"; error: E },
): T => {
  if (result.kind === "err") {
    throw new Error(`Unexpected error: ${result.error}`);
  }
  return result.value;
};

// Helper to create a valid reward
const createValidReward = (): Reward => {
  const result = Reward.create({
    name: "Test Reward",
    description: "A test reward",
    availableQuantity: 10,
    coinCostPercentage: 15,
    tripId: "trip-123",
    createdById: "user-123",
  });
  return unwrap(result);
};

describe("[UNIT] CreateRewardUseCase", () => {
  describe("execute", () => {
    it("should create reward with valid input", async () => {
      const mockReward = createValidReward();
      const mockRepo: RewardRepository = {
        create: mock(() => Promise.resolve(mockReward)),
        findById: mock(() => Promise.resolve(null)),
        findByTripId: mock(() =>
          Promise.resolve({
            items: [],
            total: 0,
            limit: 30,
            offset: 0,
            hasMore: false,
          }),
        ),
        findVisibleByTripId: mock(() =>
          Promise.resolve({
            items: [],
            total: 0,
            limit: 30,
            offset: 0,
            hasMore: false,
          }),
        ),
        update: mock(() => Promise.resolve(mockReward)),
        delete: mock(() => Promise.resolve()),
        hasPurchases: mock(() => Promise.resolve(false)),
        getPurchaseCount: mock(() => Promise.resolve(0)),
        decrementQuantity: mock(() => Promise.resolve(mockReward)),
        incrementQuantity: mock(() => Promise.resolve(mockReward)),
      };
      const mockAccessChecker: TripAccessChecker = {
        isStaff: mock(() => Promise.resolve(true)),
        isGroupLeader: mock(() =>
          Promise.resolve({ isLeader: true, groupId: "group-123" }),
        ),
        hasTripEnded: mock(() => Promise.resolve(false)),
      };

      const useCase = new CreateRewardUseCase(mockRepo, mockAccessChecker);
      const input: CreateRewardInput = {
        name: "Test Reward",
        description: "A test reward",
        availableQuantity: 10,
        coinCostPercentage: 15,
        tripId: "trip-123",
        createdById: "user-123",
        creatorRole: UserRole.MODERATOR,
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.name).toBe("Test Reward");
        expect(result.value.description).toBe("A test reward");
        expect(result.value.availableQuantity).toBe(10);
        expect(result.value.coinCostPercentage).toBe(15);
        expect(result.value.tripId).toBe("trip-123");
        expect(result.value.createdById).toBe("user-123");
        expect(result.value.isInStock).toBe(true);
      }
      expect(mockRepo.create).toHaveBeenCalled();
    });

    it("should reject non-staff users", async () => {
      const mockReward = createValidReward();
      const mockRepo: RewardRepository = {
        create: mock(() => Promise.resolve(mockReward)),
        findById: mock(() => Promise.resolve(null)),
        findByTripId: mock(() =>
          Promise.resolve({
            items: [],
            total: 0,
            limit: 30,
            offset: 0,
            hasMore: false,
          }),
        ),
        findVisibleByTripId: mock(() =>
          Promise.resolve({
            items: [],
            total: 0,
            limit: 30,
            offset: 0,
            hasMore: false,
          }),
        ),
        update: mock(() => Promise.resolve(mockReward)),
        delete: mock(() => Promise.resolve()),
        hasPurchases: mock(() => Promise.resolve(false)),
        getPurchaseCount: mock(() => Promise.resolve(0)),
        decrementQuantity: mock(() => Promise.resolve(mockReward)),
        incrementQuantity: mock(() => Promise.resolve(mockReward)),
      };
      const mockAccessChecker: TripAccessChecker = {
        isStaff: mock(() => Promise.resolve(false)),
        isGroupLeader: mock(() => Promise.resolve({ isLeader: false })),
        hasTripEnded: mock(() => Promise.resolve(false)),
      };

      const useCase = new CreateRewardUseCase(mockRepo, mockAccessChecker);
      const input: CreateRewardInput = {
        name: "Test Reward",
        description: "A test reward",
        availableQuantity: 10,
        coinCostPercentage: 15,
        tripId: "trip-123",
        createdById: "user-123",
        creatorRole: UserRole.USER,
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("moderators");
      }
      expect(mockRepo.create).not.toHaveBeenCalled();
    });

    it("should reject creation for ended trips", async () => {
      const mockReward = createValidReward();
      const mockRepo: RewardRepository = {
        create: mock(() => Promise.resolve(mockReward)),
        findById: mock(() => Promise.resolve(null)),
        findByTripId: mock(() =>
          Promise.resolve({
            items: [],
            total: 0,
            limit: 30,
            offset: 0,
            hasMore: false,
          }),
        ),
        findVisibleByTripId: mock(() =>
          Promise.resolve({
            items: [],
            total: 0,
            limit: 30,
            offset: 0,
            hasMore: false,
          }),
        ),
        update: mock(() => Promise.resolve(mockReward)),
        delete: mock(() => Promise.resolve()),
        hasPurchases: mock(() => Promise.resolve(false)),
        getPurchaseCount: mock(() => Promise.resolve(0)),
        decrementQuantity: mock(() => Promise.resolve(mockReward)),
        incrementQuantity: mock(() => Promise.resolve(mockReward)),
      };
      const mockAccessChecker: TripAccessChecker = {
        isStaff: mock(() => Promise.resolve(true)),
        isGroupLeader: mock(() =>
          Promise.resolve({ isLeader: true, groupId: "group-123" }),
        ),
        hasTripEnded: mock(() => Promise.resolve(true)),
      };

      const useCase = new CreateRewardUseCase(mockRepo, mockAccessChecker);
      const input: CreateRewardInput = {
        name: "Test Reward",
        description: "A test reward",
        availableQuantity: 10,
        coinCostPercentage: 15,
        tripId: "trip-123",
        createdById: "user-123",
        creatorRole: UserRole.ADMIN,
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("ended");
      }
    });

    it("should return error when domain validation fails", async () => {
      const mockReward = createValidReward();
      const mockRepo: RewardRepository = {
        create: mock(() => Promise.resolve(mockReward)),
        findById: mock(() => Promise.resolve(null)),
        findByTripId: mock(() =>
          Promise.resolve({
            items: [],
            total: 0,
            limit: 30,
            offset: 0,
            hasMore: false,
          }),
        ),
        findVisibleByTripId: mock(() =>
          Promise.resolve({
            items: [],
            total: 0,
            limit: 30,
            offset: 0,
            hasMore: false,
          }),
        ),
        update: mock(() => Promise.resolve(mockReward)),
        delete: mock(() => Promise.resolve()),
        hasPurchases: mock(() => Promise.resolve(false)),
        getPurchaseCount: mock(() => Promise.resolve(0)),
        decrementQuantity: mock(() => Promise.resolve(mockReward)),
        incrementQuantity: mock(() => Promise.resolve(mockReward)),
      };
      const mockAccessChecker: TripAccessChecker = {
        isStaff: mock(() => Promise.resolve(true)),
        isGroupLeader: mock(() =>
          Promise.resolve({ isLeader: true, groupId: "group-123" }),
        ),
        hasTripEnded: mock(() => Promise.resolve(false)),
      };

      const useCase = new CreateRewardUseCase(mockRepo, mockAccessChecker);
      const input: CreateRewardInput = {
        name: "", // Invalid - empty name
        description: "A test reward",
        availableQuantity: 10,
        coinCostPercentage: 15,
        tripId: "trip-123",
        createdById: "user-123",
        creatorRole: UserRole.MODERATOR,
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("Name");
      }
    });
  });
});
