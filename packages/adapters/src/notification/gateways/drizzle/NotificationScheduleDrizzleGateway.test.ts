/**
 * NotificationScheduleDrizzleGateway Tests
 *
 * Tests using Either pattern with Effect.either, Either.isLeft/isRight, and instanceof.
 */

import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Either } from "effect";
import { InMemoryNotificationScheduleGateway } from "../in-memory/InMemoryNotificationScheduleGateway";
import { NotificationSchedule, NotificationScheduleId, TripId, DatabaseError } from "@mirai-app/domain";

const createTestNotificationSchedule = (id: string): NotificationSchedule => {
  return {
    id: NotificationScheduleId.unsafeCreate(id),
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  } as NotificationSchedule;
};

describe("[UNIT] InMemoryNotificationScheduleGateway", () => {
  let gateway: InMemoryNotificationScheduleGateway;

  beforeEach(() => {
    gateway = new InMemoryNotificationScheduleGateway();
  });

  describe("findById", () => {
    it("should return null when NotificationSchedule not found", async () => {
      const effect = gateway.findById(NotificationScheduleId.unsafeCreate("nonexistent"));
      const either = await Effect.runPromise(Effect.either(effect));
      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) expect(either.right).toBeNull();
    });

    it("should return NotificationSchedule when found", async () => {
      const item = createTestNotificationSchedule("item-123");
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
      const item = createTestNotificationSchedule("new-item");
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
      const item = createTestNotificationSchedule("pattern-item");
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
