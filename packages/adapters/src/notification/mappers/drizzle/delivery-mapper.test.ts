import { describe, it, expect } from "bun:test";
import { NotificationDeliveryDrizzleMapper } from "./delivery-mapper";
import type { NotificationDeliveryDTO } from "@mirai-app/use-cases";
import type { NotificationDeliverySelect } from "@mirai-app/frameworks/drizzle";

describe("[UNIT] NotificationDeliveryDrizzleMapper", () => {
  const mapper = NotificationDeliveryDrizzleMapper.instance;

  // Factory for creating mock Drizzle NotificationDelivery records
  const createMockDeliverySelect = (
    overrides: Partial<NotificationDeliverySelect> = {},
  ): NotificationDeliverySelect => ({
    id: "delivery-123",
    notificationId: "notification-456",
    tripId: "trip-789",
    scheduleId: null,
    status: "success",
    totalRecipients: 100,
    successCount: 95,
    failureCount: 5,
    deliveryStartedAt: new Date("2024-01-15T10:00:00Z"),
    deliveryCompletedAt: new Date("2024-01-15T10:05:00Z"),
    errors: null,
    createdAt: new Date("2024-01-15T10:00:00Z"),
    updatedAt: new Date("2024-01-15T10:05:00Z"),
    ...overrides,
  });

  // Factory for creating mock DTOs
  const createMockDeliveryDTO = (
    overrides: Partial<NotificationDeliveryDTO> = {},
  ): NotificationDeliveryDTO => ({
    id: "delivery-123",
    notificationId: "notification-456",
    userId: "trip-789",
    channel: "push",
    status: "success",
    sentAt: new Date("2024-01-15T10:00:00Z"),
    deliveredAt: new Date("2024-01-15T10:05:00Z"),
    failedAt: null,
    failureReason: null,
    retryCount: 0,
    ...overrides,
  });

  describe("toDTO", () => {
    it("converts Drizzle record to NotificationDeliveryDTO", () => {
      const record = createMockDeliverySelect();

      const dto = mapper.toDTO(record);

      expect(dto.id).toBe("delivery-123");
      expect(dto.notificationId).toBe("notification-456");
      expect(dto.userId).toBe("trip-789");
      expect(dto.channel).toBe("push");
      expect(dto.status).toBe("success");
      expect(dto.sentAt).toEqual(new Date("2024-01-15T10:00:00Z"));
      expect(dto.deliveredAt).toEqual(new Date("2024-01-15T10:05:00Z"));
      expect(dto.failedAt).toBeNull();
      expect(dto.failureReason).toBeNull();
      expect(dto.retryCount).toBe(0);
    });

    it("handles null tripId by returning empty string for userId", () => {
      const record = createMockDeliverySelect({ tripId: null });

      const dto = mapper.toDTO(record);

      expect(dto.userId).toBe("");
    });

    it("sets failedAt when status is failure", () => {
      const failedAt = new Date("2024-01-15T10:05:00Z");
      const record = createMockDeliverySelect({
        status: "failure",
        deliveryStartedAt: new Date("2024-01-15T10:00:00Z"),
        deliveryCompletedAt: failedAt,
      });

      const dto = mapper.toDTO(record);

      expect(dto.status).toBe("failure");
      expect(dto.failedAt).toEqual(failedAt);
      // Note: deliveredAt comes from deliveryCompletedAt regardless of status
      expect(dto.deliveredAt).toEqual(failedAt);
    });

    it("maps failure status correctly", () => {
      const record = createMockDeliverySelect({
        status: "failure",
        errors: "Network timeout",
      });

      const dto = mapper.toDTO(record);

      expect(dto.status).toBe("failure");
      expect(dto.failureReason).toBe("Network timeout");
    });

    it("maps pending status correctly", () => {
      const record = createMockDeliverySelect({
        status: "pending",
        deliveryStartedAt: null,
        deliveryCompletedAt: null,
      });

      const dto = mapper.toDTO(record);

      expect(dto.status).toBe("pending");
      expect(dto.sentAt).toBeNull();
      expect(dto.deliveredAt).toBeNull();
    });

    it("maps partial_failure status correctly", () => {
      const record = createMockDeliverySelect({
        status: "partial_failure",
        errors: "Some deliveries failed",
      });

      const dto = mapper.toDTO(record);

      expect(dto.status).toBe("partial_failure");
      expect(dto.failureReason).toBe("Some deliveries failed");
    });

    it("handles null delivery dates", () => {
      const record = createMockDeliverySelect({
        deliveryStartedAt: null,
        deliveryCompletedAt: null,
      });

      const dto = mapper.toDTO(record);

      expect(dto.sentAt).toBeNull();
      expect(dto.deliveredAt).toBeNull();
    });
  });

  describe("toDomain", () => {
    it("delegates to toDTO", () => {
      const record = createMockDeliverySelect();

      const domainResult = mapper.toDomain(record);
      const dtoResult = mapper.toDTO(record);

      expect(domainResult).toEqual(dtoResult);
    });
  });

  describe("toDrizzleInsert", () => {
    it("converts NotificationDeliveryDTO to Drizzle insert input", () => {
      const dto = createMockDeliveryDTO();

      const insert = mapper.toDrizzleInsert(dto);

      expect(insert.id).toBe("delivery-123");
      expect(insert.notificationId).toBe("notification-456");
      expect(insert.tripId).toBe("trip-789");
      expect(insert.status).toBe("success");
      expect(insert.totalRecipients).toBe(1);
      expect(insert.successCount).toBe(1);
      expect(insert.failureCount).toBe(0);
      expect(insert.deliveryStartedAt).toEqual(
        new Date("2024-01-15T10:00:00Z"),
      );
      expect(insert.deliveryCompletedAt).toEqual(
        new Date("2024-01-15T10:05:00Z"),
      );
      expect(insert.errors).toBeNull();
      expect(insert.scheduleId).toBeNull();
      expect(insert.createdAt).toBeInstanceOf(Date);
      expect(insert.updatedAt).toBeInstanceOf(Date);
    });

    it("handles null userId by setting tripId to null", () => {
      const dto = createMockDeliveryDTO({ userId: "" });

      const insert = mapper.toDrizzleInsert(dto);

      expect(insert.tripId).toBeNull();
    });

    it("sets successCount to 1 and failureCount to 0 for success status", () => {
      const dto = createMockDeliveryDTO({ status: "success" });

      const insert = mapper.toDrizzleInsert(dto);

      expect(insert.successCount).toBe(1);
      expect(insert.failureCount).toBe(0);
    });

    it("sets successCount to 0 and failureCount to 1 for failure status", () => {
      const dto = createMockDeliveryDTO({
        status: "failure",
        failedAt: new Date("2024-01-15T10:05:00Z"),
        deliveredAt: null,
      });

      const insert = mapper.toDrizzleInsert(dto);

      expect(insert.successCount).toBe(0);
      expect(insert.failureCount).toBe(1);
    });

    it("sets both counts to 0 for pending status", () => {
      const dto = createMockDeliveryDTO({
        status: "pending",
        deliveredAt: null,
        failedAt: null,
      });

      const insert = mapper.toDrizzleInsert(dto);

      expect(insert.successCount).toBe(0);
      expect(insert.failureCount).toBe(0);
    });

    it("uses deliveredAt for deliveryCompletedAt when available", () => {
      const deliveredAt = new Date("2024-01-15T10:05:00Z");
      const dto = createMockDeliveryDTO({
        deliveredAt,
        failedAt: null,
      });

      const insert = mapper.toDrizzleInsert(dto);

      expect(insert.deliveryCompletedAt).toEqual(deliveredAt);
    });

    it("uses failedAt for deliveryCompletedAt when deliveredAt is null", () => {
      const failedAt = new Date("2024-01-15T10:05:00Z");
      const dto = createMockDeliveryDTO({
        deliveredAt: null,
        failedAt,
      });

      const insert = mapper.toDrizzleInsert(dto);

      expect(insert.deliveryCompletedAt).toEqual(failedAt);
    });

    it("sets errors from failureReason", () => {
      const dto = createMockDeliveryDTO({ failureReason: "Connection error" });

      const insert = mapper.toDrizzleInsert(dto);

      expect(insert.errors).toBe("Connection error");
    });

    it("sets createdAt and updatedAt to current time", () => {
      const dto = createMockDeliveryDTO();
      const beforeInsert = new Date();

      const insert = mapper.toDrizzleInsert(dto);

      const afterInsert = new Date();
      expect(insert.createdAt).toBeInstanceOf(Date);
      expect(insert.updatedAt).toBeInstanceOf(Date);
      expect(insert.createdAt!.getTime()).toBeGreaterThanOrEqual(
        beforeInsert.getTime(),
      );
      expect(insert.updatedAt!.getTime()).toBeLessThanOrEqual(
        afterInsert.getTime(),
      );
    });
  });

  describe("toDrizzleUpdate", () => {
    it("converts NotificationDeliveryDTO to Drizzle update input", () => {
      const dto = createMockDeliveryDTO();

      const update = mapper.toDrizzleUpdate(dto);

      // Should not include id
      expect(update).not.toHaveProperty("id");

      // Should include status
      expect(update.status).toBe("success");

      // Should include deliveryCompletedAt
      expect(update.deliveryCompletedAt).toEqual(
        new Date("2024-01-15T10:05:00Z"),
      );

      // Should include errors
      expect(update.errors).toBeNull();
    });

    it("uses failedAt when deliveredAt is null", () => {
      const failedAt = new Date("2024-01-15T10:10:00Z");
      const dto = createMockDeliveryDTO({
        deliveredAt: null,
        failedAt,
        status: "failure",
      });

      const update = mapper.toDrizzleUpdate(dto);

      expect(update.deliveryCompletedAt).toEqual(failedAt);
      expect(update.status).toBe("failure");
    });

    it("sets errors from failureReason", () => {
      const dto = createMockDeliveryDTO({
        failureReason: "Push service unavailable",
        status: "failure",
      });

      const update = mapper.toDrizzleUpdate(dto);

      expect(update.errors).toBe("Push service unavailable");
    });

    it("updates updatedAt to current time", () => {
      const dto = createMockDeliveryDTO();
      const beforeUpdate = new Date();

      const update = mapper.toDrizzleUpdate(dto);

      const afterUpdate = new Date();
      expect(update.updatedAt).toBeInstanceOf(Date);
      expect(update.updatedAt!.getTime()).toBeGreaterThanOrEqual(
        beforeUpdate.getTime(),
      );
      expect(update.updatedAt!.getTime()).toBeLessThanOrEqual(
        afterUpdate.getTime(),
      );
    });

    it("handles null deliveredAt and failedAt", () => {
      const dto = createMockDeliveryDTO({
        deliveredAt: null,
        failedAt: null,
      });

      const update = mapper.toDrizzleUpdate(dto);

      expect(update.deliveryCompletedAt).toBeNull();
    });
  });

  describe("fromPartial", () => {
    it("creates partial DTO from Drizzle record with all fields", () => {
      const partial = mapper.fromPartial({
        id: "delivery-123",
        notificationId: "notification-456",
        tripId: "trip-789",
        status: "success",
        deliveryStartedAt: new Date("2024-01-15T10:00:00Z"),
        deliveryCompletedAt: new Date("2024-01-15T10:05:00Z"),
        errors: null,
      });

      expect(partial.id).toBe("delivery-123");
      expect(partial.notificationId).toBe("notification-456");
      expect(partial.userId).toBe("trip-789");
      expect(partial.status).toBe("success");
      expect(partial.sentAt).toEqual(new Date("2024-01-15T10:00:00Z"));
      expect(partial.deliveredAt).toEqual(new Date("2024-01-15T10:05:00Z"));
      expect(partial.failureReason).toBeNull();
    });

    it("creates partial DTO with only provided fields", () => {
      const partial = mapper.fromPartial({
        id: "delivery-123",
        status: "failure",
      });

      expect(partial.id).toBe("delivery-123");
      expect(partial.status).toBe("failure");
      expect(partial.notificationId).toBeUndefined();
      expect(partial.userId).toBeUndefined();
    });

    it("handles undefined tripId", () => {
      const partial = mapper.fromPartial({
        id: "delivery-123",
        tripId: undefined,
      });

      expect(partial.userId).toBeUndefined();
    });

    it("handles undefined delivery dates", () => {
      const partial = mapper.fromPartial({
        id: "delivery-123",
        deliveryStartedAt: undefined,
        deliveryCompletedAt: undefined,
      });

      expect(partial.sentAt).toBeUndefined();
      expect(partial.deliveredAt).toBeUndefined();
    });

    it("returns empty object when no fields provided", () => {
      const partial = mapper.fromPartial({});

      expect(Object.keys(partial)).toHaveLength(0);
    });
  });

  describe("singleton instance", () => {
    it("returns the same instance", () => {
      const instance1 = NotificationDeliveryDrizzleMapper.instance;
      const instance2 = NotificationDeliveryDrizzleMapper.instance;

      expect(instance1).toBe(instance2);
    });
  });
});

/**
 * Summary
 *
 * This test suite covers the NotificationDeliveryDrizzleMapper which handles
 * bidirectional mapping between Drizzle database records and NotificationDeliveryDTOs.
 *
 * Test Coverage:
 * - toDTO: Converts Drizzle records to DTOs, handling all status types (success,
 *   failure, pending, partial_failure), null dates, and null tripId
 * - toDomain: Delegates to toDTO
 * - toDrizzleInsert: Converts DTOs to insert format with correct status mapping,
 *   recipient counts, and timestamp generation
 * - toDrizzleUpdate: Converts DTOs to update format with status, completion date,
 *   errors, and automatic updatedAt timestamp
 * - fromPartial: Creates partial DTOs from partial records with selective field mapping
 * - Singleton instance: Verifies proper singleton pattern implementation
 *
 * Key Implementation Details:
 * - Channel is always "push" for notification deliveries
 * - retryCount is always 0 in the current implementation
 * - Status determines successCount/failureCount in insert operations
 * - deliveryCompletedAt uses deliveredAt first, then failedAt as fallback
 * - tripId maps to userId (with empty string fallback for null)
 */
