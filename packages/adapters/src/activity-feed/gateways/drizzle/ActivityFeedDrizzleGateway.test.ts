/**
 * ActivityFeedDrizzleGateway Tests
 */

import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Either } from "effect";
import { InMemoryActivityFeedGateway } from "../in-memory/InMemoryActivityFeedGateway";
import {
  type ActivityFeed,
  ActivityFeedIdFactory,
  TripId,
  DatabaseError,
} from "@mirai-app/domain";

const createTestFeed = (
  id: string,
  overrides?: Partial<ActivityFeed>,
): ActivityFeed => {
  return {
    id: ActivityFeedIdFactory.unsafeCreate(id),
    tripId: TripId.unsafeCreate("trip-default"),
    title: overrides?.title ?? "Test Feed",
    description: overrides?.description ?? "A test feed",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  } as ActivityFeed;
};

describe("[UNIT] InMemoryActivityFeedGateway", () => {
  let gateway: InMemoryActivityFeedGateway;

  beforeEach(() => {
    gateway = new InMemoryActivityFeedGateway();
  });

  describe("findById", () => {
    it("should return null when feed not found", async () => {
      const effect = gateway.findById(
        ActivityFeedIdFactory.unsafeCreate("nonexistent"),
      );
      const either = await Effect.runPromise(Effect.either(effect));
      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) expect(either.right).toBeNull();
    });

    it("should return feed when found", async () => {
      const feed = createTestFeed("feed-123");
      await Effect.runPromise(gateway.create(feed));

      const effect = gateway.findById(feed.id);
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either) && either.right) {
        expect(either.right.id).toEqual(feed.id);
      }
    });
  });

  describe("Either pattern", () => {
    it("should use Effect.either with Either.isLeft/isRight and instanceof", async () => {
      const feed = createTestFeed("pattern-feed");
      const effect = gateway.create(feed);

      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);
      expect(Either.isLeft(either)).toBe(false);

      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(DatabaseError);
      }
    });
  });
});
