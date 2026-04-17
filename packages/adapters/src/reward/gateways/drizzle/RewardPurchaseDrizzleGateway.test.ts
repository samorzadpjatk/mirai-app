/**
 * RewardPurchaseDrizzleGateway Tests
 */

import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Either } from "effect";
import { InMemoryRewardPurchaseGateway } from "../in-memory/InMemoryRewardPurchaseGateway";
import {
  RewardPurchase,
  RewardPurchaseId,
  RewardId,
  UserId,
  DatabaseError,
} from "@mirai-app/domain";

const createTestPurchase = (
  id: string,
  overrides?: Partial<RewardPurchase>,
): RewardPurchase => {
  return {
    id: RewardPurchaseId.unsafeCreate(id),
    rewardId: RewardId.unsafeCreate("reward-default"),
    userId: UserId.unsafeCreate("user-default"),
    coinCost: overrides?.coinCost ?? 100,
    purchasedAt: new Date("2024-01-01"),
    status: overrides?.status ?? "pending",
  } as RewardPurchase;
};

describe("[UNIT] InMemoryRewardPurchaseGateway", () => {
  let gateway: InMemoryRewardPurchaseGateway;

  beforeEach(() => {
    gateway = new InMemoryRewardPurchaseGateway();
  });

  describe("findById", () => {
    it("should return null when purchase not found", async () => {
      const effect = gateway.findById(
        RewardPurchaseId.unsafeCreate("nonexistent"),
      );
      const either = await Effect.runPromise(Effect.either(effect));
      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) expect(either.right).toBeNull();
    });

    it("should return purchase when found", async () => {
      const purchase = createTestPurchase("purchase-123");
      await Effect.runPromise(gateway.create(purchase));

      const effect = gateway.findById(purchase.id);
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either) && either.right) {
        expect(either.right.id).toEqual(purchase.id);
      }
    });
  });

  describe("findByRewardId", () => {
    it("should return purchases for reward", async () => {
      const rewardId = RewardId.unsafeCreate("reward-abc");
      const purchase1 = { ...createTestPurchase("p1"), rewardId };
      const purchase2 = { ...createTestPurchase("p2"), rewardId };

      await Effect.runPromise(gateway.create(purchase1));
      await Effect.runPromise(gateway.create(purchase2));

      const effect = gateway.findByRewardId(rewardId);
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right).toHaveLength(2);
      }
    });
  });

  describe("create", () => {
    it("should create and return purchase with Either pattern", async () => {
      const purchase = createTestPurchase("new-purchase");
      const effect = gateway.create(purchase);

      const either = await Effect.runPromise(Effect.either(effect));
      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right.id).toEqual(purchase.id);
      }

      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(DatabaseError);
      }
    });
  });

  describe("Either pattern", () => {
    it("should use Either.isLeft/isRight with instanceof", async () => {
      const purchase = createTestPurchase("pattern-purchase");
      const effect = gateway.create(purchase);

      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);

      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(DatabaseError);
      }
    });
  });
});
