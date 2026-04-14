import { describe, it, expect } from "bun:test";
import {
  updatePurchaseStatusUseCase,
  type UpdatePurchaseStatusInput,
} from "./UpdatePurchaseStatus";
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
    totalCost: 200,
    status: "BOUGHT" as RewardPurchaseStatus,
    collectionMethod: null,
    statusUpdatedById: null,
    statusUpdatedAt: new Date(),
    purchasedAt: new Date(),
    ...overrides,
  }) as RewardPurchase;

// Create mock repository services
const createMockRewardRepo = (overrides?: {
  incrementQuantity?: (
    rewardId: ReturnType<typeof RewardId.unsafeCreate>,
    quantity: number,
  ) => Promise<unknown>;
}) => ({
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
  incrementQuantity: (
    rewardId: ReturnType<typeof RewardId.unsafeCreate>,
    quantity: number,
  ) =>
    Effect.promise(() =>
      overrides?.incrementQuantity
        ? overrides.incrementQuantity(rewardId, quantity)
        : Promise.resolve({} as any),
    ),
});

const createMockPurchaseRepo = (overrides?: {
  findById?: (id: string) => Promise<RewardPurchase | null>;
  updateStatus?: (
    id: string,
    status: RewardPurchaseStatus,
    updatedById: string,
    collectionMethod: string | null | undefined,
  ) => Promise<RewardPurchase>;
}) => ({
  create: () => Effect.promise(() => Promise.resolve(createMockPurchase())),
  findById: (id: string) =>
    Effect.promise(() =>
      overrides?.findById ? overrides.findById(id) : Promise.resolve(null),
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
    collectionMethod: string | null | undefined,
  ) =>
    Effect.promise(() =>
      overrides?.updateStatus
        ? overrides.updateStatus(id, status, updatedById, collectionMethod)
        : Promise.resolve(
            createMockPurchase({
              id,
              status,
              statusUpdatedById: updatedById,
              collectionMethod,
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
  isStaff?: () => Promise<boolean>;
  isGroupLeader?: () => Promise<{ isLeader: boolean; groupId: string }>;
}) => ({
  isGroupLeader: () =>
    Effect.promise(() =>
      overrides?.isGroupLeader
        ? overrides.isGroupLeader()
        : Promise.resolve({ isLeader: false, groupId: "group-b" }),
    ),
  isStaff: () =>
    Effect.promise(() =>
      overrides?.isStaff ? overrides.isStaff() : Promise.resolve(false),
    ),
  hasTripEnded: () => Effect.promise(() => Promise.resolve(false)),
});

// Helper to run use case with services
const runUseCase = async (
  input: UpdatePurchaseStatusInput,
  overrides?: {
    rewardRepo?: Parameters<typeof createMockRewardRepo>[0];
    purchaseRepo?: Parameters<typeof createMockPurchaseRepo>[0];
    coinsService?: Parameters<typeof createMockCoinsService>[0];
    accessChecker?: Parameters<typeof createMockAccessChecker>[0];
  },
) => {
  const program = updatePurchaseStatusUseCase(input).pipe(
    Effect.provideService(
      RewardRepositoryTag,
      createMockRewardRepo(overrides?.rewardRepo),
    ),
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

describe("[UNIT] updatePurchaseStatusUseCase (Effect)", () => {
  describe("[UNIT] execute", () => {
    it("should update purchase status for staff user", async () => {
      const mockPurchase = createMockPurchase({ id: "purchase-456" });

      const input: UpdatePurchaseStatusInput = {
        purchaseId: "purchase-456",
        newStatus: "ACCEPTED" as RewardPurchaseStatus,
        updatedById: "staff-123",
        collectionMethod: "In-person pickup",
      };

      const result = await runUseCase(input, {
        purchaseRepo: {
          findById: () => Promise.resolve(mockPurchase),
          updateStatus: (id, status, updatedById, collectionMethod) =>
            Promise.resolve(
              createMockPurchase({
                id,
                status,
                statusUpdatedById: updatedById,
                collectionMethod,
              }),
            ),
        },
        accessChecker: {
          isStaff: () => Promise.resolve(true),
          isGroupLeader: () =>
            Promise.resolve({ isLeader: false, groupId: "group-b" }),
        },
      });

      expect(result.purchaseId).toBe("purchase-456");
      expect(result.status).toBe("ACCEPTED");
      expect(result.collectionMethod).toBe("In-person pickup");
    });
  });
});
