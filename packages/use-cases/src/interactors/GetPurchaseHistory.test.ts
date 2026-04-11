import { describe, it, expect, mock, beforeEach } from "bun:test";
import {
  GetPurchaseHistoryUseCase,
  type GetPurchaseHistoryInput,
} from "./GetPurchaseHistory";
import type {
  RewardPurchaseRepository,
  TripAccessChecker,
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

describe("[UNIT] GetPurchaseHistoryUseCase", () => {
  let useCase: GetPurchaseHistoryUseCase;
  let mockPurchaseRepository: RewardPurchaseRepository;
  let mockAccessChecker: TripAccessChecker;

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
    } as unknown as RewardPurchaseRepository;

    mockAccessChecker = {
      isGroupLeader: mock(() =>
        Promise.resolve({ isLeader: true, groupId: "group-123" }),
      ),
    } as unknown as TripAccessChecker;

    useCase = new GetPurchaseHistoryUseCase(
      mockPurchaseRepository,
      mockAccessChecker,
    );
  });

  describe("execute", () => {
    it("should return empty history when no purchases", async () => {
      const input: GetPurchaseHistoryInput = {
        tripId: "trip-123",
        userId: "user-123",
        isStaff: true,
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.items).toEqual([]);
        expect(result.value.total).toBe(0);
      }
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

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.items).toHaveLength(2);
        expect(result.value.total).toBe(2);
      }
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

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(mockPurchaseRepository.findByTripId).toHaveBeenCalledWith(
          "trip-123",
          expect.objectContaining({ groupId: "group-456" }),
        );
      }
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

      const result = await useCase.execute(input);

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("Only trip participants with a group");
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

      await useCase.execute(input);

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

      await useCase.execute(input);

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

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        const item = result.value.items[0];
        expect(item.purchaseId).toBe("purchase-123");
        expect(item.rewardId).toBe("reward-456");
        expect(item.groupId).toBe("group-789");
        expect(item.quantity).toBe(5);
        expect(item.totalCost).toBe(250);
        expect(item.status).toBe("ACCEPTED");
        expect(item.collectionMethod).toBe("pickup");
        expect(item.purchasedById).toBe("user-456");
        expect(item.statusUpdatedById).toBe("admin-123");
        expect(item.purchasedAt).toBeInstanceOf(Date);
        expect(item.statusUpdatedAt).toBeInstanceOf(Date);
      }
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

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.items[0].statusUpdatedById).toBeNull();
      }
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

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.total).toBe(100);
        expect(result.value.limit).toBe(20);
        expect(result.value.offset).toBe(40);
        expect(result.value.hasMore).toBe(true);
      }
    });

    it("should call isGroupLeader with userId and tripId", async () => {
      const input: GetPurchaseHistoryInput = {
        tripId: "trip-456",
        userId: "user-789",
        isStaff: false,
      };

      await useCase.execute(input);

      expect(mockAccessChecker.isGroupLeader).toHaveBeenCalledWith(
        "user-789",
        "trip-456",
      );
    });
  });
});
