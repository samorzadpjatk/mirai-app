import { describe, it, expect, beforeEach } from "bun:test";
import {
  getDeliveryByNotificationIdUseCase,
  DeliveryNotFoundError,
  type GetDeliveryByNotificationIdInput,
} from "./GetDeliveryByNotificationId";
import { Effect } from "effect";
import { NotificationDeliveryRepositoryTag } from "../ports/NotificationDeliveryRepository";
import { InMemoryNotificationDeliveryRepository } from "@mirai-app/adapters/gateways/in-memory";
import type { NotificationDelivery } from "../ports/NotificationDeliveryRepository";

// Mock NotificationDelivery
const createMockDelivery = (
  overrides?: Partial<NotificationDelivery>,
): NotificationDelivery =>
  ({
    id: "delivery-123",
    notificationId: "notif-123",
    tripId: "trip-123",
    status: "success",
    totalRecipients: 100,
    successCount: 95,
    failureCount: 5,
    deliveryStartedAt: new Date("2024-01-01T09:00:00"),
    deliveryCompletedAt: new Date("2024-01-01T09:05:00"),
    errorLog: null,
    notification: {
      id: "notif-123",
      title: "Test Notification",
      body: "Test Body",
      url: "https://example.com",
      createdAt: new Date("2024-01-01T09:00:00"),
      tripId: "trip-123",
      createdBy: {
        id: "user-123",
        firstName: "John",
        lastName: "Doe",
        authUserId: "auth-123",
      },
    },
    ...overrides,
  }) as NotificationDelivery;

describe("[UNIT] getDeliveryByNotificationIdUseCase (Effect)", () => {
  let repo: InMemoryNotificationDeliveryRepository;

  beforeEach(() => {
    repo = new InMemoryNotificationDeliveryRepository();
  });

  // Helper to run use case with repository
  const runUseCase = async (input: GetDeliveryByNotificationIdInput) => {
    const program = getDeliveryByNotificationIdUseCase(input).pipe(
      Effect.provideService(NotificationDeliveryRepositoryTag, {
        findMany: (filters, pagination) => repo.findMany(filters, pagination),
        count: (filters) => repo.count(filters),
        findByNotificationId: (notificationId) =>
          repo.findByNotificationId(notificationId),
        getStats: (filters) => repo.getStats(filters),
        findFailed: (tripId, pagination) => repo.findFailed(tripId, pagination),
        countFailed: (tripId) => repo.countFailed(tripId),
      }),
    );
    return await Effect.runPromise(program);
  };

  describe("execute", () => {
    it("should return delivery by notification ID", async () => {
      repo.seed([createMockDelivery()]);

      const input: GetDeliveryByNotificationIdInput = {
        notificationId: "notif-123",
        tripId: "trip-123",
      };

      const result = await runUseCase(input);

      expect(result.delivery.id).toBe("delivery-123");
      expect(result.delivery.notificationId).toBe("notif-123");
      expect(result.delivery.status).toBe("success");
    });

    it("should fail with DeliveryNotFoundError when delivery not found", async () => {
      const input: GetDeliveryByNotificationIdInput = {
        notificationId: "nonexistent",
        tripId: "trip-123",
      };

      const program = getDeliveryByNotificationIdUseCase(input).pipe(
        Effect.provideService(NotificationDeliveryRepositoryTag, {
          findMany: (filters, pagination) => repo.findMany(filters, pagination),
          count: (filters) => repo.count(filters),
          findByNotificationId: () =>
            Effect.promise(() => Promise.resolve(null)),
          getStats: (filters) => repo.getStats(filters),
          findFailed: (tripId, pagination) =>
            repo.findFailed(tripId, pagination),
          countFailed: (tripId) => repo.countFailed(tripId),
        }),
      );

      const result = await Effect.runPromise(Effect.either(program));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(DeliveryNotFoundError);
      }
    });

    it("should fail with DeliveryNotFoundError when delivery belongs to different trip", async () => {
      repo.seed([createMockDelivery({ tripId: "different-trip" })]);

      const input: GetDeliveryByNotificationIdInput = {
        notificationId: "notif-123",
        tripId: "trip-123",
      };

      const program = getDeliveryByNotificationIdUseCase(input).pipe(
        Effect.provideService(NotificationDeliveryRepositoryTag, {
          findMany: (filters, pagination) => repo.findMany(filters, pagination),
          count: (filters) => repo.count(filters),
          findByNotificationId: () => repo.findByNotificationId("notif-123"),
          getStats: (filters) => repo.getStats(filters),
          findFailed: (tripId, pagination) =>
            repo.findFailed(tripId, pagination),
          countFailed: (tripId) => repo.countFailed(tripId),
        }),
      );

      const result = await Effect.runPromise(Effect.either(program));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(DeliveryNotFoundError);
      }
    });

    it("should include notification details in output", async () => {
      repo.seed([createMockDelivery()]);

      const input: GetDeliveryByNotificationIdInput = {
        notificationId: "notif-123",
        tripId: "trip-123",
      };

      const result = await runUseCase(input);

      expect(result.delivery.notification).not.toBeNull();
      expect(result.delivery.notification?.title).toBe("Test Notification");
      expect(result.delivery.notification?.body).toBe("Test Body");
      expect(result.delivery.notification?.createdBy?.firstName).toBe("John");
    });

    it("should handle delivery without optional fields", async () => {
      repo.seed([
        createMockDelivery({
          deliveryCompletedAt: undefined,
          errorLog: undefined,
          notification: null,
        }),
      ]);

      const input: GetDeliveryByNotificationIdInput = {
        notificationId: "notif-123",
        tripId: "trip-123",
      };

      const result = await runUseCase(input);

      expect(result.delivery.notification).toBeNull();
    });

    it("should return delivery stats correctly", async () => {
      repo.seed([createMockDelivery()]);

      const input: GetDeliveryByNotificationIdInput = {
        notificationId: "notif-123",
        tripId: "trip-123",
      };

      const result = await runUseCase(input);

      expect(result.delivery.totalRecipients).toBe(100);
      expect(result.delivery.successCount).toBe(95);
      expect(result.delivery.failureCount).toBe(5);
    });
  });
});
