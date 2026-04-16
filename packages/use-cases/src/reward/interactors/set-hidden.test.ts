import { describe, it, expect, beforeEach } from "bun:test";
import {
  setRewardHiddenUseCase,
  type SetRewardHiddenInput,
} from "./set-hidden";
import { Effect, Either } from "effect";
import { RewardGatewayTag } from "../ports/gateway";
import type { Reward, RewardId } from "@mirai-app/domain";

// Mock Reward domain object
const createMockReward = (overrides?: Partial<Reward>): Reward =>
  ({
    id: "reward-123",
    name: "Test Reward",
    isHidden: false,
    updatedAt: new Date("2024-01-01"),
    hide: function () {
      return { ...this, isHidden: true, updatedAt: new Date("2024-01-02") };
    },
    unhide: function () {
      return { ...this, isHidden: false, updatedAt: new Date("2024-01-02") };
    },
    ...overrides,
  }) as unknown as Reward;

// Create mock repository service
const createMockRepoService = (overrides?: {
  findById?: (id: RewardId) => Promise<Reward | null>;
  update?: (reward: Reward) => Promise<Reward>;
}) => ({
  create: () => Effect.promise(() => Promise.resolve({} as Reward)),
  findById: (id: RewardId) =>
    Effect.promise(() =>
      overrides?.findById
        ? overrides.findById(id)
        : Promise.resolve(createMockReward()),
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
  update: (reward: Reward) =>
    Effect.promise(() =>
      overrides?.update ? overrides.update(reward) : Promise.resolve(reward),
    ),
  delete: () => Effect.promise(() => Promise.resolve()),
  hasPurchases: () => Effect.promise(() => Promise.resolve(false)),
  getPurchaseCount: () => Effect.promise(() => Promise.resolve(0)),
  decrementQuantity: () => Effect.promise(() => Promise.resolve({} as any)),
  incrementQuantity: () => Effect.promise(() => Promise.resolve({} as any)),
});

// Helper to run use case with repository service
const runUseCase = async (
  input: SetRewardHiddenInput,
  repoOverrides?: {
    findById?: (id: RewardId) => Promise<Reward | null>;
    update?: (reward: Reward) => Promise<Reward>;
  },
) => {
  const program = setRewardHiddenUseCase(input).pipe(
    Effect.provideService(
      RewardGatewayTag,
      createMockRepoService(repoOverrides),
    ),
  );
  return await Effect.runPromise(program);
};

describe("[UNIT] setRewardHiddenUseCase (Effect)", () => {
  describe("[UNIT] execute", () => {
    it("should hide a reward", async () => {
      const input: SetRewardHiddenInput = {
        rewardId: "reward-123" as RewardId,
        isHidden: true,
      };

      const result = await runUseCase(input);

      expect(result.id).toBe("reward-123");
      expect(result.name).toBe("Test Reward");
      expect(result.isHidden).toBe(true);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it("should unhide a reward", async () => {
      const hiddenReward = createMockReward({ isHidden: true });

      const input: SetRewardHiddenInput = {
        rewardId: "reward-123" as RewardId,
        isHidden: false,
      };

      const result = await runUseCase(input, {
        findById: () => Promise.resolve(hiddenReward),
      });

      expect(result.isHidden).toBe(false);
    });

    it("should return updatedAt timestamp", async () => {
      const updatedReward = createMockReward({
        updatedAt: new Date("2024-06-15"),
      });

      const input: SetRewardHiddenInput = {
        rewardId: "reward-123" as RewardId,
        isHidden: true,
      };

      const result = await runUseCase(input, {
        update: () => Promise.resolve(updatedReward),
      });

      expect(result.updatedAt).toEqual(new Date("2024-06-15"));
    });
  });
});
