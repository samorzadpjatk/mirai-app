/**
 * RewardDrizzleGateway Tests
 */

import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Either } from "effect";
import { InMemoryRewardGateway } from "../in-memory/InMemoryRewardGateway";
import { Reward, RewardId, TripId, DatabaseError } from "@mirai-app/domain";

const createTestReward = (id: string, overrides?: Partial<Reward>): Reward => {
  return {
    id: RewardId.unsafeCreate(id),
    tripId: TripId.unsafeCreate("trip-default"),
    name: overrides?.name ?? "Test Reward",
    description: overrides?.description ?? "A test reward",
    imageUrl: overrides?.imageUrl ?? null,
    coinCost: overrides?.coinCost ?? 100,
    quantity: overrides?.quantity ?? 10,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  } as Reward;
};

describe("[UNIT] InMemoryRewardGateway", () => {
  let gateway: InMemoryRewardGateway;

  beforeEach(() => {
    gateway = new InMemoryRewardGateway();
  });

  describe("findById", () => {
    it("should return null when reward not found", async () => {
      const effect = gateway.findById(RewardId.unsafeCreate("nonexistent"));
      const either = await Effect.runPromise(Effect.either(effect));
      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) expect(either.right).toBeNull();
    });

    it("should return reward when found", async () => {
      const reward = createTestReward("reward-123");
      await Effect.runPromise(gateway.create(reward));

      const effect = gateway.findById(reward.id);
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either) && either.right) {
        expect(either.right.id).toEqual(reward.id);
      }
    });
  });

  describe("findByTripId", () => {
    it("should return rewards for trip", async () => {
      const tripId = TripId.unsafeCreate("trip-abc");
      const reward1 = { ...createTestReward("r1"), tripId };
      const reward2 = { ...createTestReward("r2"), tripId };

      await Effect.runPromise(gateway.create(reward1));
      await Effect.runPromise(gateway.create(reward2));

      const effect = gateway.findByTripId(tripId);
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right).toHaveLength(2);
      }
    });
  });

  describe("create", () => {
    it("should create and return reward with Either pattern", async () => {
      const reward = createTestReward("new-reward");
      const effect = gateway.create(reward);

      const either = await Effect.runPromise(Effect.either(effect));
      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right.id).toEqual(reward.id);
      }
    });
  });

  describe("Either pattern", () => {
    it("should use Effect.either with instanceof for type safety", async () => {
      const reward = createTestReward("pattern-reward");
      const effect = gateway.create(reward);

      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);

      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(DatabaseError);
      }
    });
  });
});
