/**
 * GroupDrizzleGateway Tests
 *
 * Tests for the Drizzle ORM implementation of IGroupPort.
 * Uses Either pattern with Effect.either, Either.isLeft/isRight, and instanceof.
 */

import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Either } from "effect";
import { InMemoryGroupGateway } from "../in-memory/InMemoryGroupGateway";
import {
  Group,
  GroupId,
  TripId,
  UserId,
  DatabaseError,
} from "@mirai-app/domain";

// Test data factory
const createTestGroup = (
  id: string,
  overrides?: Partial<{
    name: string;
    description: string;
    isPrivate: boolean;
  }>,
): Group => {
  return {
    id: GroupId.unsafeCreate(id),
    tripId: TripId.unsafeCreate("trip-default"),
    name: overrides?.name ?? "Test Group",
    description: overrides?.description ?? "A test group",
    isPrivate: overrides?.isPrivate ?? false,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  } as Group;
};

describe("[UNIT] InMemoryGroupGateway", () => {
  let gateway: InMemoryGroupGateway;

  beforeEach(() => {
    gateway = new InMemoryGroupGateway();
  });

  describe("findById", () => {
    it("should return null when group not found", async () => {
      const groupId = GroupId.unsafeCreate("nonexistent-id");
      const effect = gateway.findById(groupId);

      const either = await Effect.runPromise(Effect.either(effect));
      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right).toBeNull();
      }
    });

    it("should return group when found", async () => {
      const group = createTestGroup("group-123");
      await Effect.runPromise(gateway.create(group));

      const effect = gateway.findById(group.id);
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either) && either.right) {
        expect(either.right.id).toEqual(group.id);
        expect(either.right.name).toBe("Test Group");
      }
    });
  });

  describe("findByTripId", () => {
    it("should return empty array when no groups for trip", async () => {
      const effect = gateway.findByTripId(TripId.unsafeCreate("trip-empty"));

      const either = await Effect.runPromise(Effect.either(effect));
      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right).toEqual([]);
      }
    });

    it("should return groups for trip", async () => {
      const tripId = TripId.unsafeCreate("trip-abc");
      const group1 = { ...createTestGroup("g1"), tripId };
      const group2 = { ...createTestGroup("g2"), tripId };

      await Effect.runPromise(gateway.create(group1));
      await Effect.runPromise(gateway.create(group2));

      const effect = gateway.findByTripId(tripId);
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right).toHaveLength(2);
      }
    });
  });

  describe("create", () => {
    it("should create and return group", async () => {
      const group = createTestGroup("new-group");
      const effect = gateway.create(group);

      const either = await Effect.runPromise(Effect.either(effect));
      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right.id).toEqual(group.id);
      }

      // Verify it was stored
      const found = await Effect.runPromise(gateway.findById(group.id));
      expect(found).not.toBeNull();
    });
  });

  describe("update", () => {
    it("should update existing group", async () => {
      const group = createTestGroup("update-group", { name: "Original" });
      await Effect.runPromise(gateway.create(group));

      const updated = { ...group, name: "Updated" };
      const effect = gateway.update(updated);

      const either = await Effect.runPromise(Effect.either(effect));
      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right.name).toBe("Updated");
      }

      // Verify update persisted
      const found = await Effect.runPromise(gateway.findById(group.id));
      expect(found?.name).toBe("Updated");
    });
  });

  describe("delete", () => {
    it("should delete group", async () => {
      const group = createTestGroup("delete-group");
      await Effect.runPromise(gateway.create(group));

      // Verify exists
      let found = await Effect.runPromise(gateway.findById(group.id));
      expect(found).not.toBeNull();

      const effect = gateway.delete(group.id);
      const either = await Effect.runPromise(Effect.either(effect));
      expect(Either.isRight(either)).toBe(true);

      // Verify deleted
      found = await Effect.runPromise(gateway.findById(group.id));
      expect(found).toBeNull();
    });
  });

  describe("exists", () => {
    it("should return false for non-existent group", async () => {
      const groupId = GroupId.unsafeCreate("nonexistent");
      const effect = gateway.exists(groupId);

      const either = await Effect.runPromise(Effect.either(effect));
      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right).toBe(false);
      }
    });

    it("should return true for existing group", async () => {
      const group = createTestGroup("existing-group");
      await Effect.runPromise(gateway.create(group));

      const effect = gateway.exists(group.id);
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right).toBe(true);
      }
    });
  });

  describe("Error handling with Either pattern", () => {
    it("should use Either.isLeft/isRight for error checking", async () => {
      const group = createTestGroup("either-test");
      const effect = gateway.create(group);

      const either = await Effect.runPromise(Effect.either(effect));

      // For in-memory success case
      expect(Either.isRight(either)).toBe(true);
      expect(Either.isLeft(either)).toBe(false);

      // Use instanceof for type verification when needed
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(DatabaseError);
      }
    });
  });
});
