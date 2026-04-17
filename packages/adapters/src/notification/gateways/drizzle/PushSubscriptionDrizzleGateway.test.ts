/**
 * PushSubscriptionDrizzleGateway Tests
 *
 * Tests using Either pattern with Effect.either, Either.isLeft/isRight, and instanceof.
 */

import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Either } from "effect";
import { InMemoryPushSubscriptionGateway } from "../in-memory/InMemoryPushSubscriptionGateway";
import { PushSubscription, PushSubscriptionId, UserId, DatabaseError } from "@mirai-app/domain";

const createTestPushSubscription = (id: string): PushSubscription => {
  return {
    id: PushSubscriptionId.unsafeCreate(id),
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  } as PushSubscription;
};

describe("[UNIT] InMemoryPushSubscriptionGateway", () => {
  let gateway: InMemoryPushSubscriptionGateway;

  beforeEach(() => {
    gateway = new InMemoryPushSubscriptionGateway();
  });

  describe("findById", () => {
    it("should return null when PushSubscription not found", async () => {
      const effect = gateway.findById(PushSubscriptionId.unsafeCreate("nonexistent"));
      const either = await Effect.runPromise(Effect.either(effect));
      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) expect(either.right).toBeNull();
    });

    it("should return PushSubscription when found", async () => {
      const item = createTestPushSubscription("item-123");
      await Effect.runPromise(gateway.create(item));

      const effect = gateway.findById(item.id);
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either) && either.right) {
        expect(either.right.id).toEqual(item.id);
      }
    });
  });

  describe("create", () => {
    it("should create with Either pattern", async () => {
      const item = createTestPushSubscription("new-item");
      const effect = gateway.create(item);

      const either = await Effect.runPromise(Effect.either(effect));
      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right.id).toEqual(item.id);
      }
    });
  });

  describe("Either pattern", () => {
    it("should use Effect.either with Either.isLeft/isRight and instanceof", async () => {
      const item = createTestPushSubscription("pattern-item");
      const effect = gateway.create(item);

      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);
      expect(Either.isLeft(either)).toBe(false);

      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(DatabaseError);
      }
    });
  });
});
