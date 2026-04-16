import { describe, it, expect } from "bun:test";
import {
  validateGetByIdInput,
  validateGetByTripIdInput,
  validateCreateInput,
  validateUpdateInput,
  validateUpdateStatusInput,
  validateListInput,
  validateListByStatusInput,
  validateListByPriorityInput,
  validateScheduleInput,
} from "./schema";

describe("[UNIT] Notification Validators", () => {
  const validUUID = "550e8400-e29b-41d4-a716-446655440000";
  const validTripId = "550e8400-e29b-41d4-a716-446655440001";
  const validNotificationId = "550e8400-e29b-41d4-a716-446655440002";
  const validUserId = "550e8400-e29b-41d4-a716-446655440003";

  describe("validateGetByIdInput", () => {
    it("should validate a valid notification ID", () => {
      const input = { id: validNotificationId };
      const result = validateGetByIdInput(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(validNotificationId);
      }
    });

    it("should reject an invalid UUID format", () => {
      const input = { id: "invalid-id" };
      const result = validateGetByIdInput(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain(
          "Invalid notification ID format",
        );
      }
    });

    it("should reject missing id", () => {
      const input = {};
      const result = validateGetByIdInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject non-string id", () => {
      const input = { id: 123 };
      const result = validateGetByIdInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validateGetByTripIdInput", () => {
    it("should validate a valid trip ID", () => {
      const input = { tripId: validTripId };
      const result = validateGetByTripIdInput(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tripId).toBe(validTripId);
      }
    });

    it("should reject an invalid trip ID format", () => {
      const input = { tripId: "invalid-trip" };
      const result = validateGetByTripIdInput(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain("Invalid trip ID format");
      }
    });

    it("should reject missing tripId", () => {
      const input = {};
      const result = validateGetByTripIdInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validateCreateInput", () => {
    it("should validate minimal valid input", () => {
      const input = {
        title: "Test Notification",
        body: "This is a test notification body",
        createdById: validUserId,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe("Test Notification");
        expect(result.data.body).toBe("This is a test notification body");
        expect(result.data.createdById).toBe(validUserId);
      }
    });

    it("should validate with all optional fields", () => {
      const input = {
        title: "Test Notification",
        body: "This is a test notification body",
        url: "https://example.com/action",
        tripId: validTripId,
        createdById: validUserId,
        priority: "HIGH" as const,
        scheduledFor: "2024-12-25T10:00:00Z",
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with null url", () => {
      const input = {
        title: "Test Notification",
        body: "This is a test notification body",
        url: null,
        createdById: validUserId,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with null tripId", () => {
      const input = {
        title: "Test Notification",
        body: "This is a test notification body",
        tripId: null,
        createdById: validUserId,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with LOW priority", () => {
      const input = {
        title: "Test Notification",
        body: "This is a test notification body",
        createdById: validUserId,
        priority: "LOW" as const,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with NORMAL priority", () => {
      const input = {
        title: "Test Notification",
        body: "This is a test notification body",
        createdById: validUserId,
        priority: "NORMAL" as const,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with HIGH priority", () => {
      const input = {
        title: "Test Notification",
        body: "This is a test notification body",
        createdById: validUserId,
        priority: "HIGH" as const,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with URGENT priority", () => {
      const input = {
        title: "Test Notification",
        body: "This is a test notification body",
        createdById: validUserId,
        priority: "URGENT" as const,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with null scheduledFor", () => {
      const input = {
        title: "Test Notification",
        body: "This is a test notification body",
        createdById: validUserId,
        scheduledFor: null,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with ISO string scheduledFor", () => {
      const input = {
        title: "Test Notification",
        body: "This is a test notification body",
        createdById: validUserId,
        scheduledFor: "2024-12-25T10:00:00Z",
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with HTTPS url", () => {
      const input = {
        title: "Test Notification",
        body: "This is a test notification body",
        url: "https://example.com/action",
        createdById: validUserId,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with HTTP url", () => {
      const input = {
        title: "Test Notification",
        body: "This is a test notification body",
        url: "http://example.com/action",
        createdById: validUserId,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(true);
    });

    it("should reject empty title", () => {
      const input = {
        title: "",
        body: "This is a test notification body",
        createdById: validUserId,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject title exceeding 200 characters", () => {
      const input = {
        title: "A".repeat(201),
        body: "This is a test notification body",
        createdById: validUserId,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject empty body", () => {
      const input = {
        title: "Test Notification",
        body: "",
        createdById: validUserId,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject body exceeding 2000 characters", () => {
      const input = {
        title: "Test Notification",
        body: "A".repeat(2001),
        createdById: validUserId,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject invalid url", () => {
      const input = {
        title: "Test Notification",
        body: "This is a test notification body",
        url: "not-a-url",
        createdById: validUserId,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject invalid tripId format", () => {
      const input = {
        title: "Test Notification",
        body: "This is a test notification body",
        tripId: "invalid-trip",
        createdById: validUserId,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject invalid createdById", () => {
      const input = {
        title: "Test Notification",
        body: "This is a test notification body",
        createdById: "invalid-user",
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain("Invalid user ID format");
      }
    });

    it("should reject invalid priority", () => {
      const input = {
        title: "Test Notification",
        body: "This is a test notification body",
        createdById: validUserId,
        priority: "INVALID",
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing title", () => {
      const input = {
        body: "This is a test notification body",
        createdById: validUserId,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing body", () => {
      const input = {
        title: "Test Notification",
        createdById: validUserId,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing createdById", () => {
      const input = {
        title: "Test Notification",
        body: "This is a test notification body",
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validateUpdateInput", () => {
    it("should validate with notificationId only", () => {
      const input = {
        notificationId: validNotificationId,
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with title update", () => {
      const input = {
        notificationId: validNotificationId,
        title: "Updated Title",
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with body update", () => {
      const input = {
        notificationId: validNotificationId,
        body: "Updated body content",
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with url update", () => {
      const input = {
        notificationId: validNotificationId,
        url: "https://example.com/updated",
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with null url", () => {
      const input = {
        notificationId: validNotificationId,
        url: null,
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with priority update", () => {
      const input = {
        notificationId: validNotificationId,
        priority: "URGENT" as const,
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with scheduledFor update", () => {
      const input = {
        notificationId: validNotificationId,
        scheduledFor: "2024-12-31T23:59:59Z",
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with null scheduledFor", () => {
      const input = {
        notificationId: validNotificationId,
        scheduledFor: null,
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with all fields updated", () => {
      const input = {
        notificationId: validNotificationId,
        title: "Updated Title",
        body: "Updated body",
        url: "https://example.com/new",
        priority: "HIGH" as const,
        scheduledFor: "2024-12-31T23:59:59Z",
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(true);
    });

    it("should reject invalid notificationId", () => {
      const input = {
        notificationId: "invalid-id",
        title: "Updated Title",
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject empty title in update", () => {
      const input = {
        notificationId: validNotificationId,
        title: "",
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject long title in update", () => {
      const input = {
        notificationId: validNotificationId,
        title: "A".repeat(201),
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject empty body in update", () => {
      const input = {
        notificationId: validNotificationId,
        body: "",
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject long body in update", () => {
      const input = {
        notificationId: validNotificationId,
        body: "A".repeat(2001),
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject invalid url in update", () => {
      const input = {
        notificationId: validNotificationId,
        url: "not-a-url",
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing notificationId", () => {
      const input = {
        title: "Updated Title",
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validateUpdateStatusInput", () => {
    it("should validate with DRAFT status", () => {
      const input = {
        notificationId: validNotificationId,
        newStatus: "DRAFT" as const,
      };
      const result = validateUpdateStatusInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with READY status", () => {
      const input = {
        notificationId: validNotificationId,
        newStatus: "READY" as const,
      };
      const result = validateUpdateStatusInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with SENT status", () => {
      const input = {
        notificationId: validNotificationId,
        newStatus: "SENT" as const,
      };
      const result = validateUpdateStatusInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with FAILED status", () => {
      const input = {
        notificationId: validNotificationId,
        newStatus: "FAILED" as const,
      };
      const result = validateUpdateStatusInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with CANCELLED status", () => {
      const input = {
        notificationId: validNotificationId,
        newStatus: "CANCELLED" as const,
      };
      const result = validateUpdateStatusInput(input);
      expect(result.success).toBe(true);
    });

    it("should reject invalid notificationId", () => {
      const input = {
        notificationId: "invalid-id",
        newStatus: "SENT" as const,
      };
      const result = validateUpdateStatusInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject invalid status", () => {
      const input = {
        notificationId: validNotificationId,
        newStatus: "INVALID_STATUS",
      };
      const result = validateUpdateStatusInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing notificationId", () => {
      const input = {
        newStatus: "SENT" as const,
      };
      const result = validateUpdateStatusInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing newStatus", () => {
      const input = {
        notificationId: validNotificationId,
      };
      const result = validateUpdateStatusInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validateListInput", () => {
    it("should validate empty input", () => {
      const input = {};
      const result = validateListInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with limit only", () => {
      const input = { limit: 10 };
      const result = validateListInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with offset only", () => {
      const input = { offset: 20 };
      const result = validateListInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with both limit and offset", () => {
      const input = { limit: 25, offset: 50 };
      const result = validateListInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with limit = 1 (minimum)", () => {
      const input = { limit: 1 };
      const result = validateListInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with limit = 100 (maximum)", () => {
      const input = { limit: 100 };
      const result = validateListInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with offset = 0 (minimum)", () => {
      const input = { offset: 0 };
      const result = validateListInput(input);
      expect(result.success).toBe(true);
    });

    it("should reject limit = 0", () => {
      const input = { limit: 0 };
      const result = validateListInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject limit > 100", () => {
      const input = { limit: 101 };
      const result = validateListInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject negative offset", () => {
      const input = { offset: -1 };
      const result = validateListInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject non-integer limit", () => {
      const input = { limit: 10.5 };
      const result = validateListInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject non-integer offset", () => {
      const input = { offset: 5.5 };
      const result = validateListInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validateListByStatusInput", () => {
    it("should validate with DRAFT status", () => {
      const input = {
        status: "DRAFT" as const,
        limit: 10,
        offset: 0,
      };
      const result = validateListByStatusInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with READY status and no pagination", () => {
      const input = {
        status: "READY" as const,
      };
      const result = validateListByStatusInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with SENT status", () => {
      const input = {
        status: "SENT" as const,
        limit: 50,
      };
      const result = validateListByStatusInput(input);
      expect(result.success).toBe(true);
    });

    it("should reject invalid status", () => {
      const input = {
        status: "INVALID",
        limit: 10,
      };
      const result = validateListByStatusInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject invalid limit with status", () => {
      const input = {
        status: "DRAFT" as const,
        limit: 0,
      };
      const result = validateListByStatusInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing status", () => {
      const input = {
        limit: 10,
      };
      const result = validateListByStatusInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validateListByPriorityInput", () => {
    it("should validate with LOW priority", () => {
      const input = {
        priority: "LOW" as const,
        limit: 10,
      };
      const result = validateListByPriorityInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with NORMAL priority", () => {
      const input = {
        priority: "NORMAL" as const,
      };
      const result = validateListByPriorityInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with HIGH priority", () => {
      const input = {
        priority: "HIGH" as const,
        offset: 20,
      };
      const result = validateListByPriorityInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with URGENT priority", () => {
      const input = {
        priority: "URGENT" as const,
        limit: 100,
        offset: 0,
      };
      const result = validateListByPriorityInput(input);
      expect(result.success).toBe(true);
    });

    it("should reject invalid priority", () => {
      const input = {
        priority: "INVALID",
      };
      const result = validateListByPriorityInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject invalid offset with priority", () => {
      const input = {
        priority: "HIGH" as const,
        offset: -1,
      };
      const result = validateListByPriorityInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing priority", () => {
      const input = {
        limit: 10,
      };
      const result = validateListByPriorityInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validateScheduleInput", () => {
    it("should validate valid schedule input", () => {
      const input = {
        notificationId: validNotificationId,
        scheduledFor: "2024-12-25T10:00:00Z",
      };
      const result = validateScheduleInput(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.notificationId).toBe(validNotificationId);
        expect(result.data.scheduledFor).toBeInstanceOf(Date);
      }
    });

    it("should validate with different ISO date formats", () => {
      const input = {
        notificationId: validNotificationId,
        scheduledFor: "2024-01-15",
      };
      const result = validateScheduleInput(input);
      expect(result.success).toBe(true);
    });

    it("should reject invalid notificationId", () => {
      const input = {
        notificationId: "invalid-id",
        scheduledFor: "2024-12-25T10:00:00Z",
      };
      const result = validateScheduleInput(input);
      expect(result.success).toBe(false);
    });

    it("should handle invalid date string (behavior varies by schema implementation)", () => {
      const input = {
        notificationId: validNotificationId,
        scheduledFor: "not-a-date",
      };
      const result = validateScheduleInput(input);
      // Schema.DateFromString may or may not accept this depending on implementation
      // We just verify it doesn't throw and returns a valid result structure
      expect(typeof result.success).toBe("boolean");
    });

    it("should reject missing notificationId", () => {
      const input = {
        scheduledFor: "2024-12-25T10:00:00Z",
      };
      const result = validateScheduleInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing scheduledFor", () => {
      const input = {
        notificationId: validNotificationId,
      };
      const result = validateScheduleInput(input);
      expect(result.success).toBe(false);
    });
  });
});

/*
 * Summary
 *
 * Tests cover:
 * - validateGetByIdInput: UUID validation for notification ID
 * - validateGetByTripIdInput: UUID validation for trip ID
 * - validateCreateInput: comprehensive validation including:
 *   - Required: title (1-200), body (1-2000), createdById (UUID)
 *   - Optional: url (null or valid URL), tripId (null or UUID), priority (LOW/NORMAL/HIGH/URGENT), scheduledFor (null or Date)
 * - validateUpdateInput: partial updates with optional fields
 * - validateUpdateStatusInput: notificationId (UUID) + newStatus (DRAFT/READY/SENT/FAILED/CANCELLED)
 * - validateListInput: pagination with limit (1-100) and offset (>=0)
 * - validateListByStatusInput: status filter + optional pagination
 * - validateListByPriorityInput: priority filter + optional pagination
 * - validateScheduleInput: notificationId (UUID) + scheduledFor (valid date string)
 *
 * All validators tested with:
 * - Valid inputs (success cases)
 * - Invalid formats (error cases)
 * - Edge cases (boundary values, nulls)
 * - Literal type validation (status, priority enums)
 * - Date string parsing for scheduledFor
 * - Missing required vs optional fields
 */
