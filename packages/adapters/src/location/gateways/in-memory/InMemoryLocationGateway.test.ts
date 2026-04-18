/**
 * InMemoryLocationGateway Tests
 *
 * Tests use Effect.either with Either.isLeft/Either.isRight for type-safe error testing.
 * AuthContext and AuthZPort are mocked using Layer.succeed for isolated testing.
 */

import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Either, Layer, Context } from "effect";
import { InMemoryLocationGateway } from "./InMemoryLocationGateway";
import {
  Location,
  LocationId,
  DatabaseError,
  PermissionDeniedError,
  ValidationError,
  UserId,
} from "@mirai-app/domain";
import { AuthContextTag, type AuthContext } from "../../../infrastructure/effect";
import type { IAuthZPort, ILocationPort } from "@mirai-app/domain";

// Local definition to avoid loading problematic modules
class AuthZPortTag extends Context.Tag("AuthZ")<AuthZPortTag, IAuthZPort>() {}

// ============================================================================
// Test Helpers
// ============================================================================

const createTestLocation = (
  id: string,
  overrides?: Partial<{
    userId: UserId;
    isSharingLocation: boolean;
    latitude: number;
    longitude: number;
  }>,
) => {
  return Location.create({
    id: LocationId.unsafeCreate(id),
    userId: overrides?.userId ?? UserId.unsafeCreate("user-default"),
    isSharingLocation: overrides?.isSharingLocation ?? false,
    latitude: overrides?.latitude ?? 51.5074,
    longitude: overrides?.longitude ?? -0.1278,
  });
};

// Mock AuthContext for authenticated user
const createMockAuthContext = (userId: string): AuthContext => ({
  userId,
  role: "USER",
  tripRoles: { "trip-default": "MEMBER" },
  isAuthenticated: true,
  accessToken: "mock-jwt-token",
});

// Mock unauthenticated context
const createUnauthenticatedContext = (): AuthContext => ({
  userId: "",
  role: "USER",
  tripRoles: {},
  isAuthenticated: false,
});

// Mock AuthZPort that always allows access
const createMockAuthZPort = (): IAuthZPort => ({
  verifyAccess: () => Effect.succeed(void 0),
  checkRolePermission: () => Effect.succeed(true),
});

// Create test layer with mocked auth
const createTestLayer = (userId: string) =>
  Layer.merge(
    Layer.succeed(AuthContextTag, createMockAuthContext(userId)),
    Layer.succeed(AuthZPortTag, createMockAuthZPort()),
  );

const createUnauthenticatedLayer = () =>
  Layer.merge(
    Layer.succeed(AuthContextTag, createUnauthenticatedContext()),
    Layer.succeed(AuthZPortTag, createMockAuthZPort()),
  );

// ============================================================================
// Tests
// ============================================================================

describe("[UNIT] InMemoryLocationGateway - Auth Protected", () => {
  let gateway: InMemoryLocationGateway;

  beforeEach(() => {
    gateway = new InMemoryLocationGateway();
  });

  describe("findById", () => {
    it("should return location when found", async () => {
      const location = await Effect.runPromise(
        createTestLocation("location-123", {
          userId: UserId.unsafeCreate("user-123"),
        }),
      );

      // First create the location
      const createProgram = gateway.create(location).pipe(
        Effect.provide(createTestLayer("user-123")),
      );
      await Effect.runPromise(createProgram);

      // Then find it
      const findProgram = gateway.findById(location.id).pipe(
        Effect.provide(createTestLayer("user-123")),
      );
      const either = await Effect.runPromise(Effect.either(findProgram));

      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either) && either.right) {
        expect(either.right.id).toEqual(location.id);
      }
    });

    it("should return null when location not found", async () => {
      const program = gateway
        .findById(LocationId.unsafeCreate("nonexistent"))
        .pipe(Effect.provide(createTestLayer("user-123")));

      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) expect(either.right).toBeNull();
    });
  });

  describe("findByUserId - Privacy Protected", () => {
    it("should return location when user accesses their own location", async () => {
      const userId = UserId.unsafeCreate("user-123");
      const location = await Effect.runPromise(
        createTestLocation("location-123", { userId }),
      );

      // Create location
      const createProgram = gateway.create(location).pipe(
        Effect.provide(createTestLayer("user-123")),
      );
      await Effect.runPromise(createProgram);

      // Access own location
      const findProgram = gateway.findByUserId(userId).pipe(
        Effect.provide(createTestLayer("user-123")),
      );
      const either = await Effect.runPromise(Effect.either(findProgram));

      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either) && either.right) {
        expect(either.right.id).toEqual(location.id);
      }
    });

    it("should fail with PermissionDeniedError when user accesses another user's location", async () => {
      const userId1 = UserId.unsafeCreate("user-123");
      const userId2 = UserId.unsafeCreate("user-456");
      const location = await Effect.runPromise(
        createTestLocation("location-123", { userId: userId1 }),
      );

      // Create location for user-123
      const createProgram = gateway.create(location).pipe(
        Effect.provide(createTestLayer("user-123")),
      );
      await Effect.runPromise(createProgram);

      // Try to access user-123's location as user-456
      const findProgram = gateway.findByUserId(userId1).pipe(
        Effect.provide(createTestLayer("user-456")),
      );
      const either = await Effect.runPromise(Effect.either(findProgram));

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(PermissionDeniedError);
      }
    });

    it("should fail with PermissionDeniedError when unauthenticated", async () => {
      const userId = UserId.unsafeCreate("user-123");
      const location = await Effect.runPromise(
        createTestLocation("location-123", { userId }),
      );

      // Create location
      const createProgram = gateway.create(location).pipe(
        Effect.provide(createTestLayer("user-123")),
      );
      await Effect.runPromise(createProgram);

      // Try to access without authentication
      const findProgram = gateway.findByUserId(userId).pipe(
        Effect.provide(createUnauthenticatedLayer()),
      );
      const either = await Effect.runPromise(Effect.either(findProgram));

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(PermissionDeniedError);
      }
    });
  });

  describe("update - Privacy Protected", () => {
    it("should update when user updates their own location", async () => {
      const userId = UserId.unsafeCreate("user-123");
      const location = await Effect.runPromise(
        createTestLocation("location-123", { userId }),
      );

      // Create location
      const createProgram = gateway.create(location).pipe(
        Effect.provide(createTestLayer("user-123")),
      );
      await Effect.runPromise(createProgram);

      // Update own location - enable sharing
      const updatedLocation = location.enableSharing();
      const updateProgram = gateway.update(updatedLocation).pipe(
        Effect.provide(createTestLayer("user-123")),
      );
      const either = await Effect.runPromise(Effect.either(updateProgram));

      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right.isSharingLocation).toBe(true);
      }
    });

    it("should fail with PermissionDeniedError when user updates another user's location", async () => {
      const userId1 = UserId.unsafeCreate("user-123");
      const userId2 = UserId.unsafeCreate("user-456");
      const location = await Effect.runPromise(
        createTestLocation("location-123", { userId: userId1 }),
      );

      // Create location for user-123
      const createProgram = gateway.create(location).pipe(
        Effect.provide(createTestLayer("user-123")),
      );
      await Effect.runPromise(createProgram);

      // Try to update user-123's location as user-456
      const updatedLocation = location.enableSharing();
      const updateProgram = gateway.update(updatedLocation).pipe(
        Effect.provide(createTestLayer("user-456")),
      );
      const either = await Effect.runPromise(Effect.either(updateProgram));

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(PermissionDeniedError);
      }
    });
  });

  describe("upsert - Privacy Protected", () => {
    it("should upsert when user upserts their own location", async () => {
      const userId = UserId.unsafeCreate("user-123");
      const location = await Effect.runPromise(
        createTestLocation("location-123", { userId }),
      );

      // Upsert own location
      const upsertProgram = gateway.upsert(location).pipe(
        Effect.provide(createTestLayer("user-123")),
      );
      const either = await Effect.runPromise(Effect.either(upsertProgram));

      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right.id).toEqual(location.id);
      }
    });

    it("should fail with PermissionDeniedError when user upserts another user's location", async () => {
      const userId1 = UserId.unsafeCreate("user-123");
      const userId2 = UserId.unsafeCreate("user-456");
      const location = await Effect.runPromise(
        createTestLocation("location-123", { userId: userId1 }),
      );

      // Try to upsert user-123's location as user-456
      const upsertProgram = gateway.upsert(location).pipe(
        Effect.provide(createTestLayer("user-456")),
      );
      const either = await Effect.runPromise(Effect.either(upsertProgram));

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(PermissionDeniedError);
      }
    });
  });

  describe("findByUserInSharingList - Privacy Protected", () => {
    it("should return locations shared with authenticated user", async () => {
      const ownerId = UserId.unsafeCreate("owner-123");
      const viewerId = UserId.unsafeCreate("viewer-456");

      const location = await Effect.runPromise(
        createTestLocation("location-123", {
          userId: ownerId,
          isSharingLocation: true,
        }),
      );

      // Create location as owner
      const createProgram = gateway.create(location).pipe(
        Effect.provide(createTestLayer("owner-123")),
      );
      await Effect.runPromise(createProgram);

      // Connect viewer to owner's sharing list
      const connectProgram = gateway
        .connectUserToSharing(ownerId, viewerId)
        .pipe(Effect.provide(createTestLayer("owner-123")));
      await Effect.runPromise(connectProgram);

      // Viewer queries locations shared with them
      const findProgram = gateway.findByUserInSharingList(viewerId).pipe(
        Effect.provide(createTestLayer("viewer-456")),
      );
      const either = await Effect.runPromise(Effect.either(findProgram));

      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right).toHaveLength(1);
        const firstLocation = either.right[0];
        if (firstLocation) {
          expect(firstLocation.id).toEqual(location.id);
        }
      }
    });

    it("should fail with PermissionDeniedError when querying another user's sharing list", async () => {
      const viewerId = UserId.unsafeCreate("viewer-456");
      const otherViewerId = UserId.unsafeCreate("other-789");

      // Try to query sharing list for another user
      const findProgram = gateway.findByUserInSharingList(otherViewerId).pipe(
        Effect.provide(createTestLayer("viewer-456")),
      );
      const either = await Effect.runPromise(Effect.either(findProgram));

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(PermissionDeniedError);
      }
    });

    it("should fail with PermissionDeniedError when unauthenticated", async () => {
      const viewerId = UserId.unsafeCreate("viewer-456");

      const findProgram = gateway.findByUserInSharingList(viewerId).pipe(
        Effect.provide(createUnauthenticatedLayer()),
      );
      const either = await Effect.runPromise(Effect.either(findProgram));

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(PermissionDeniedError);
      }
    });
  });

  describe("sharing list operations - Privacy Protected", () => {
    it("should allow owner to modify their sharing list", async () => {
      const ownerId = UserId.unsafeCreate("owner-123");
      const friendId = UserId.unsafeCreate("friend-456");

      const connectProgram = gateway
        .connectUserToSharing(ownerId, friendId)
        .pipe(Effect.provide(createTestLayer("owner-123")));

      const either = await Effect.runPromise(Effect.either(connectProgram));
      expect(Either.isRight(either)).toBe(true);
    });

    it("should fail when non-owner tries to modify sharing list", async () => {
      const ownerId = UserId.unsafeCreate("owner-123");
      const friendId = UserId.unsafeCreate("friend-456");
      const attackerId = UserId.unsafeCreate("attacker-789");

      // Attacker tries to add themselves to owner's sharing list
      const connectProgram = gateway
        .connectUserToSharing(ownerId, friendId)
        .pipe(Effect.provide(createTestLayer("attacker-789")));

      const either = await Effect.runPromise(Effect.either(connectProgram));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(PermissionDeniedError);
      }
    });
  });
});
