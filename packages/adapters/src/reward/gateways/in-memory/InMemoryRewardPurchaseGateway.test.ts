/**
 * InMemoryRewardPurchaseGateway Tests
 */

import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Either } from "effect";
import { InMemoryRewardPurchaseGateway } from "./InMemoryRewardPurchaseGateway";
import {
  RewardPurchase,
  RewardPurchaseId,
  RewardId,
  GroupId,
  UserId,
  DatabaseError,
} from "@mirai-app/domain";

// Test data factory using RewardPurchase.create factory method
const createTestPurchase = async (
  id: string,
  overrides?: Partial<{
    status: "BOUGHT" | "ACCEPTED" | "IN_DELIVERY" | "CANCELLED" | "DELIVERED";
    rewardId?: RewardId;
  }>,
): Promise<RewardPurchase> => {
  const effect = RewardPurchase.create({
    id: RewardPurchaseId.unsafeCreate(id),
    rewardId: overrides?.rewardId ?? RewardId.unsafeCreate("reward-default"),
    groupId: GroupId.unsafeCreate("group-default"),
    quantity: 1,
    totalCost: 100,
    status: overrides?.status ?? "BOUGHT",
    purchasedById: UserId.unsafeCreate("user-default"),
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  });
  return await Effect.runPromise(effect);
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
      const purchase = await createTestPurchase("purchase-123");
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
      const purchase1 = await createTestPurchase("p1", { rewardId });
      const purchase2 = await createTestPurchase("p2", { rewardId });

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
      const purchase = await createTestPurchase("new-purchase");
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
      const purchase = await createTestPurchase("pattern-purchase");
      const effect = gateway.create(purchase);

      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);

      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(DatabaseError);
      }
    });
  });
});
