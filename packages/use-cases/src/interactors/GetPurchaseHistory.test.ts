import { describe, it, expect, mock, beforeEach } from "bun:test";
import { Effect, Either } from "effect";
import {
  getPurchaseHistoryUseCase,
  type GetPurchaseHistoryInput,
  NoGroupAccessError,
} from "./GetPurchaseHistory";
import {
  RewardPurchaseRepositoryTag,
  TripAccessCheckerTag,
  type PaginatedResult,
} from "../ports/RewardRepository";
import type { RewardPurchase } from "@mirai-app/domain";

// Mock RewardPurchase domain object
const createMockPurchase = (
  overrides?: Partial<RewardPurchase>,
): RewardPurchase =>
  ({
    id: "purchase-123",
    rewardId: "reward-123",
    groupId: "group-123",
    quantity: 2,
    totalCost: 100,
    status: "BOUGHT",
    collectionMethod: null,
    purchasedById: "user-123",
    statusUpdatedById: null,
    purchasedAt: new Date("2024-01-01"),
    statusUpdatedAt: new Date("2024-01-01"),
    ...overrides,
  }) as RewardPurchase;

// Helper to build use case program with mocked services
const buildGetPurchaseHistoryProgram = (
  input: GetPurchaseHistoryInput,
  deps: {
    mockPurchaseRepository: {
      findByTripId: (
        tripId: string,
        options?: { groupId?: string },
      ) => Promise<PaginatedResult<RewardPurchase>>;
    };
    mockAccessChecker: {
      isGroupLeader: (
        userId: string,
        tripId: string,
      ) => Promise<{
        isLeader: boolean;
        groupId?: string;
        groupName?: string;
        coins?: number;
      }>;
    };
  },
) => {
  return getPurchaseHistoryUseCase(input).pipe(
    Effect.provideService(RewardPurchaseRepositoryTag, {
      create: (purchase: RewardPurchase) =>
        Effect.promise(() => Promise.resolve(purchase)),
      findById: (id: string) =>
        Effect.promise(() => Promise.resolve(null as RewardPurchase | null)),
      findByRewardId: (rewardId: string, options?) =>
        Effect.promise(() =>
          Promise.resolve({
            items: [],
            total: 0,
            limit: 20,
            offset: 0,
            hasMore: false,
          }),
        ),
      findByGroupId: (groupId: string, options?) =>
        Effect.promise(() =>
          Promise.resolve({
            items: [],
            total: 0,
            limit: 20,
            offset: 0,
            hasMore: false,
          }),
        ),
      findByTripId: (tripId: string, options?) =>
        Effect.promise(() =>
          deps.mockPurchaseRepository.findByTripId(tripId, options),
        ),
      updateStatus: (
        id: string,
        status: string,
        updatedById: string,
        collectionMethod?,
      ) => Effect.promise(() => Promise.resolve({} as RewardPurchase)),
      countByRewardId: (rewardId: string) =>
        Effect.promise(() => Promise.resolve(0)),
    }),
    Effect.provideService(TripAccessCheckerTag, {
      isGroupLeader: (userId: string, tripId: string) =>
        Effect.promise(() =>
          deps.mockAccessChecker.isGroupLeader(userId, tripId),
        ),
      isStaff: (userId: string) => Effect.promise(() => Promise.resolve(false)),
      hasTripEnded: (tripId: string) =>
        Effect.promise(() => Promise.resolve(false)),
    }),
  );
};

// Helper to run use case with Effect
const runGetPurchaseHistoryUseCase = async (
  input: GetPurchaseHistoryInput,
  deps: {
    mockPurchaseRepository: {
      findByTripId: (
        tripId: string,
        options?: { groupId?: string },
      ) => Promise<PaginatedResult<RewardPurchase>>;
    };
    mockAccessChecker: {
      isGroupLeader: (
        userId: string,
        tripId: string,
      ) => Promise<{
        isLeader: boolean;
        groupId?: string;
        groupName?: string;
        coins?: number;
      }>;
    };
  },
) => {
  const program = buildGetPurchaseHistoryProgram(input, deps);
  return await Effect.runPromise(program);
};

describe("[UNIT] getPurchaseHistoryUseCase (Effect)", () => {
  let mockPurchaseRepository: {
    findByTripId: ReturnType<typeof mock>;
  };
  let mockAccessChecker: {
    isGroupLeader: ReturnType<typeof mock>;
  };

  beforeEach(() => {
    mockPurchaseRepository = {
      findByTripId: mock(() =>
        Promise.resolve({
          items: [],
          total: 0,
          limit: 20,
          offset: 0,
          hasMore: false,
        }),
      ),
    };

    mockAccessChecker = {
      isGroupLeader: mock(() =>
        Promise.resolve({ isLeader: true, groupId: "group-123" }),
      ),
    };
  });

  describe("[UNIT] execute", () => {
    it("should return empty history when no purchases", async () => {
      const input: GetPurchaseHistoryInput = {
        tripId: "trip-123",
        userId: "user-123",
        isStaff: true,
      };

      const result = await runGetPurchaseHistoryUseCase(input, {
        mockPurchaseRepository,
        mockAccessChecker,
      });

      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });

    it("should return all purchases for staff", async () => {
      const mockPurchases = [
        createMockPurchase({ id: "purchase-1" }),
        createMockPurchase({ id: "purchase-2" }),
      ];

      mockPurchaseRepository.findByTripId = mock(() =>
        Promise.resolve({
          items: mockPurchases,
          total: 2,
          limit: 20,
          offset: 0,
          hasMore: false,
        }),
      );

      const input: GetPurchaseHistoryInput = {
        tripId: "trip-123",
        userId: "user-123",
        isStaff: true,
      };

      const result = await runGetPurchaseHistoryUseCase(input, {
        mockPurchaseRepository,
        mockAccessChecker,
      });

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it("should filter by group for non-staff users", async () => {
      mockAccessChecker.isGroupLeader = mock(() =>
        Promise.resolve({ isLeader: true, groupId: "group-456" }),
      );

      mockPurchaseRepository.findByTripId = mock(() =>
        Promise.resolve({
          items: [createMockPurchase({ groupId: "group-456" })],
          total: 1,
          limit: 20,
          offset: 0,
          hasMore: false,
        }),
      );

      const input: GetPurchaseHistoryInput = {
        tripId: "trip-123",
        userId: "user-123",
        isStaff: false,
      };

      const result = await runGetPurchaseHistoryUseCase(input, {
        mockPurchaseRepository,
        mockAccessChecker,
      });

      expect(mockPurchaseRepository.findByTripId).toHaveBeenCalledWith(
        "trip-123",
        expect.objectContaining({ groupId: "group-456" }),
      );
    });

    it("should return error if user has no group", async () => {
      mockAccessChecker.isGroupLeader = mock(() =>
        Promise.resolve({ isLeader: false }),
      );

      const input: GetPurchaseHistoryInput = {
        tripId: "trip-123",
        userId: "user-123",
        isStaff: false,
      };

      // Act - use Either to properly check error type
      const program = buildGetPurchaseHistoryProgram(input, {
        mockPurchaseRepository,
        mockAccessChecker,
      });
      const either = await Effect.runPromise(Effect.either(program));

      // Assert
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(NoGroupAccessError);
      }
    });

    it("should apply group filter when provided by staff", async () => {
      mockPurchaseRepository.findByTripId = mock(() =>
        Promise.resolve({
          items: [createMockPurchase({ groupId: "group-filter" })],
          total: 1,
          limit: 20,
          offset: 0,
          hasMore: false,
        }),
      );

      const input: GetPurchaseHistoryInput = {
        tripId: "trip-123",
        userId: "user-123",
        isStaff: true,
        groupId: "group-filter",
      };

      await runGetPurchaseHistoryUseCase(input, {
        mockPurchaseRepository,
        mockAccessChecker,
      });

      expect(mockPurchaseRepository.findByTripId).toHaveBeenCalledWith(
        "trip-123",
        expect.objectContaining({ groupId: "group-filter" }),
      );
    });

    it("should pass pagination options to repository", async () => {
      const input: GetPurchaseHistoryInput = {
        tripId: "trip-123",
        userId: "user-123",
        isStaff: true,
        pagination: { limit: 10, offset: 20 },
      };

      await runGetPurchaseHistoryUseCase(input, {
        mockPurchaseRepository,
        mockAccessChecker,
      });

      expect(mockPurchaseRepository.findByTripId).toHaveBeenCalledWith(
        "trip-123",
        expect.objectContaining({ limit: 10, offset: 20 }),
      );
    });

    it("should map purchase fields correctly", async () => {
      const mockPurchase = createMockPurchase({
        id: "purchase-123",
        rewardId: "reward-456",
        groupId: "group-789",
        quantity: 5,
        totalCost: 250,
        status: "ACCEPTED",
        collectionMethod: "pickup",
        purchasedById: "user-456",
        statusUpdatedById: "admin-123",
        purchasedAt: new Date("2024-01-15"),
        statusUpdatedAt: new Date("2024-01-16"),
      });

      mockPurchaseRepository.findByTripId = mock(() =>
        Promise.resolve({
          items: [mockPurchase],
          total: 1,
          limit: 20,
          offset: 0,
          hasMore: false,
        }),
      );

      const input: GetPurchaseHistoryInput = {
        tripId: "trip-123",
        userId: "user-123",
        isStaff: true,
      };

      const result = await runGetPurchaseHistoryUseCase(input, {
        mockPurchaseRepository,
        mockAccessChecker,
      });

      const item = result.items[0];
      expect(item?.purchaseId).toBe("purchase-123");
      expect(item?.rewardId).toBe("reward-456");
      expect(item?.groupId).toBe("group-789");
      expect(item?.quantity).toBe(5);
      expect(item?.totalCost).toBe(250);
      expect(item?.status).toBe("ACCEPTED");
      expect(item?.collectionMethod).toBe("pickup");
      expect(item?.purchasedById).toBe("user-456");
      expect(item?.statusUpdatedById).toBe("admin-123");
      expect(item?.purchasedAt).toBeInstanceOf(Date);
      expect(item?.statusUpdatedAt).toBeInstanceOf(Date);
    });

    it("should handle purchases with null statusUpdatedById", async () => {
      const mockPurchase = createMockPurchase({
        statusUpdatedById: null,
      });

      mockPurchaseRepository.findByTripId = mock(() =>
        Promise.resolve({
          items: [mockPurchase],
          total: 1,
          limit: 20,
          offset: 0,
          hasMore: false,
        }),
      );

      const input: GetPurchaseHistoryInput = {
        tripId: "trip-123",
        userId: "user-123",
        isStaff: true,
      };

      const result = await runGetPurchaseHistoryUseCase(input, {
        mockPurchaseRepository,
        mockAccessChecker,
      });

      expect(result.items[0]?.statusUpdatedById).toBeNull();
    });

    it("should return pagination info", async () => {
      mockPurchaseRepository.findByTripId = mock(() =>
        Promise.resolve({
          items: [],
          total: 100,
          limit: 20,
          offset: 40,
          hasMore: true,
        }),
      );

      const input: GetPurchaseHistoryInput = {
        tripId: "trip-123",
        userId: "user-123",
        isStaff: true,
      };

      const result = await runGetPurchaseHistoryUseCase(input, {
        mockPurchaseRepository,
        mockAccessChecker,
      });

      expect(result.total).toBe(100);
      expect(result.limit).toBe(20);
      expect(result.offset).toBe(40);
      expect(result.hasMore).toBe(true);
    });

    it("should call isGroupLeader with userId and tripId", async () => {
      const input: GetPurchaseHistoryInput = {
        tripId: "trip-456",
        userId: "user-789",
        isStaff: false,
      };

      await runGetPurchaseHistoryUseCase(input, {
        mockPurchaseRepository,
        mockAccessChecker,
      });

      expect(mockAccessChecker.isGroupLeader).toHaveBeenCalledWith(
        "user-789",
        "trip-456",
      );
    });
  });
});
