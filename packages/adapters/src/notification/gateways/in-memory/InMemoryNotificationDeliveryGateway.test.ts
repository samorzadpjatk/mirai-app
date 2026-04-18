/**
 * InMemoryNotificationDeliveryGateway Tests
 *
 * Tests using Either pattern with Effect.either, Either.isLeft/isRight, and instanceof.
 * Uses AuthContext pattern for authorization.
 */

import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Either, Layer } from "effect";
import { InMemoryNotificationDeliveryGateway } from "./InMemoryNotificationDeliveryGateway";
import type { NotificationDelivery } from "@mirai-app/domain";
import { NotificationDeliveryId, NotificationId, TripId, DatabaseError } from "@mirai-app/domain";
import { AuthContextTag, type AuthContext } from "../../../infrastructure/effect";
import { AuthZPortTag } from "@mirai-app/use-cases";
import type { IAuthZPort } from "@mirai-app/domain";

const createTestNotificationDelivery = (id: string, notificationId: string): NotificationDelivery => {
  return {
    id: NotificationDeliveryId.unsafeCreate(id),
    notificationId: NotificationId.unsafeCreate(notificationId),
    tripId: TripId.unsafeCreate("test-trip-123"),
    scheduleId: null,
    status: "pending",
    deliveryStartedAt: new Date("2024-01-01"),
    deliveryCompletedAt: null,
    totalRecipients: 10,
    successCount: 8,
    failureCount: 2,
    errors: null,
  };
};

// Create mock AuthContext for testing
const createMockAuthContext = (overrides?: Partial<AuthContext>): AuthContext => ({
  userId: "user-123",
  role: "USER",
  tripRoles: { "test-trip-123": "LEADER" },
  isAuthenticated: true,
  accessToken: "mock-token",
  ...overrides,
});

// Create mock AuthZPort for testing
const createMockAuthZPort = (): IAuthZPort => ({
  verifyAccess: () => Effect.succeed(void 0),
  checkRolePermission: () => Effect.succeed(true),
});

// Create test layer with mock dependencies
const createTestLayer = (authContext?: AuthContext) => {
  const mockAuthContext = authContext ?? createMockAuthContext();
  const mockAuthZPort = createMockAuthZPort();

  return Layer.mergeAll(
    Layer.succeed(AuthContextTag, mockAuthContext),
    Layer.succeed(AuthZPortTag, mockAuthZPort),
  );
};

describe("[UNIT] InMemoryNotificationDeliveryGateway", () => {
  let gateway: InMemoryNotificationDeliveryGateway;
  const getTestLayer = () =>
    Layer.mergeAll(
      Layer.succeed(AuthContextTag, createMockAuthContext()),
      Layer.succeed(AuthZPortTag, createMockAuthZPort()),
    );

  beforeEach(() => {
    gateway = new InMemoryNotificationDeliveryGateway();
  });

  describe("findByNotificationId", () => {
    it("should return null when NotificationDelivery not found", async () => {
      const notificationId = NotificationId.unsafeCreate("nonexistent");
      const effect = gateway.findByNotificationId(notificationId).pipe(
        Effect.provide(getTestLayer())
      );
      const either = await Effect.runPromise(Effect.either(effect));
      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) expect(either.right).toBeNull();
    });

    it("should return NotificationDelivery when found", async () => {
      const notificationId = NotificationId.unsafeCreate("notif-123");
      const item = createTestNotificationDelivery("delivery-123", notificationId.toString());
      await Effect.runPromise(gateway.create(item).pipe(Effect.provide(getTestLayer())));

      const effect = gateway.findByNotificationId(notificationId).pipe(
        Effect.provide(getTestLayer())
      );
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either) && either.right) {
        expect(either.right.id).toEqual(item.id);
      }
    });
  });

  describe("findAll", () => {
    it("should return paginated deliveries", async () => {
      const item1 = createTestNotificationDelivery("delivery-1", "notif-1");
      const item2 = createTestNotificationDelivery("delivery-2", "notif-2");
      await Effect.runPromise(gateway.create(item1).pipe(Effect.provide(getTestLayer())));
      await Effect.runPromise(gateway.create(item2).pipe(Effect.provide(getTestLayer())));

      const effect = gateway.findAll({ limit: 10, offset: 0 }).pipe(
        Effect.provide(getTestLayer())
      );
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right.total).toBe(2);
        expect(either.right.deliveries.length).toBe(2);
      }
    });

    it("should filter by tripId with auth check", async () => {
      const item = createTestNotificationDelivery("delivery-123", "notif-123");
      await Effect.runPromise(gateway.create(item).pipe(Effect.provide(getTestLayer())));

      const effect = gateway.findAll({ tripId: "test-trip-123", limit: 10, offset: 0 }).pipe(
        Effect.provide(getTestLayer())
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
      const item = createTestNotificationDelivery("new-item", "notif-new");
      const effect = gateway.create(item).pipe(Effect.provide(getTestLayer()));

      const either = await Effect.runPromise(Effect.either(effect));
      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right.id).toEqual(item.id);
      }
    });
  });

  describe("update", () => {
    it("should update existing delivery", async () => {
      const item = createTestNotificationDelivery("update-item", "notif-update");
      await Effect.runPromise(gateway.create(item).pipe(Effect.provide(getTestLayer())));

      const updatedItem: NotificationDelivery = { ...item, status: "success" };
      const effect = gateway.update(updatedItem).pipe(Effect.provide(getTestLayer()));

      const either = await Effect.runPromise(Effect.either(effect));
      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right.status).toBe("success");
      }
    });
  });

  describe("Either pattern", () => {
    it("should use Effect.either with Either.isLeft/isRight and instanceof", async () => {
      const item = createTestNotificationDelivery("pattern-item", "notif-pattern");
      const effect = gateway.create(item).pipe(Effect.provide(getTestLayer()));

      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);
      expect(Either.isLeft(either)).toBe(false);

      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(DatabaseError);
      }
    });
  });
});
