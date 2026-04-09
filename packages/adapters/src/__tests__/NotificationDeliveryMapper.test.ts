import { describe, it, expect } from "bun:test";
import { NotificationDeliveryMapper } from "../mappers/NotificationDeliveryMapper";
import type { DeliveryStatus, NotificationDelivery } from "@mirai-app/use-cases";

describe("[UNIT] NotificationDeliveryMapper", () => {
  const createPrismaDelivery = (
    overrides: Partial<{
      id: string;
      notificationId: string;
      tripId: string | null;
      status: string;
      totalRecipients: number;
      successCount: number;
      failureCount: number;
      deliveryStartedAt: Date;
      deliveryCompletedAt: Date | null;
      errors: string | null;
      scheduleId: string | null;
      createdAt: Date;
      updatedAt: Date;
      notification: {
        id: string;
        title: string;
        body: string;
        createdAt: Date;
        createdBy: {
          id: string;
          firstName: string | null;
          lastName: string | null;
          authUserId: string;
        } | null;
      } | null;
    }> = {},
  ) => ({
    id: "delivery-123",
    notificationId: "notification-456",
    tripId: "trip-789",
    status: "success",
    totalRecipients: 10,
    successCount: 9,
    failureCount: 1,
    deliveryStartedAt: new Date("2026-01-01T10:00:00Z"),
    deliveryCompletedAt: new Date("2026-01-01T10:02:00Z"),
    errors: "Token expired for one recipient",
    scheduleId: "schedule-111",
    createdAt: new Date("2026-01-01T10:00:00Z"),
    updatedAt: new Date("2026-01-01T10:02:00Z"),
    notification: {
      id: "notification-456",
      title: "Trip update",
      body: "Daily agenda is ready",
      createdAt: new Date("2026-01-01T09:00:00Z"),
      createdBy: {
        id: "user-abc",
        firstName: "Ada",
        lastName: "Lovelace",
        authUserId: "auth-123",
      },
    },
    ...overrides,
  });

  const createDomainDelivery = (
    overrides: Partial<NotificationDelivery> = {},
  ): NotificationDelivery => ({
    id: "delivery-123",
    notificationId: "notification-456",
    tripId: "trip-789",
    status: "success",
    totalRecipients: 10,
    successCount: 9,
    failureCount: 1,
    deliveryStartedAt: new Date("2026-01-01T10:00:00Z"),
    deliveryCompletedAt: new Date("2026-01-01T10:02:00Z"),
    errorLog: "Token expired for one recipient",
    scheduleId: "schedule-111",
    notification: {
      id: "notification-456",
      title: "Trip update",
      body: "Daily agenda is ready",
      createdAt: new Date("2026-01-01T09:00:00Z"),
      createdBy: {
        id: "user-abc",
        firstName: "Ada",
        lastName: "Lovelace",
        authUserId: "auth-123",
      },
    },
    ...overrides,
  });

  describe("toDomain", () => {
    it("should map full Prisma delivery record to domain delivery", () => {
      const prismaDelivery = createPrismaDelivery();

      const domainDelivery =
        NotificationDeliveryMapper.toDomain(prismaDelivery);

      expect(domainDelivery.id).toBe("delivery-123");
      expect(domainDelivery.notificationId).toBe("notification-456");
      expect(domainDelivery.tripId).toBe("trip-789");
      expect(domainDelivery.status).toBe("success");
      expect(domainDelivery.totalRecipients).toBe(10);
      expect(domainDelivery.successCount).toBe(9);
      expect(domainDelivery.failureCount).toBe(1);
      expect(domainDelivery.deliveryStartedAt).toEqual(
        new Date("2026-01-01T10:00:00Z"),
      );
      expect(domainDelivery.deliveryCompletedAt).toEqual(
        new Date("2026-01-01T10:02:00Z"),
      );
      expect(domainDelivery.errorLog).toBe("Token expired for one recipient");
      expect(domainDelivery.scheduleId).toBe("schedule-111");
      expect(domainDelivery.notification).toEqual({
        id: "notification-456",
        title: "Trip update",
        body: "Daily agenda is ready",
        createdAt: new Date("2026-01-01T09:00:00Z"),
        createdBy: {
          id: "user-abc",
          firstName: "Ada",
          lastName: "Lovelace",
          authUserId: "auth-123",
        },
      });
    });

    it("should map null tripId to empty string", () => {
      const prismaDelivery = createPrismaDelivery({ tripId: null });

      const domainDelivery =
        NotificationDeliveryMapper.toDomain(prismaDelivery);

      expect(domainDelivery.tripId).toBe("");
    });

    it("should map null nested notification and createdBy correctly", () => {
      const deliveryWithoutNotification = createPrismaDelivery({
        notification: null,
      });
      const deliveryWithoutCreatedBy = createPrismaDelivery({
        notification: {
          id: "notification-456",
          title: "Trip update",
          body: "Daily agenda is ready",
          createdAt: new Date("2026-01-01T09:00:00Z"),
          createdBy: null,
        },
      });

      const mappedWithoutNotification = NotificationDeliveryMapper.toDomain(
        deliveryWithoutNotification,
      );
      const mappedWithoutCreatedBy = NotificationDeliveryMapper.toDomain(
        deliveryWithoutCreatedBy,
      );

      expect(mappedWithoutNotification.notification).toBeNull();
      expect(mappedWithoutCreatedBy.notification?.createdBy).toBeNull();
    });

    it("should preserve supported delivery statuses", () => {
      const statuses: DeliveryStatus[] = [
        "pending",
        "success",
        "partial_failure",
        "failure",
      ];

      for (const status of statuses) {
        const prismaDelivery = createPrismaDelivery({ status });
        const domainDelivery =
          NotificationDeliveryMapper.toDomain(prismaDelivery);
        expect(domainDelivery.status).toBe(status);
      }
    });
  });

  describe("toPrismaCreate", () => {
    it("should map domain delivery to Prisma create input", () => {
      const domainDelivery = createDomainDelivery();

      const before = Date.now();
      const prismaData =
        NotificationDeliveryMapper.toPrismaCreate(domainDelivery);
      const after = Date.now();

      expect(prismaData.id).toBe("delivery-123");
      expect(prismaData.notificationId).toBe("notification-456");
      expect(prismaData.tripId).toBe("trip-789");
      expect(prismaData.status).toBe("success");
      expect(prismaData.totalRecipients).toBe(10);
      expect(prismaData.successCount).toBe(9);
      expect(prismaData.failureCount).toBe(1);
      expect(prismaData.deliveryStartedAt).toEqual(
        new Date("2026-01-01T10:00:00Z"),
      );
      expect(prismaData.deliveryCompletedAt).toEqual(
        new Date("2026-01-01T10:02:00Z"),
      );
      expect(prismaData.errors).toBe("Token expired for one recipient");
      expect(prismaData.scheduleId).toBe("schedule-111");
      expect(prismaData.createdAt).toBeInstanceOf(Date);
      expect(prismaData.updatedAt).toBeInstanceOf(Date);
      expect(prismaData.createdAt.getTime()).toBeGreaterThanOrEqual(before);
      expect(prismaData.createdAt.getTime()).toBeLessThanOrEqual(after);
      expect(prismaData.updatedAt.getTime()).toBeGreaterThanOrEqual(before);
      expect(prismaData.updatedAt.getTime()).toBeLessThanOrEqual(after);
    });

    it("should normalize empty and optional fields to null", () => {
      const domainDelivery = createDomainDelivery({
        tripId: "",
        deliveryCompletedAt: null,
        errorLog: undefined,
        scheduleId: undefined,
      });

      const prismaData =
        NotificationDeliveryMapper.toPrismaCreate(domainDelivery);

      expect(prismaData.tripId).toBeNull();
      expect(prismaData.deliveryCompletedAt).toBeNull();
      expect(prismaData.errors).toBeNull();
      expect(prismaData.scheduleId).toBeNull();
    });
  });

  describe("toPrismaUpdate", () => {
    it("should map domain delivery to Prisma update input", () => {
      const domainDelivery = createDomainDelivery();

      const before = Date.now();
      const prismaData =
        NotificationDeliveryMapper.toPrismaUpdate(domainDelivery);
      const after = Date.now();

      expect(prismaData.notificationId).toBe("notification-456");
      expect(prismaData.tripId).toBe("trip-789");
      expect(prismaData.status).toBe("success");
      expect(prismaData.totalRecipients).toBe(10);
      expect(prismaData.successCount).toBe(9);
      expect(prismaData.failureCount).toBe(1);
      expect(prismaData.deliveryStartedAt).toEqual(
        new Date("2026-01-01T10:00:00Z"),
      );
      expect(prismaData.deliveryCompletedAt).toEqual(
        new Date("2026-01-01T10:02:00Z"),
      );
      expect(prismaData.errors).toBe("Token expired for one recipient");
      expect(prismaData.scheduleId).toBe("schedule-111");
      expect(prismaData.updatedAt).toBeInstanceOf(Date);
      expect(prismaData.updatedAt.getTime()).toBeGreaterThanOrEqual(before);
      expect(prismaData.updatedAt.getTime()).toBeLessThanOrEqual(after);
    });

    it("should normalize empty and optional fields to null", () => {
      const domainDelivery = createDomainDelivery({
        tripId: "",
        deliveryCompletedAt: undefined,
        errorLog: null,
        scheduleId: undefined,
      });

      const prismaData =
        NotificationDeliveryMapper.toPrismaUpdate(domainDelivery);

      expect(prismaData.tripId).toBeNull();
      expect(prismaData.deliveryCompletedAt).toBeNull();
      expect(prismaData.errors).toBeNull();
      expect(prismaData.scheduleId).toBeNull();
    });
  });
});
