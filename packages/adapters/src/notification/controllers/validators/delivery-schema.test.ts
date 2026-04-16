import { describe, it, expect } from "bun:test";
import {
  validateGetDeliveriesInput,
  validateGetDeliveryByNotificationIdInput,
  validateGetDeliveryStatsInput,
  validateGetFailedDeliveriesInput,
} from "./delivery-schema";

describe("[UNIT] Notification Delivery Validators", () => {
  const validUUID = "550e8400-e29b-41d4-a716-446655440000";
  const validTripId = "550e8400-e29b-41d4-a716-446655440001";
  const validNotificationId = "550e8400-e29b-41d4-a716-446655440002";

  describe("validateGetDeliveriesInput", () => {
    it("should validate minimal valid input with tripId only", () => {
      const input = { tripId: validTripId };
      const result = validateGetDeliveriesInput(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tripId).toBe(validTripId);
      }
    });

    it("should validate with status filter", () => {
      const input = {
        tripId: validTripId,
        status: "pending" as const,
      };
      const result = validateGetDeliveriesInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with success status", () => {
      const input = {
        tripId: validTripId,
        status: "success" as const,
      };
      const result = validateGetDeliveriesInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with partial_failure status", () => {
      const input = {
        tripId: validTripId,
        status: "partial_failure" as const,
      };
      const result = validateGetDeliveriesInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with failure status", () => {
      const input = {
        tripId: validTripId,
        status: "failure" as const,
      };
      const result = validateGetDeliveriesInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with scheduleId", () => {
      const input = {
        tripId: validTripId,
        scheduleId: "schedule-123",
      };
      const result = validateGetDeliveriesInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with pagination", () => {
      const input = {
        tripId: validTripId,
        limit: 50,
        offset: 10,
      };
      const result = validateGetDeliveriesInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with limit = 1 (minimum)", () => {
      const input = {
        tripId: validTripId,
        limit: 1,
      };
      const result = validateGetDeliveriesInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with limit = 100 (maximum)", () => {
      const input = {
        tripId: validTripId,
        limit: 100,
      };
      const result = validateGetDeliveriesInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with offset = 0 (minimum)", () => {
      const input = {
        tripId: validTripId,
        offset: 0,
      };
      const result = validateGetDeliveriesInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with all optional fields", () => {
      const input = {
        tripId: validTripId,
        status: "success" as const,
        scheduleId: "schedule-456",
        limit: 25,
        offset: 5,
      };
      const result = validateGetDeliveriesInput(input);
      expect(result.success).toBe(true);
    });

    it("should reject invalid tripId format", () => {
      const input = { tripId: "invalid-trip-id" };
      const result = validateGetDeliveriesInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject invalid status", () => {
      const input = {
        tripId: validTripId,
        status: "invalid_status",
      };
      const result = validateGetDeliveriesInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject limit = 0", () => {
      const input = {
        tripId: validTripId,
        limit: 0,
      };
      const result = validateGetDeliveriesInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject limit > 100", () => {
      const input = {
        tripId: validTripId,
        limit: 101,
      };
      const result = validateGetDeliveriesInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject negative offset", () => {
      const input = {
        tripId: validTripId,
        offset: -1,
      };
      const result = validateGetDeliveriesInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing tripId", () => {
      const input = {};
      const result = validateGetDeliveriesInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject non-string tripId", () => {
      const input = { tripId: 123 };
      const result = validateGetDeliveriesInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validateGetDeliveryByNotificationIdInput", () => {
    it("should validate valid notification and trip IDs", () => {
      const input = {
        notificationId: validNotificationId,
        tripId: validTripId,
      };
      const result = validateGetDeliveryByNotificationIdInput(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.notificationId).toBe(validNotificationId);
        expect(result.data.tripId).toBe(validTripId);
      }
    });

    it("should reject invalid notificationId format", () => {
      const input = {
        notificationId: "invalid-id",
        tripId: validTripId,
      };
      const result = validateGetDeliveryByNotificationIdInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject invalid tripId format", () => {
      const input = {
        notificationId: validNotificationId,
        tripId: "invalid-trip",
      };
      const result = validateGetDeliveryByNotificationIdInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing notificationId", () => {
      const input = { tripId: validTripId };
      const result = validateGetDeliveryByNotificationIdInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing tripId", () => {
      const input = { notificationId: validNotificationId };
      const result = validateGetDeliveryByNotificationIdInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validateGetDeliveryStatsInput", () => {
    it("should validate minimal valid input with tripId only", () => {
      const input = { tripId: validTripId };
      const result = validateGetDeliveryStatsInput(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tripId).toBe(validTripId);
      }
    });

    it("should validate with scheduleId", () => {
      const input = {
        tripId: validTripId,
        scheduleId: "schedule-123",
      };
      const result = validateGetDeliveryStatsInput(input);
      expect(result.success).toBe(true);
    });

    it("should reject invalid tripId format", () => {
      const input = { tripId: "invalid-trip-id" };
      const result = validateGetDeliveryStatsInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing tripId", () => {
      const input = {};
      const result = validateGetDeliveryStatsInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validateGetFailedDeliveriesInput", () => {
    it("should validate minimal valid input with tripId only", () => {
      const input = { tripId: validTripId };
      const result = validateGetFailedDeliveriesInput(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tripId).toBe(validTripId);
      }
    });

    it("should validate with pagination", () => {
      const input = {
        tripId: validTripId,
        limit: 25,
        offset: 10,
      };
      const result = validateGetFailedDeliveriesInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with limit = 1 (minimum)", () => {
      const input = {
        tripId: validTripId,
        limit: 1,
      };
      const result = validateGetFailedDeliveriesInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with limit = 100 (maximum)", () => {
      const input = {
        tripId: validTripId,
        limit: 100,
      };
      const result = validateGetFailedDeliveriesInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with offset = 0 (minimum)", () => {
      const input = {
        tripId: validTripId,
        offset: 0,
      };
      const result = validateGetFailedDeliveriesInput(input);
      expect(result.success).toBe(true);
    });

    it("should reject invalid tripId format", () => {
      const input = { tripId: "invalid-trip-id" };
      const result = validateGetFailedDeliveriesInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject limit = 0", () => {
      const input = {
        tripId: validTripId,
        limit: 0,
      };
      const result = validateGetFailedDeliveriesInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject limit > 100", () => {
      const input = {
        tripId: validTripId,
        limit: 101,
      };
      const result = validateGetFailedDeliveriesInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject negative offset", () => {
      const input = {
        tripId: validTripId,
        offset: -1,
      };
      const result = validateGetFailedDeliveriesInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing tripId", () => {
      const input = {};
      const result = validateGetFailedDeliveriesInput(input);
      expect(result.success).toBe(false);
    });
  });
});

/*
 * Summary
 *
 * Tests cover:
 * - validateGetDeliveriesInput: comprehensive validation including:
 *   - Required: tripId (UUID)
 *   - Optional: status (pending/success/partial_failure/failure), scheduleId (string),
 *               limit (1-100), offset (>=0)
 * - validateGetDeliveryByNotificationIdInput: notificationId (UUID) + tripId (UUID)
 * - validateGetDeliveryStatsInput: tripId (UUID) + optional scheduleId
 * - validateGetFailedDeliveriesInput: tripId (UUID) + optional pagination
 *
 * All validators tested with:
 * - Valid inputs (success cases)
 * - Invalid UUID formats (error cases)
 * - Boundary values for pagination (limit: 1-100, offset: >=0)
 * - Literal type validation for status enum
 * - Missing required vs optional fields
 */
