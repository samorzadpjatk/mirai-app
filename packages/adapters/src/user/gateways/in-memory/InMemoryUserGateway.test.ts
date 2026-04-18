/**
 * InMemoryUserGateway Tests
 *
 * Tests for the in-memory implementation of IUserPort.
 * Uses AuthContext pattern with Effect.gen and Layer.provide for auth dependencies.
 *
 * ## Test Tagging
 *
 * - [UNIT]: In-memory gateway tests with no external dependencies
 * - [INTEGRATION]: Drizzle gateway tests with real database
 */

import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Either, Layer, type Layer as LayerType } from "effect";
import { InMemoryUserGateway } from "./InMemoryUserGateway";
import { User, UserId, AuthUserId, DatabaseError } from "@mirai-app/domain";
import { AuthContextTag, type AuthContext } from "../../../infrastructure/effect";
import { AuthZPortTag } from "@mirai-app/use-cases";
import type { IAuthZPort } from "@mirai-app/domain";

// ============================================================================
// Mock AuthContext Helper
// ============================================================================

/**
 * Creates a mock AuthContext for testing
 *
 * @param overrides - Optional overrides for AuthContext properties
 * @returns AuthContext with test data
 */
const createMockAuthContext = (overrides?: Partial<AuthContext>): AuthContext => ({
  userId: overrides?.userId ?? "user-test",
  role: overrides?.role ?? "USER",
  tripRoles: overrides?.tripRoles ?? {},
  isAuthenticated: overrides?.isAuthenticated ?? true,
  accessToken: overrides?.accessToken ?? "mock-access-token",
});

/**
 * Creates a mock IAuthZPort that always allows access
 */
const createMockAuthZPort = (): IAuthZPort => ({
  verifyAccess: () => Effect.succeed(void 0),
  checkRolePermission: () => Effect.succeed(true),
});

/**
 * Creates a test layer with mocked AuthContext and AuthZPort
 */
const getTestLayer = (authContext?: AuthContext) =>
  Layer.mergeAll(
    Layer.succeed(AuthContextTag, authContext ?? createMockAuthContext()),
    Layer.succeed(AuthZPortTag, createMockAuthZPort()),
  );

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
      const effect = gateway.findById(userId).pipe(Effect.provide(getTestLayer()));

      const result = await Effect.runPromise(effect);
      expect(result).toBeNull();
    });

    it("should return user when found", async () => {
      const user = createTestUser("user-123");
      await Effect.runPromise(gateway.create(user).pipe(Effect.provide(getTestLayer())));

      const effect = gateway.findById(user.id).pipe(Effect.provide(getTestLayer()));
      const result = await Effect.runPromise(effect);

      expect(result).not.toBeNull();
      expect(result?.id).toEqual(user.id);
      expect(result?.firstName).toBe("Test");
    });
  });

  describe("findByAuthUserId", () => {
    it("should return null when auth user not found", async () => {
      const effect = gateway.findByAuthUserId("nonexistent-auth-id").pipe(Effect.provide(getTestLayer()));

      const result = await Effect.runPromise(effect);
      expect(result).toBeNull();
    });

    it("should return user by auth ID when found", async () => {
      const user = createTestUser("user-456");
      await Effect.runPromise(gateway.create(user).pipe(Effect.provide(getTestLayer())));

      const effect = gateway.findByAuthUserId(
        AuthUserId.toString(user.authUserId),
      ).pipe(Effect.provide(getTestLayer()));
      const result = await Effect.runPromise(effect);

      expect(result).not.toBeNull();
      expect(result?.id).toEqual(user.id);
    });
  });

  describe("findByTripId", () => {
    it("should return empty array when no users for trip", async () => {
      const effect = gateway.findByTripId("trip-123").pipe(Effect.provide(getTestLayer()));

      const result = await Effect.runPromise(effect);
      expect(result).toEqual([]);
    });

    it("should return users associated with trip", async () => {
      const user1 = createTestUser("user-1", { firstName: "Alice" });
      const user2 = createTestUser("user-2", { firstName: "Bob" });

      await Effect.runPromise(gateway.create(user1).pipe(Effect.provide(getTestLayer())));
      await Effect.runPromise(gateway.create(user2).pipe(Effect.provide(getTestLayer())));
      gateway.associateWithTrip(UserId.toString(user1.id), "trip-abc");
      gateway.associateWithTrip(UserId.toString(user2.id), "trip-abc");

      const effect = gateway.findByTripId("trip-abc").pipe(Effect.provide(getTestLayer()));
      const result = await Effect.runPromise(effect);

      expect(result).toHaveLength(2);
      expect(result.map((u) => u.firstName).sort()).toEqual([
        "Alice",
        "Bob",
      ]);
    });
  });

  describe("findAllPaginated", () => {
    it("should return paginated users", async () => {
      const user1 = createTestUser("user-1");
      const user2 = createTestUser("user-2");
      const user3 = createTestUser("user-3");

      await Effect.runPromise(gateway.create(user1).pipe(Effect.provide(getTestLayer())));
      await Effect.runPromise(gateway.create(user2).pipe(Effect.provide(getTestLayer())));
      await Effect.runPromise(gateway.create(user3).pipe(Effect.provide(getTestLayer())));

      const effect = gateway.findAllPaginated({ limit: 2, offset: 0 }).pipe(Effect.provide(getTestLayer()));
      const result = await Effect.runPromise(effect);

      expect(result).toHaveLength(2);
    });

    it("should respect offset parameter", async () => {
      const user1 = createTestUser("user-1");
      const user2 = createTestUser("user-2");

      await Effect.runPromise(gateway.create(user1).pipe(Effect.provide(getTestLayer())));
      await Effect.runPromise(gateway.create(user2).pipe(Effect.provide(getTestLayer())));

      const effect = gateway.findAllPaginated({ limit: 10, offset: 1 }).pipe(Effect.provide(getTestLayer()));
      const result = await Effect.runPromise(effect);

      expect(result).toHaveLength(1);
    });
  });

  describe("search", () => {
    it("should return empty result when no users for trip", async () => {
      const effect = gateway.search({
        tripId: "trip-empty",
        field: "name",
        limit: 10,
        offset: 0,
      }).pipe(Effect.provide(getTestLayer()));

      const result = await Effect.runPromise(effect);
      expect(result.users).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.hasMore).toBe(false);
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

      await Effect.runPromise(gateway.create(user1).pipe(Effect.provide(getTestLayer())));
      await Effect.runPromise(gateway.create(user2).pipe(Effect.provide(getTestLayer())));
      gateway.associateWithTrip("user-1", "trip-search");
      gateway.associateWithTrip("user-2", "trip-search");

      const effect = gateway.search({
        tripId: "trip-search",
        field: "name",
        searchTerm: "Alice",
        limit: 10,
        offset: 0,
      }).pipe(Effect.provide(getTestLayer()));

      const result = await Effect.runPromise(effect);

      expect(result.users).toHaveLength(1);
      expect(result.users[0]?.firstName).toBe("Alice");
      expect(result.total).toBe(1);
    });
  });

  describe("create", () => {
    it("should create and return user", async () => {
      const user = createTestUser("new-user");
      const effect = gateway.create(user).pipe(Effect.provide(getTestLayer()));

      const result = await Effect.runPromise(effect);
      expect(result.id).toEqual(user.id);

      // Verify it was stored
      const found = await Effect.runPromise(gateway.findById(user.id).pipe(Effect.provide(getTestLayer())));
      expect(found).not.toBeNull();
    });
  });

  describe("update", () => {
    it("should update existing user", async () => {
      const user = createTestUser("update-user", { firstName: "Original" });
      await Effect.runPromise(gateway.create(user).pipe(Effect.provide(getTestLayer())));

      // Create updated version using withProfile method
      const updatedEffect = user.withProfile({ firstName: "Updated" });
      const updated = await Effect.runPromise(updatedEffect);

      const effect = gateway.update(updated).pipe(Effect.provide(getTestLayer()));
      const result = await Effect.runPromise(effect);

      expect(result.firstName).toBe("Updated");

      // Verify update persisted
      const found = await Effect.runPromise(gateway.findById(user.id).pipe(Effect.provide(getTestLayer())));
      expect(found?.firstName).toBe("Updated");
    });
  });

  describe("delete", () => {
    it("should delete user", async () => {
      const user = createTestUser("delete-user");
      await Effect.runPromise(gateway.create(user).pipe(Effect.provide(getTestLayer())));

      // Verify exists
      let found = await Effect.runPromise(gateway.findById(user.id).pipe(Effect.provide(getTestLayer())));
      expect(found).not.toBeNull();

      const effect = gateway.delete(user.id).pipe(Effect.provide(getTestLayer()));
      await Effect.runPromise(effect);

      // Verify deleted
      found = await Effect.runPromise(gateway.findById(user.id).pipe(Effect.provide(getTestLayer())));
      expect(found).toBeNull();
    });
  });

  describe("exists", () => {
    it("should return false for non-existent user", async () => {
      const userId = UserId.unsafeCreate("nonexistent");
      const effect = gateway.exists(userId).pipe(Effect.provide(getTestLayer()));

      const result = await Effect.runPromise(effect);
      expect(result).toBe(false);
    });

    it("should return true for existing user", async () => {
      const user = createTestUser("existing-user");
      await Effect.runPromise(gateway.create(user).pipe(Effect.provide(getTestLayer())));

      const effect = gateway.exists(user.id).pipe(Effect.provide(getTestLayer()));
      const result = await Effect.runPromise(effect);

      expect(result).toBe(true);
    });
  });

  describe("count", () => {
    it("should return zero for empty gateway", async () => {
      const effect = gateway.count().pipe(Effect.provide(getTestLayer()));
      const result = await Effect.runPromise(effect);

      expect(result).toBe(0);
    });

    it("should return correct count", async () => {
      await Effect.runPromise(gateway.create(createTestUser("c1")).pipe(Effect.provide(getTestLayer())));
      await Effect.runPromise(gateway.create(createTestUser("c2")).pipe(Effect.provide(getTestLayer())));
      await Effect.runPromise(gateway.create(createTestUser("c3")).pipe(Effect.provide(getTestLayer())));

      const effect = gateway.count().pipe(Effect.provide(getTestLayer()));
      const result = await Effect.runPromise(effect);

      expect(result).toBe(3);
    });
  });

  describe("AuthContext pattern", () => {
    it("should use AuthContext with Layer.provide", async () => {
      // Create a custom auth context for testing
      const customAuthContext = createMockAuthContext({
        userId: "custom-user",
        role: "ADMIN",
        tripRoles: { "trip-123": "LEADER" },
      });
      const customLayer = getTestLayer(customAuthContext);

      const user = createTestUser("auth-test-user");
      const effect = gateway.create(user).pipe(Effect.provide(customLayer));

      const result = await Effect.runPromise(effect);
      expect(result.id).toEqual(user.id);
    });

    it("should work with unauthenticated context for public operations", async () => {
      const unauthenticatedContext = createMockAuthContext({
        userId: "",
        role: "USER",
        isAuthenticated: false,
      });
      const publicLayer = getTestLayer(unauthenticatedContext);

      const user = createTestUser("public-test-user");
      // For in-memory gateway, unauthenticated access should still work
      const effect = gateway.create(user).pipe(Effect.provide(publicLayer));

      const result = await Effect.runPromise(effect);
      expect(result.id).toEqual(user.id);
    });
  });

  describe("Error handling with Either pattern", () => {
    it("should demonstrate Either.isLeft for error cases", async () => {
      const user = createTestUser("error-test");
      const effect = gateway.create(user).pipe(Effect.provide(getTestLayer()));

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
      const effect = gateway.create(user).pipe(Effect.provide(getTestLayer()));

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
