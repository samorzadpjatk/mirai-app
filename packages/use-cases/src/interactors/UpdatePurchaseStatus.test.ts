import { describe, it, expect, mock } from "bun:test";
import {
  UpdatePurchaseStatusUseCase,
  type UpdatePurchaseStatusInput,
} from "./UpdatePurchaseStatus";
import { RewardPurchaseStatus, RewardId } from "@mirai-app/domain";
import type {
  RewardRepository,
  RewardPurchaseRepository,
  GroupCoinsService,
  TripAccessChecker,
} from "../ports/RewardRepository";

describe("[UNIT] UpdatePurchaseStatusUseCase", () => {
  const createMockPurchase = (
    overrides?: Partial<{
      id: string;
      status: RewardPurchaseStatus;
      groupId: string;
      collectionMethod: string | null;
    }>,
  ): any => ({
    id: overrides?.id ?? "purchase-123",
    rewardId: "reward-123",
    groupId: overrides?.groupId ?? "group-123",
    quantity: 2,
    totalCost: 200,
    status: overrides?.status ?? "BOUGHT",
    collectionMethod: overrides?.collectionMethod ?? null,
    statusUpdatedById: null,
    statusUpdatedAt: new Date(),
    purchasedAt: new Date(),
  });

  const createMockRewardRepo = (
    overrides?: Partial<RewardRepository>,
  ): RewardRepository => ({
    create: mock(() => Promise.resolve({} as any)),
    findById: mock(() => Promise.resolve(null)),
    findByTripId: mock(() =>
      Promise.resolve({
        items: [],
        total: 0,
        limit: 10,
        offset: 0,
        hasMore: false,
      }),
    ),
    findVisibleByTripId: mock(() =>
      Promise.resolve({
        items: [],
        total: 0,
        limit: 10,
        offset: 0,
        hasMore: false,
      }),
    ),
    update: mock(() => Promise.resolve({} as any)),
    delete: mock(() => Promise.resolve()),
    hasPurchases: mock(() => Promise.resolve(false)),
    getPurchaseCount: mock(() => Promise.resolve(0)),
    decrementQuantity: mock(() => Promise.resolve({} as any)),
    incrementQuantity: mock(() => Promise.resolve({} as any)),
    ...overrides,
  });

  const createMockPurchaseRepo = (
    overrides?: Partial<RewardPurchaseRepository>,
  ): RewardPurchaseRepository => ({
    create: mock(() => Promise.resolve(createMockPurchase())),
    findById: mock(() => Promise.resolve(null)),
    findByRewardId: mock(() =>
      Promise.resolve({
        items: [],
        total: 0,
        limit: 10,
        offset: 0,
        hasMore: false,
      }),
    ),
    findByGroupId: mock(() =>
      Promise.resolve({
        items: [],
        total: 0,
        limit: 10,
        offset: 0,
        hasMore: false,
      }),
    ),
    findByTripId: mock(() =>
      Promise.resolve({
        items: [],
        total: 0,
        limit: 10,
        offset: 0,
        hasMore: false,
      }),
    ),
    updateStatus: mock((id, status, updatedById, collectionMethod) =>
      Promise.resolve(
        createMockPurchase({
          id,
          status,
          statusUpdatedById: updatedById,
          collectionMethod,
        }),
      ),
    ),
    countByRewardId: mock(() => Promise.resolve(0)),
    ...overrides,
  });

  const createMockCoinsService = (
    overrides?: Partial<GroupCoinsService>,
  ): GroupCoinsService => ({
    getBalance: mock(() => Promise.resolve(500)),
    deductCoins: mock(() => Promise.resolve()),
    addCoins: mock(() => Promise.resolve()),
    ...overrides,
  });

  const createMockAccessChecker = (
    overrides?: Partial<TripAccessChecker>,
  ): TripAccessChecker => ({
    isGroupLeader: mock(() => Promise.resolve({ isLeader: false })),
    isStaff: mock(() => Promise.resolve(false)),
    hasTripEnded: mock(() => Promise.resolve(false)),
    ...overrides,
  });

  describe("execute", () => {
    it("should update purchase status for staff user", async () => {
      const mockPurchase = createMockPurchase({ id: "purchase-456" });
      const purchaseRepo = createMockPurchaseRepo({
        findById: mock(() => Promise.resolve(mockPurchase)),
      });
      const accessChecker = createMockAccessChecker({
        isStaff: mock(() => Promise.resolve(true)),
      });

      const useCase = new UpdatePurchaseStatusUseCase(
        createMockRewardRepo(),
        purchaseRepo,
        createMockCoinsService(),
        accessChecker,
      );

      const input: UpdatePurchaseStatusInput = {
        purchaseId: "purchase-456",
        newStatus: "ACCEPTED",
        updatedById: "staff-123",
        collectionMethod: "In-person pickup",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.purchaseId).toBe("purchase-456");
        expect(result.value.status).toBe("ACCEPTED");
        expect(result.value.collectionMethod).toBe("In-person pickup");
      }
    });

    it("should return error when purchase not found", async () => {
      const purchaseRepo = createMockPurchaseRepo({
        findById: mock(() => Promise.resolve(null)),
      });

      const useCase = new UpdatePurchaseStatusUseCase(
        createMockRewardRepo(),
        purchaseRepo,
        createMockCoinsService(),
        createMockAccessChecker(),
      );

      const input: UpdatePurchaseStatusInput = {
        purchaseId: "non-existent",
        newStatus: "ACCEPTED",
        updatedById: "staff-123",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBe("Purchase not found");
      }
    });

    it("should return error for unauthorized user", async () => {
      const mockPurchase = createMockPurchase({
        id: "purchase-789",
        groupId: "group-a",
      });
      const purchaseRepo = createMockPurchaseRepo({
        findById: mock(() => Promise.resolve(mockPurchase)),
      });
      const accessChecker = createMockAccessChecker({
        isStaff: mock(() => Promise.resolve(false)),
        isGroupLeader: mock(() =>
          Promise.resolve({ isLeader: true, groupId: "group-b" }),
        ),
      });

      const useCase = new UpdatePurchaseStatusUseCase(
        createMockRewardRepo(),
        purchaseRepo,
        createMockCoinsService(),
        accessChecker,
      );

      const input: UpdatePurchaseStatusInput = {
        purchaseId: "purchase-789",
        newStatus: "ACCEPTED",
        updatedById: "leader-wrong-group",
        collectionMethod: "Pickup",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBe("Not authorized to update this purchase");
      }
    });

    it("should return error for invalid status transition", async () => {
      const mockPurchase = createMockPurchase({
        id: "purchase-999",
        status: "DELIVERED",
      });
      const purchaseRepo = createMockPurchaseRepo({
        findById: mock(() => Promise.resolve(mockPurchase)),
      });
      const accessChecker = createMockAccessChecker({
        isStaff: mock(() => Promise.resolve(true)),
      });

      const useCase = new UpdatePurchaseStatusUseCase(
        createMockRewardRepo(),
        purchaseRepo,
        createMockCoinsService(),
        accessChecker,
      );

      const input: UpdatePurchaseStatusInput = {
        purchaseId: "purchase-999",
        newStatus: "BOUGHT",
        updatedById: "staff-123",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("Cannot change status");
      }
    });

    it("should return error when collection method missing for ACCEPTED", async () => {
      const mockPurchase = createMockPurchase({
        id: "purchase-no-method",
        collectionMethod: null,
      });
      const purchaseRepo = createMockPurchaseRepo({
        findById: mock(() => Promise.resolve(mockPurchase)),
      });
      const accessChecker = createMockAccessChecker({
        isStaff: mock(() => Promise.resolve(true)),
      });

      const useCase = new UpdatePurchaseStatusUseCase(
        createMockRewardRepo(),
        purchaseRepo,
        createMockCoinsService(),
        accessChecker,
      );

      const input: UpdatePurchaseStatusInput = {
        purchaseId: "purchase-no-method",
        newStatus: "ACCEPTED",
        updatedById: "staff-123",
        // collectionMethod is missing
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBe(
          "Collection method is required when accepting a purchase",
        );
      }
    });
  });
});
