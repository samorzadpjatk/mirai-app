import { describe, it, expect } from "bun:test";
import {
  updateMyPurchaseStatusUseCase,
  type UpdateMyPurchaseStatusInput,
} from "./UpdateMyPurchaseStatus";
import { Effect, Either } from "effect";
import {
  RewardRepositoryTag,
  RewardPurchaseRepositoryTag,
  GroupCoinsServiceTag,
  TripAccessCheckerTag,
} from "../ports/RewardRepository";
import { RewardPurchaseStatus, RewardId } from "@mirai-app/domain";
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
    status: RewardPurchaseStatus.BOUGHT,
    collectionMethod: null,
    purchasedById: "user-123",
    statusUpdatedById: null,
    purchasedAt: new Date("2024-01-01"),
    statusUpdatedAt: new Date("2024-01-01"),
    ...overrides,
  }) as RewardPurchase;

// Create mock repository services
const createMockRewardRepo = () => ({
  create: () => Effect.promise(() => Promise.resolve({} as any)),
  findById: () => Effect.promise(() => Promise.resolve(null)),
  findByTripId: () =>
    Effect.promise(() =>
      Promise.resolve({
        items: [],
        total: 0,
        limit: 10,
        offset: 0,
        hasMore: false,
      }),
    ),
  findVisibleByTripId: () =>
    Effect.promise(() =>
      Promise.resolve({
        items: [],
        total: 0,
        limit: 10,
        offset: 0,
        hasMore: false,
      }),
    ),
  update: () => Effect.promise(() => Promise.resolve({} as any)),
  delete: () => Effect.promise(() => Promise.resolve()),
  hasPurchases: () => Effect.promise(() => Promise.resolve(false)),
  getPurchaseCount: () => Effect.promise(() => Promise.resolve(0)),
  decrementQuantity: () => Effect.promise(() => Promise.resolve({} as any)),
  incrementQuantity: () => Effect.promise(() => Promise.resolve({} as any)),
});

const createMockPurchaseRepo = (overrides?: {
  findById?: (id: string) => Promise<RewardPurchase | null>;
  updateStatus?: (
    id: string,
    status: RewardPurchaseStatus,
    updatedById: string,
    collectionMethod: null,
  ) => Promise<RewardPurchase>;
}) => ({
  create: () => Effect.promise(() => Promise.resolve(createMockPurchase())),
  findById: (id: string) =>
    Effect.promise(() =>
      overrides?.findById
        ? overrides.findById(id)
        : Promise.resolve(createMockPurchase()),
    ),
  findByRewardId: () =>
    Effect.promise(() =>
      Promise.resolve({
        items: [],
        total: 0,
        limit: 10,
        offset: 0,
        hasMore: false,
      }),
    ),
  findByGroupId: () =>
    Effect.promise(() =>
      Promise.resolve({
        items: [],
        total: 0,
        limit: 10,
        offset: 0,
        hasMore: false,
      }),
    ),
  findByTripId: () =>
    Effect.promise(() =>
      Promise.resolve({
        items: [],
        total: 0,
        limit: 10,
        offset: 0,
        hasMore: false,
      }),
    ),
  updateStatus: (
    id: string,
    status: RewardPurchaseStatus,
    updatedById: string,
    collectionMethod: null,
  ) =>
    Effect.promise(() =>
      overrides?.updateStatus
        ? overrides.updateStatus(id, status, updatedById, collectionMethod)
        : Promise.resolve(
            createMockPurchase({
              status,
              statusUpdatedAt: new Date("2024-01-02"),
            }),
          ),
    ),
  countByRewardId: () => Effect.promise(() => Promise.resolve(0)),
});

const createMockCoinsService = () => ({
  getBalance: () => Effect.promise(() => Promise.resolve(500)),
  deductCoins: () => Effect.promise(() => Promise.resolve()),
  addCoins: () => Effect.promise(() => Promise.resolve()),
});

const createMockAccessChecker = (overrides?: {
  isGroupLeader?: () => Promise<{ isLeader: boolean; groupId: string }>;
}) => ({
  isGroupLeader: () =>
    Effect.promise(() =>
      overrides?.isGroupLeader
        ? overrides.isGroupLeader()
        : Promise.resolve({ isLeader: true, groupId: "group-123" }),
    ),
  isStaff: () => Effect.promise(() => Promise.resolve(false)),
  hasTripEnded: () => Effect.promise(() => Promise.resolve(false)),
});

// Helper to run use case with services
const runUseCase = async (
  input: UpdateMyPurchaseStatusInput,
  overrides?: {
    purchaseRepo?: Parameters<typeof createMockPurchaseRepo>[0];
    accessChecker?: Parameters<typeof createMockAccessChecker>[0];
  },
) => {
  const program = updateMyPurchaseStatusUseCase(input).pipe(
    Effect.provideService(RewardRepositoryTag, createMockRewardRepo()),
    Effect.provideService(
      RewardPurchaseRepositoryTag,
      createMockPurchaseRepo(overrides?.purchaseRepo),
    ),
    Effect.provideService(GroupCoinsServiceTag, createMockCoinsService()),
    Effect.provideService(
      TripAccessCheckerTag,
      createMockAccessChecker(overrides?.accessChecker),
    ),
  );
  return await Effect.runPromise(program);
};

describe("[UNIT] updateMyPurchaseStatusUseCase (Effect)", () => {
  describe("execute", () => {
    it("should cancel purchase with refund when transitioning from BOUGHT to CANCELLED", async () => {
      const input: UpdateMyPurchaseStatusInput = {
        purchaseId: "purchase-123",
        newStatus: RewardPurchaseStatus.CANCELLED,
        updatedById: "user-123",
      };

      const result = await runUseCase(input, {
        purchaseRepo: {
          findById: () => Promise.resolve(createMockPurchase()),
          updateStatus: () =>
            Promise.resolve(
              createMockPurchase({ status: RewardPurchaseStatus.CANCELLED }),
            ),
        },
      });

      expect(result.status).toBe(RewardPurchaseStatus.CANCELLED);
      expect(result.refunded).toBe(true);
    });

    it("should transition from ACCEPTED to IN_DELIVERY", async () => {
      const input: UpdateMyPurchaseStatusInput = {
        purchaseId: "purchase-123",
        newStatus: RewardPurchaseStatus.IN_DELIVERY,
        updatedById: "user-123",
      };

      const result = await runUseCase(input, {
        purchaseRepo: {
          findById: () =>
            Promise.resolve(
              createMockPurchase({ status: RewardPurchaseStatus.ACCEPTED }),
            ),
          updateStatus: () =>
            Promise.resolve(
              createMockPurchase({ status: RewardPurchaseStatus.IN_DELIVERY }),
            ),
        },
      });

      expect(result.status).toBe(RewardPurchaseStatus.IN_DELIVERY);
      expect(result.refunded).toBe(false);
    });
  });
});
