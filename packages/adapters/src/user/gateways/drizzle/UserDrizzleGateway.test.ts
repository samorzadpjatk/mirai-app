/**
 * UserDrizzleGateway Tests
 *
 * Tests for the Drizzle ORM implementation of IUserPort.
 * Uses Either pattern with Effect.either, Either.isLeft/isRight, and instanceof
 * for type-safe error verification.
 *
 * ## Test Tagging
 *
 * - [UNIT]: In-memory gateway tests with no external dependencies
 * - [INTEGRATION]: Drizzle gateway tests with real database
 */

import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Either } from "effect";
import { InMemoryUserGateway } from "../in-memory/InMemoryUserGateway";
import { User, UserId, AuthUserId, DatabaseError } from "@mirai-app/domain";

// Test data factory - creates User entities using the factory method
const createTestUser = (
  id: string,
  overrides?: Partial<{
    firstName: string;
    lastName: string;
    hasAvatar: boolean;
    role: string;
  }>,
): User => {
  const userId = UserId.unsafeCreate(id);
  const authUserId = AuthUserId.unsafeCreate(`auth-${id}`);

  const effect = User.create({
    id: userId,
    authUserId,
    firstName: overrides?.firstName ?? "Test",
    lastName: overrides?.lastName ?? "User",
    hasAvatar: overrides?.hasAvatar ?? false,
    role: (overrides?.role ?? "USER") as
      | "USER"
      | "ADMIN"
      | "MODERATOR"
      | "SERVICE",
    lastSeenOn: null,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  });

  return Effect.runSync(effect);
};

describe("[UNIT] InMemoryUserGateway", () => {
  let gateway: InMemoryUserGateway;

  beforeEach(() => {
    gateway = new InMemoryUserGateway();
  });

  describe("findById", () => {
    it("should return null when user not found", async () => {
      const userId = UserId.unsafeCreate("nonexistent-id");
      const effect = gateway.findById(userId);

      const either = await Effect.runPromise(Effect.either(effect));
      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right).toBeNull();
      }
    });

    it("should return user when found", async () => {
      const user = createTestUser("user-123");
      await Effect.runPromise(gateway.create(user));

      const effect = gateway.findById(user.id);
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right).not.toBeNull();
        if (either.right) {
          expect(either.right.id).toEqual(user.id);
          expect(either.right.firstName).toBe("Test");
        }
      }
    });
  });

  describe("findByAuthUserId", () => {
    it("should return null when auth user not found", async () => {
      const effect = gateway.findByAuthUserId("nonexistent-auth-id");

      const either = await Effect.runPromise(Effect.either(effect));
      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right).toBeNull();
      }
    });

    it("should return user by auth ID when found", async () => {
      const user = createTestUser("user-456");
      await Effect.runPromise(gateway.create(user));

      const effect = gateway.findByAuthUserId(
        AuthUserId.toString(user.authUserId),
      );
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right).not.toBeNull();
        if (either.right) {
          expect(either.right.id).toEqual(user.id);
        }
      }
    });
  });

  describe("findByTripId", () => {
    it("should return empty array when no users for trip", async () => {
      const effect = gateway.findByTripId("trip-123");

      const either = await Effect.runPromise(Effect.either(effect));
      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right).toEqual([]);
      }
    });

    it("should return users associated with trip", async () => {
      const user1 = createTestUser("user-1", { firstName: "Alice" });
      const user2 = createTestUser("user-2", { firstName: "Bob" });

      await Effect.runPromise(gateway.create(user1));
      await Effect.runPromise(gateway.create(user2));
      gateway.associateWithTrip(UserId.toString(user1.id), "trip-abc");
      gateway.associateWithTrip(UserId.toString(user2.id), "trip-abc");

      const effect = gateway.findByTripId("trip-abc");
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right).toHaveLength(2);
        expect(either.right.map((u) => u.firstName).sort()).toEqual([
          "Alice",
          "Bob",
        ]);
      }
    });
  });

  describe("findAllPaginated", () => {
    it("should return paginated users", async () => {
      const user1 = createTestUser("user-1");
      const user2 = createTestUser("user-2");
      const user3 = createTestUser("user-3");

      await Effect.runPromise(gateway.create(user1));
      await Effect.runPromise(gateway.create(user2));
      await Effect.runPromise(gateway.create(user3));

      const effect = gateway.findAllPaginated({ limit: 2, offset: 0 });
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right).toHaveLength(2);
      }
    });

    it("should respect offset parameter", async () => {
      const user1 = createTestUser("user-1");
      const user2 = createTestUser("user-2");

      await Effect.runPromise(gateway.create(user1));
      await Effect.runPromise(gateway.create(user2));

      const effect = gateway.findAllPaginated({ limit: 10, offset: 1 });
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right).toHaveLength(1);
      }
    });
  });

  describe("search", () => {
    it("should return empty result when no users for trip", async () => {
      const effect = gateway.search({
        tripId: "trip-empty",
        field: "name",
        limit: 10,
        offset: 0,
      });

      const either = await Effect.runPromise(Effect.either(effect));
      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right.users).toEqual([]);
        expect(either.right.total).toBe(0);
        expect(either.right.hasMore).toBe(false);
      }
    });

    it("should search users by name", async () => {
      const user1 = createTestUser("user-1", {
        firstName: "Alice",
        lastName: "Smith",
      });
      const user2 = createTestUser("user-2", {
        firstName: "Bob",
        lastName: "Jones",
      });

      await Effect.runPromise(gateway.create(user1));
      await Effect.runPromise(gateway.create(user2));
      gateway.associateWithTrip("user-1", "trip-search");
      gateway.associateWithTrip("user-2", "trip-search");

      const effect = gateway.search({
        tripId: "trip-search",
        field: "name",
        searchTerm: "Alice",
        limit: 10,
        offset: 0,
      });

      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right.users).toHaveLength(1);
        if (either.right.users[0]) {
          expect(either.right.users[0].firstName).toBe("Alice");
        }
        expect(either.right.total).toBe(1);
      }
    });
  });

  describe("create", () => {
    it("should create and return user", async () => {
      const user = createTestUser("new-user");
      const effect = gateway.create(user);

      const either = await Effect.runPromise(Effect.either(effect));
      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right.id).toEqual(user.id);
      }

      // Verify it was stored
      const found = await Effect.runPromise(gateway.findById(user.id));
      expect(found).not.toBeNull();
    });
  });

  describe("update", () => {
    it("should update existing user", async () => {
      const user = createTestUser("update-user", { firstName: "Original" });
      await Effect.runPromise(gateway.create(user));

      // Create updated version using withProfile method
      const updatedEffect = user.withProfile({ firstName: "Updated" });
      const updated = await Effect.runPromise(updatedEffect);

      const effect = gateway.update(updated);
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right.firstName).toBe("Updated");
      }

      // Verify update persisted
      const found = await Effect.runPromise(gateway.findById(user.id));
      expect(found?.firstName).toBe("Updated");
    });
  });

  describe("delete", () => {
    it("should delete user", async () => {
      const user = createTestUser("delete-user");
      await Effect.runPromise(gateway.create(user));

      // Verify exists
      let found = await Effect.runPromise(gateway.findById(user.id));
      expect(found).not.toBeNull();

      const effect = gateway.delete(user.id);
      const either = await Effect.runPromise(Effect.either(effect));
      expect(Either.isRight(either)).toBe(true);

      // Verify deleted
      found = await Effect.runPromise(gateway.findById(user.id));
      expect(found).toBeNull();
    });
  });

  describe("exists", () => {
    it("should return false for non-existent user", async () => {
      const userId = UserId.unsafeCreate("nonexistent");
      const effect = gateway.exists(userId);

      const either = await Effect.runPromise(Effect.either(effect));
      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right).toBe(false);
      }
    });

    it("should return true for existing user", async () => {
      const user = createTestUser("existing-user");
      await Effect.runPromise(gateway.create(user));

      const effect = gateway.exists(user.id);
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right).toBe(true);
      }
    });
  });

  describe("count", () => {
    it("should return zero for empty gateway", async () => {
      const effect = gateway.count();
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right).toBe(0);
      }
    });

    it("should return correct count", async () => {
      await Effect.runPromise(gateway.create(createTestUser("c1")));
      await Effect.runPromise(gateway.create(createTestUser("c2")));
      await Effect.runPromise(gateway.create(createTestUser("c3")));

      const effect = gateway.count();
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right).toBe(3);
      }
    });
  });

  describe("Error handling with Either pattern", () => {
    it("should demonstrate Either.isLeft for error cases", async () => {
      // This test demonstrates the Either.isLeft pattern
      // In in-memory gateway, errors are rare, but this shows the pattern

      const user = createTestUser("error-test");
      const effect = gateway.create(user);

      // For success cases, isRight is true
      const either = await Effect.runPromise(Effect.either(effect));

      // Use Either.isRight for success checking
      expect(Either.isRight(either)).toBe(true);

      // Use Either.isLeft for error checking
      expect(Either.isLeft(either)).toBe(false);

      // Use instanceof for type verification when needed
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(DatabaseError);
      }
    });

    it("should use Either.match for handling both cases", async () => {
      const user = createTestUser("match-test");
      const effect = gateway.create(user);

      const message = await Effect.runPromise(
        Effect.gen(function* () {
          const result = yield* Effect.either(effect);
          return Either.match(result, {
            onLeft: (error) => `Error: ${(error as { _tag: string })._tag}`,
            onRight: (u) => `Success: ${UserId.toString(u.id)}`,
          });
        }),
      );

      expect(message).toMatch(/^Success:/);
    });
  });
});
