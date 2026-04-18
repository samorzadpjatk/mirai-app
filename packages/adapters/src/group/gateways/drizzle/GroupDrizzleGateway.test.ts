/**
 * GroupDrizzleGateway Tests
 *
 * Tests for the Drizzle ORM implementation of IGroupPort.
 * Uses AuthContext pattern with Effect.gen and Layer.provide for auth dependencies.
 */

import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Either, Layer } from "effect";
import { InMemoryGroupGateway } from "../in-memory/InMemoryGroupGateway";
import {
  Group,
  GroupId,
  TripId,
  UserId,
  DatabaseError,
} from "@mirai-app/domain";
import { AuthContextTag, type AuthContext } from "../../../infrastructure/effect";
import { AuthZPortTag } from "@mirai-app/use-cases";
import type { IAuthZPort } from "@mirai-app/domain";

// ============================================================================
// Mock AuthContext Helper
// ============================================================================

/**
 * Creates a mock AuthContext for testing
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
const createTestLayer = (authContext?: AuthContext) =>
  Layer.mergeAll(
    Layer.succeed(AuthContextTag, authContext ?? createMockAuthContext()),
    Layer.succeed(AuthZPortTag, createMockAuthZPort()),
  );

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
  let testLayer: Layer.Layer<typeof AuthZPortTag | typeof AuthContextTag>;

  beforeEach(() => {
    gateway = new InMemoryGroupGateway();
    testLayer = createTestLayer();
  });

  describe("findById", () => {
    it("should return null when group not found", async () => {
      const groupId = GroupId.unsafeCreate("nonexistent-id");
      const effect = gateway.findById(groupId).pipe(Effect.provide(testLayer));

      const result = await Effect.runPromise(effect);
      expect(result).toBeNull();
    });

    it("should return group when found", async () => {
      const group = createTestGroup("group-123");
      await Effect.runPromise(gateway.create(group).pipe(Effect.provide(testLayer)));

      const effect = gateway.findById(group.id).pipe(Effect.provide(testLayer));
      const result = await Effect.runPromise(effect);

      expect(result).not.toBeNull();
      expect(result?.id).toEqual(group.id);
      expect(result?.name).toBe("Test Group");
    });
  });

  describe("findByTripId", () => {
    it("should return empty array when no groups for trip", async () => {
      const effect = gateway.findByTripId(TripId.unsafeCreate("trip-empty")).pipe(Effect.provide(testLayer));

      const result = await Effect.runPromise(effect);
      expect(result).toEqual([]);
    });

    it("should return groups for trip", async () => {
      const tripId = TripId.unsafeCreate("trip-abc");
      const group1 = { ...createTestGroup("g1"), tripId };
      const group2 = { ...createTestGroup("g2"), tripId };

      await Effect.runPromise(gateway.create(group1).pipe(Effect.provide(testLayer)));
      await Effect.runPromise(gateway.create(group2).pipe(Effect.provide(testLayer)));

      const effect = gateway.findByTripId(tripId).pipe(Effect.provide(testLayer));
      const result = await Effect.runPromise(effect);

      expect(result).toHaveLength(2);
    });
  });

  describe("create", () => {
    it("should create and return group", async () => {
      const group = createTestGroup("new-group");
      const effect = gateway.create(group).pipe(Effect.provide(testLayer));

      const result = await Effect.runPromise(effect);
      expect(result.id).toEqual(group.id);

      // Verify it was stored
      const found = await Effect.runPromise(gateway.findById(group.id).pipe(Effect.provide(testLayer)));
      expect(found).not.toBeNull();
    });
  });

  describe("update", () => {
    it("should update existing group", async () => {
      const group = createTestGroup("update-group", { name: "Original" });
      await Effect.runPromise(gateway.create(group).pipe(Effect.provide(testLayer)));

      const updated = { ...group, name: "Updated" };
      const effect = gateway.update(updated).pipe(Effect.provide(testLayer));

      const result = await Effect.runPromise(effect);
      expect(result.name).toBe("Updated");

      // Verify update persisted
      const found = await Effect.runPromise(gateway.findById(group.id).pipe(Effect.provide(testLayer)));
      expect(found?.name).toBe("Updated");
    });
  });

  describe("delete", () => {
    it("should delete group", async () => {
      const group = createTestGroup("delete-group");
      await Effect.runPromise(gateway.create(group).pipe(Effect.provide(testLayer)));

      // Verify exists
      let found = await Effect.runPromise(gateway.findById(group.id).pipe(Effect.provide(testLayer)));
      expect(found).not.toBeNull();

      const effect = gateway.delete(group.id).pipe(Effect.provide(testLayer));
      await Effect.runPromise(effect);

      // Verify deleted
      found = await Effect.runPromise(gateway.findById(group.id).pipe(Effect.provide(testLayer)));
      expect(found).toBeNull();
    });
  });

  describe("exists", () => {
    it("should return false for non-existent group", async () => {
      const groupId = GroupId.unsafeCreate("nonexistent");
      const effect = gateway.exists(groupId).pipe(Effect.provide(testLayer));

      const result = await Effect.runPromise(effect);
      expect(result).toBe(false);
    });

    it("should return true for existing group", async () => {
      const group = createTestGroup("existing-group");
      await Effect.runPromise(gateway.create(group).pipe(Effect.provide(testLayer)));

      const effect = gateway.exists(group.id).pipe(Effect.provide(testLayer));
      const result = await Effect.runPromise(effect);

      expect(result).toBe(true);
    });
  });

  describe("AuthContext pattern", () => {
    it("should use AuthContext with Layer.provide", async () => {
      // Create a custom auth context for testing with trip-specific roles
      const customAuthContext = createMockAuthContext({
        userId: "custom-user",
        role: "USER",
        tripRoles: { "trip-default": "LEADER" },
      });
      const customLayer = createTestLayer(customAuthContext);

      const group = createTestGroup("auth-test-group");
      const effect = gateway.create(group).pipe(Effect.provide(customLayer));

      const result = await Effect.runPromise(effect);
      expect(result.id).toEqual(group.id);
    });

    it("should work with unauthenticated context for public operations", async () => {
      const unauthenticatedContext = createMockAuthContext({
        userId: "",
        role: "USER",
        isAuthenticated: false,
      });
      const publicLayer = createTestLayer(unauthenticatedContext);

      const group = createTestGroup("public-test-group");
      const effect = gateway.create(group).pipe(Effect.provide(publicLayer));

      const result = await Effect.runPromise(effect);
      expect(result.id).toEqual(group.id);
    });
  });

  describe("Error handling with Either pattern", () => {
    it("should use Either.isLeft/isRight for error checking", async () => {
      const group = createTestGroup("either-test");
      const effect = gateway.create(group).pipe(Effect.provide(testLayer));

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
