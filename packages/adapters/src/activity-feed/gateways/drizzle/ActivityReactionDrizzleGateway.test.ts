/**
 * ActivityReactionDrizzleGateway Tests
 */

import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Either } from "effect";
import { InMemoryActivityReactionGateway } from "../in-memory/InMemoryActivityReactionGateway";
import {
  ActivityReaction,
  ActivityReactionId,
  ActivityFeedItemId,
  UserId,
  DatabaseError,
} from "@mirai-app/domain";

const createTestReaction = (
  id: string,
  overrides?: Partial<ActivityReaction>,
): ActivityReaction => {
  return {
    id: ActivityReactionId.unsafeCreate(id),
    activityItemId: ActivityFeedItemId.unsafeCreate("item-default"),
    userId: UserId.unsafeCreate("user-default"),
    type: overrides?.type ?? "like",
    createdAt: new Date("2024-01-01"),
  } as ActivityReaction;
};

describe("[UNIT] InMemoryActivityReactionGateway", () => {
  let gateway: InMemoryActivityReactionGateway;

  beforeEach(() => {
    gateway = new InMemoryActivityReactionGateway();
  });

  describe("findById", () => {
    it("should return null when reaction not found", async () => {
      const effect = gateway.findById(
        ActivityReactionId.unsafeCreate("nonexistent"),
      );
      const either = await Effect.runPromise(Effect.either(effect));
      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) expect(either.right).toBeNull();
    });

    it("should return reaction when found", async () => {
      const reaction = createTestReaction("reaction-123");
      await Effect.runPromise(gateway.create(reaction));

      const effect = gateway.findById(reaction.id);
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either) && either.right) {
        expect(either.right.id).toEqual(reaction.id);
      }
    });
  });

  describe("Either pattern", () => {
    it("should use Effect.either with instanceof for type safety", async () => {
      const reaction = createTestReaction("pattern-reaction");
      const effect = gateway.create(reaction);

      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);

      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(DatabaseError);
      }
    });
  });
});
