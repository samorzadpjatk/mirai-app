/**
 * InMemoryNotificationScheduleGateway Tests
 *
 * Tests using Either pattern with Effect.either, Either.isLeft/isRight, and instanceof.
 * Tests use mock AuthContext and AuthZPort for authorization.
 */

import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Either, Layer } from "effect";
import { InMemoryNotificationScheduleGateway } from "./InMemoryNotificationScheduleGateway";
import type { NotificationSchedule } from "@mirai-app/domain";
import { NotificationScheduleId, TripId, UserId, DatabaseError, PermissionDeniedError } from "@mirai-app/domain";
import { AuthZPortTag } from "@mirai-app/use-cases";
import { AuthContextTag, type AuthContext } from "../../../infrastructure/effect";
import type { IAuthZPort } from "@mirai-app/domain";

/**
 * Create mock AuthContext for testing
 */
const createMockAuthContext = (overrides?: Partial<AuthContext>): AuthContext => ({
  userId: "test-user-123",
  role: "ADMIN",
  tripRoles: { "trip-123": "LEADER" },
  isAuthenticated: true,
  accessToken: "test-token",
  ...overrides,
});

/**
 * Create mock AuthZPort that allows all access
 */
const createMockAuthZPort = (): IAuthZPort => ({
  verifyAccess: () => Effect.succeed(void 0),
  checkRolePermission: () => Effect.succeed(true),
});

/**
 * Create mock AuthZPort that denies all access
 */
const createDenyAllAuthZPort = (): IAuthZPort => ({
  verifyAccess: () => Effect.fail(new PermissionDeniedError({
    requiredPermission: "read",
    resourceType: "trip",
    userId: "test-user-123",
  })),
  checkRolePermission: () => Effect.succeed(false),
});

/**
 * Create test layer with mock auth
 */
const getTestLayer = (authContext?: AuthContext, authZPort?: IAuthZPort) => {
  return Layer.mergeAll(
    Layer.succeed(AuthContextTag, authContext ?? createMockAuthContext()),
    Layer.succeed(AuthZPortTag, authZPort ?? createMockAuthZPort()),
  );
};

const createTestNotificationSchedule = (id: string, tripId: string): NotificationSchedule => {
  return {
    id: NotificationScheduleId.unsafeCreate(id),
    name: "Test Schedule",
    tripId: TripId.unsafeCreate(tripId),
    notificationType: "reminder",
    notificationTitle: "Test Notification",
    notificationBody: "This is a test notification",
    notificationUrl: null,
    startDate: new Date("2024-01-01"),
    endDate: new Date("2024-12-31"),
    hour: 9,
    minute: 0,
    isActive: true,
    lastRun: null,
    createdById: UserId.unsafeCreate("test-user-123"),
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  };
};

describe("[UNIT] InMemoryNotificationScheduleGateway", () => {
  let gateway: InMemoryNotificationScheduleGateway;

  beforeEach(() => {
    gateway = new InMemoryNotificationScheduleGateway();
  });

  describe("findById", () => {
    it("should return null when NotificationSchedule not found", async () => {
      const effect = gateway.findById(NotificationScheduleId.unsafeCreate("nonexistent")).pipe(
        Effect.provide(getTestLayer()),
      );
      const either = await Effect.runPromise(Effect.either(effect));
      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) expect(either.right).toBeNull();
    });

    it("should return NotificationSchedule when found", async () => {
      const item = createTestNotificationSchedule("item-123", "trip-123");
      await Effect.runPromise(gateway.create(item).pipe(Effect.provide(getTestLayer())));

      const effect = gateway.findById(item.id).pipe(Effect.provide(getTestLayer()));
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either) && either.right) {
        expect(either.right.id).toEqual(item.id);
      }
    });
  });

  describe("findAll", () => {
    it("should return paginated schedules", async () => {
      const item1 = createTestNotificationSchedule("item-1", "trip-123");
      const item2 = createTestNotificationSchedule("item-2", "trip-456");
      await Effect.runPromise(gateway.create(item1).pipe(Effect.provide(getTestLayer())));
      await Effect.runPromise(gateway.create(item2).pipe(Effect.provide(getTestLayer())));

      const effect = gateway.findAll({ limit: 10, offset: 0 }).pipe(Effect.provide(getTestLayer()));
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right.total).toBe(2);
      }
    });

    it("should filter by tripId", async () => {
      const item = createTestNotificationSchedule("item-123", "trip-123");
      await Effect.runPromise(gateway.create(item).pipe(Effect.provide(getTestLayer())));

      const effect = gateway.findAll({ tripId: "trip-123", limit: 10, offset: 0 }).pipe(
        Effect.provide(getTestLayer()),
      );
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right.total).toBe(1);
      }
    });
  });

  describe("create", () => {
    it("should create with Either pattern", async () => {
      const item = createTestNotificationSchedule("new-item", "trip-123");
      const effect = gateway.create(item).pipe(Effect.provide(getTestLayer()));

      const either = await Effect.runPromise(Effect.either(effect));
      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right.id).toEqual(item.id);
      }
    });

    it("should fail with auth error when access denied", async () => {
      const denyLayer = getTestLayer(
        createMockAuthContext(),
        createDenyAllAuthZPort()
      );
      const item = createTestNotificationSchedule("deny-item", "trip-123");
      const effect = gateway.create(item).pipe(Effect.provide(denyLayer));

      const either = await Effect.runPromise(Effect.either(effect));
      expect(Either.isLeft(either)).toBe(true);
    });
  });

  describe("Either pattern", () => {
    it("should use Effect.either with Either.isLeft/isRight and instanceof", async () => {
      const item = createTestNotificationSchedule("pattern-item", "trip-123");
      const effect = gateway.create(item).pipe(Effect.provide(getTestLayer()));

      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);
      expect(Either.isLeft(either)).toBe(false);

      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(DatabaseError);
      }
    });
  });

  describe("authorization", () => {
    it("should allow access with proper auth context", async () => {
      const item = createTestNotificationSchedule("auth-item", "trip-123");
      const effect = gateway.create(item).pipe(Effect.provide(getTestLayer()));

      const either = await Effect.runPromise(Effect.either(effect));
      expect(Either.isRight(either)).toBe(true);
    });

    it("should deny access when permission denied", async () => {
      const denyLayer = getTestLayer(
        createMockAuthContext(),
        createDenyAllAuthZPort()
      );
      const item = createTestNotificationSchedule("deny-item-2", "trip-123");
      const effect = gateway.create(item).pipe(Effect.provide(denyLayer));

      const either = await Effect.runPromise(Effect.either(effect));
      expect(Either.isLeft(either)).toBe(true);
    });
  });
});
