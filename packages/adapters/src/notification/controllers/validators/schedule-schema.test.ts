import { describe, it, expect } from "bun:test";
import {
  validateGetAllInput,
  validateGetByIdInput,
  validateGetUpcomingInput,
  validateCreateInput,
  validateUpdateInput,
  validateDeleteInput,
  validateBulkDeleteInput,
  validateToggleActiveInput,
  validateBulkToggleActiveInput,
  validateDuplicateInput,
  validateUpdateLastRunInput,
  validateGetExecutionHistoryInput,
} from "./schedule-schema";
import { NotificationScheduleType } from "@mirai-app/domain";

describe("[UNIT] Notification Schedule Validators", () => {
  const validUUID = "550e8400-e29b-41d4-a716-446655440000";
  const validTripId = "550e8400-e29b-41d4-a716-446655440001";
  const validUserId = "550e8400-e29b-41d4-a716-446655440002";

  describe("validateGetAllInput", () => {
    it("should validate empty input", () => {
      const input = {};
      const result = validateGetAllInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with pagination only", () => {
      const input = {
        pagination: {
          limit: 20,
          offset: 0,
        },
      };
      const result = validateGetAllInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with filter only", () => {
      const input = {
        filter: {
          tripId: validTripId,
        },
      };
      const result = validateGetAllInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with complete filter", () => {
      const input = {
        filter: {
          tripId: validTripId,
          notificationType: NotificationScheduleType.INFO,
          isActive: true,
          startDateFrom: "2024-01-01",
          startDateTo: "2024-12-31",
          search: "daily",
        },
      };
      const result = validateGetAllInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with pagination and filter", () => {
      const input = {
        pagination: {
          limit: 50,
          offset: 10,
        },
        filter: {
          tripId: null,
          notificationType: NotificationScheduleType.CHALLENGE,
          isActive: false,
        },
      };
      const result = validateGetAllInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with limit = 1 (minimum)", () => {
      const input = {
        pagination: { limit: 1 },
      };
      const result = validateGetAllInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with limit = 100 (maximum)", () => {
      const input = {
        pagination: { limit: 100 },
      };
      const result = validateGetAllInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with offset = 0 (minimum)", () => {
      const input = {
        pagination: { offset: 0 },
      };
      const result = validateGetAllInput(input);
      expect(result.success).toBe(true);
    });

    it("should reject invalid pagination limit", () => {
      const input = {
        pagination: { limit: 0 },
      };
      const result = validateGetAllInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject pagination limit > 100", () => {
      const input = {
        pagination: { limit: 101 },
      };
      const result = validateGetAllInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject negative pagination offset", () => {
      const input = {
        pagination: { offset: -1 },
      };
      const result = validateGetAllInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject non-integer pagination limit", () => {
      const input = {
        pagination: { limit: 10.5 },
      };
      const result = validateGetAllInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validateGetByIdInput", () => {
    it("should validate a valid UUID", () => {
      const input = { id: validUUID };
      const result = validateGetByIdInput(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(validUUID);
      }
    });

    it("should reject an invalid UUID format", () => {
      const input = { id: "invalid-id" };
      const result = validateGetByIdInput(input);
      expect(result.success).toBe(false);
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

  describe("validateGetUpcomingInput", () => {
    it("should validate empty input", () => {
      const input = {};
      const result = validateGetUpcomingInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with days = 1 (minimum)", () => {
      const input = { days: 1 };
      const result = validateGetUpcomingInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with days = 30 (maximum)", () => {
      const input = { days: 30 };
      const result = validateGetUpcomingInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with days = 7", () => {
      const input = { days: 7 };
      const result = validateGetUpcomingInput(input);
      expect(result.success).toBe(true);
    });

    it("should reject days = 0", () => {
      const input = { days: 0 };
      const result = validateGetUpcomingInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject days > 30", () => {
      const input = { days: 31 };
      const result = validateGetUpcomingInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject negative days", () => {
      const input = { days: -1 };
      const result = validateGetUpcomingInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject non-integer days", () => {
      const input = { days: 7.5 };
      const result = validateGetUpcomingInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validateCreateInput", () => {
    it("should validate minimal valid input", () => {
      const input = {
        name: "Daily Notification",
        notificationType: NotificationScheduleType.DAILY_RANKING,
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        hour: 9,
        minute: 0,
        createdById: validUserId,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with tripId", () => {
      const input = {
        name: "Trip Notification",
        tripId: validTripId,
        notificationType: NotificationScheduleType.INFO,
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        hour: 10,
        minute: 30,
        createdById: validUserId,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with null tripId", () => {
      const input = {
        name: "Global Notification",
        tripId: null,
        notificationType: NotificationScheduleType.ANNOUNCEMENT,
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        hour: 14,
        minute: 0,
        createdById: validUserId,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with notification details", () => {
      const input = {
        name: "Detailed Notification",
        notificationType: NotificationScheduleType.CHALLENGE,
        notificationTitle: "Challenge Started",
        notificationBody: "A new challenge has started!",
        notificationUrl: "https://example.com/challenge",
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        hour: 8,
        minute: 0,
        isActive: true,
        createdById: validUserId,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with null notification fields", () => {
      const input = {
        name: "Minimal Notification",
        notificationType: NotificationScheduleType.REMINDER,
        notificationTitle: null,
        notificationBody: null,
        notificationUrl: null,
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        hour: 12,
        minute: 0,
        createdById: validUserId,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate hour = 0 (minimum)", () => {
      const input = {
        name: "Early Morning",
        notificationType: NotificationScheduleType.INFO,
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        hour: 0,
        minute: 0,
        createdById: validUserId,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate hour = 23 (maximum)", () => {
      const input = {
        name: "Late Night",
        notificationType: NotificationScheduleType.INFO,
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        hour: 23,
        minute: 59,
        createdById: validUserId,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate minute = 0 (minimum)", () => {
      const input = {
        name: "On the Hour",
        notificationType: NotificationScheduleType.INFO,
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        hour: 9,
        minute: 0,
        createdById: validUserId,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate minute = 59 (maximum)", () => {
      const input = {
        name: "Just Before Hour",
        notificationType: NotificationScheduleType.INFO,
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        hour: 9,
        minute: 59,
        createdById: validUserId,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(true);
    });

    it("should reject empty name", () => {
      const input = {
        name: "",
        notificationType: NotificationScheduleType.INFO,
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        hour: 9,
        minute: 0,
        createdById: validUserId,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject name exceeding 100 characters", () => {
      const input = {
        name: "A".repeat(101),
        notificationType: NotificationScheduleType.INFO,
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        hour: 9,
        minute: 0,
        createdById: validUserId,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject invalid notificationType", () => {
      const input = {
        name: "Invalid Type",
        notificationType: "INVALID_TYPE",
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        hour: 9,
        minute: 0,
        createdById: validUserId,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject invalid hour (> 23)", () => {
      const input = {
        name: "Too Late",
        notificationType: NotificationScheduleType.INFO,
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        hour: 24,
        minute: 0,
        createdById: validUserId,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject invalid minute (> 59)", () => {
      const input = {
        name: "Too Many Minutes",
        notificationType: NotificationScheduleType.INFO,
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        hour: 9,
        minute: 60,
        createdById: validUserId,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject negative hour", () => {
      const input = {
        name: "Negative Hour",
        notificationType: NotificationScheduleType.INFO,
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        hour: -1,
        minute: 0,
        createdById: validUserId,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject negative minute", () => {
      const input = {
        name: "Negative Minute",
        notificationType: NotificationScheduleType.INFO,
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        hour: 9,
        minute: -1,
        createdById: validUserId,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject invalid createdById", () => {
      const input = {
        name: "Invalid Creator",
        notificationType: NotificationScheduleType.INFO,
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        hour: 9,
        minute: 0,
        createdById: "invalid-id",
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject title exceeding 200 characters", () => {
      const input = {
        name: "Long Title Test",
        notificationType: NotificationScheduleType.INFO,
        notificationTitle: "A".repeat(201),
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        hour: 9,
        minute: 0,
        createdById: validUserId,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject body exceeding 2000 characters", () => {
      const input = {
        name: "Long Body Test",
        notificationType: NotificationScheduleType.INFO,
        notificationBody: "A".repeat(2001),
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        hour: 9,
        minute: 0,
        createdById: validUserId,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject invalid URL format", () => {
      const input = {
        name: "Invalid URL",
        notificationType: NotificationScheduleType.INFO,
        notificationUrl: "not-a-url",
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        hour: 9,
        minute: 0,
        createdById: validUserId,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject URL exceeding 500 characters", () => {
      const input = {
        name: "Long URL Test",
        notificationType: NotificationScheduleType.INFO,
        notificationUrl: "https://example.com/" + "a".repeat(500),
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        hour: 9,
        minute: 0,
        createdById: validUserId,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validateUpdateInput", () => {
    it("should validate with id only", () => {
      const input = { id: validUUID };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with name update", () => {
      const input = {
        id: validUUID,
        name: "Updated Name",
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with notification fields update", () => {
      const input = {
        id: validUUID,
        notificationTitle: "Updated Title",
        notificationBody: "Updated body",
        notificationUrl: "https://example.com/updated",
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with date update", () => {
      const input = {
        id: validUUID,
        startDate: "2024-06-01",
        endDate: "2024-12-31",
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with time update", () => {
      const input = {
        id: validUUID,
        hour: 15,
        minute: 30,
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with isActive update", () => {
      const input = {
        id: validUUID,
        isActive: false,
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with null notification fields", () => {
      const input = {
        id: validUUID,
        notificationTitle: null,
        notificationBody: null,
        notificationUrl: null,
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(true);
    });

    it("should reject invalid id format", () => {
      const input = {
        id: "invalid-id",
        name: "Updated Name",
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject empty name in update", () => {
      const input = {
        id: validUUID,
        name: "",
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject long name in update", () => {
      const input = {
        id: validUUID,
        name: "A".repeat(101),
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject invalid hour in update", () => {
      const input = {
        id: validUUID,
        hour: 25,
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing id", () => {
      const input = { name: "Updated Name" };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validateDeleteInput", () => {
    it("should validate a valid UUID", () => {
      const input = { id: validUUID };
      const result = validateDeleteInput(input);
      expect(result.success).toBe(true);
    });

    it("should reject invalid UUID format", () => {
      const input = { id: "invalid-id" };
      const result = validateDeleteInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing id", () => {
      const input = {};
      const result = validateDeleteInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validateBulkDeleteInput", () => {
    it("should validate with single ID", () => {
      const input = { ids: [validUUID] };
      const result = validateBulkDeleteInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with multiple IDs", () => {
      const input = {
        ids: [validUUID, validTripId, validUserId],
      };
      const result = validateBulkDeleteInput(input);
      expect(result.success).toBe(true);
    });

    it("should reject empty array", () => {
      const input = { ids: [] };
      const result = validateBulkDeleteInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject invalid UUID in array", () => {
      const input = {
        ids: [validUUID, "invalid-id"],
      };
      const result = validateBulkDeleteInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing ids", () => {
      const input = {};
      const result = validateBulkDeleteInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject non-array ids", () => {
      const input = { ids: validUUID };
      const result = validateBulkDeleteInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validateToggleActiveInput", () => {
    it("should validate a valid UUID", () => {
      const input = { id: validUUID };
      const result = validateToggleActiveInput(input);
      expect(result.success).toBe(true);
    });

    it("should reject invalid UUID format", () => {
      const input = { id: "invalid-id" };
      const result = validateToggleActiveInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing id", () => {
      const input = {};
      const result = validateToggleActiveInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validateBulkToggleActiveInput", () => {
    it("should validate with single ID and isActive", () => {
      const input = {
        ids: [validUUID],
        isActive: true,
      };
      const result = validateBulkToggleActiveInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with multiple IDs and isActive false", () => {
      const input = {
        ids: [validUUID, validTripId],
        isActive: false,
      };
      const result = validateBulkToggleActiveInput(input);
      expect(result.success).toBe(true);
    });

    it("should reject empty ids array", () => {
      const input = {
        ids: [],
        isActive: true,
      };
      const result = validateBulkToggleActiveInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing isActive", () => {
      const input = { ids: [validUUID] };
      const result = validateBulkToggleActiveInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject non-boolean isActive", () => {
      const input = {
        ids: [validUUID],
        isActive: "true",
      };
      const result = validateBulkToggleActiveInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validateDuplicateInput", () => {
    it("should validate with id and newCreatedById only", () => {
      const input = {
        id: validUUID,
        newCreatedById: validUserId,
      };
      const result = validateDuplicateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with name override", () => {
      const input = {
        id: validUUID,
        name: "Duplicated Schedule",
        newCreatedById: validUserId,
      };
      const result = validateDuplicateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with date overrides", () => {
      const input = {
        id: validUUID,
        startDate: "2025-01-01",
        endDate: "2025-12-31",
        newCreatedById: validUserId,
      };
      const result = validateDuplicateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with all optional fields", () => {
      const input = {
        id: validUUID,
        name: "Fully Customized Copy",
        startDate: "2025-06-01",
        endDate: "2025-12-31",
        newCreatedById: validUserId,
      };
      const result = validateDuplicateInput(input);
      expect(result.success).toBe(true);
    });

    it("should reject invalid id format", () => {
      const input = {
        id: "invalid-id",
        newCreatedById: validUserId,
      };
      const result = validateDuplicateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject invalid newCreatedById", () => {
      const input = {
        id: validUUID,
        newCreatedById: "invalid-id",
      };
      const result = validateDuplicateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject empty name", () => {
      const input = {
        id: validUUID,
        name: "",
        newCreatedById: validUserId,
      };
      const result = validateDuplicateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing id", () => {
      const input = { newCreatedById: validUserId };
      const result = validateDuplicateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing newCreatedById", () => {
      const input = { id: validUUID };
      const result = validateDuplicateInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validateUpdateLastRunInput", () => {
    it("should validate with valid id and lastRun", () => {
      const input = {
        id: validUUID,
        lastRun: "2024-01-15T10:00:00Z",
      };
      const result = validateUpdateLastRunInput(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(validUUID);
        expect(result.data.lastRun).toBeInstanceOf(Date);
      }
    });

    it("should validate with different date formats", () => {
      const input = {
        id: validUUID,
        lastRun: "2024-06-01",
      };
      const result = validateUpdateLastRunInput(input);
      expect(result.success).toBe(true);
    });

    it("should reject invalid id format", () => {
      const input = {
        id: "invalid-id",
        lastRun: "2024-01-15T10:00:00Z",
      };
      const result = validateUpdateLastRunInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing id", () => {
      const input = { lastRun: "2024-01-15T10:00:00Z" };
      const result = validateUpdateLastRunInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing lastRun", () => {
      const input = { id: validUUID };
      const result = validateUpdateLastRunInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validateGetExecutionHistoryInput", () => {
    it("should validate with scheduleId only", () => {
      const input = { scheduleId: validUUID };
      const result = validateGetExecutionHistoryInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with scheduleId and limit", () => {
      const input = {
        scheduleId: validUUID,
        limit: 50,
      };
      const result = validateGetExecutionHistoryInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with limit = 1 (minimum)", () => {
      const input = {
        scheduleId: validUUID,
        limit: 1,
      };
      const result = validateGetExecutionHistoryInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with limit = 100 (maximum)", () => {
      const input = {
        scheduleId: validUUID,
        limit: 100,
      };
      const result = validateGetExecutionHistoryInput(input);
      expect(result.success).toBe(true);
    });

    it("should reject invalid scheduleId format", () => {
      const input = { scheduleId: "invalid-id" };
      const result = validateGetExecutionHistoryInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject limit = 0", () => {
      const input = {
        scheduleId: validUUID,
        limit: 0,
      };
      const result = validateGetExecutionHistoryInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject limit > 100", () => {
      const input = {
        scheduleId: validUUID,
        limit: 101,
      };
      const result = validateGetExecutionHistoryInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing scheduleId", () => {
      const input = {};
      const result = validateGetExecutionHistoryInput(input);
      expect(result.success).toBe(false);
    });
  });
});

/*
 * Summary
 *
 * Tests cover:
 * - validateGetAllInput: pagination and filter support
 *   - Pagination: limit (1-100), offset (>=0), both must be integers
 *   - Filter: tripId, notificationType (NotificationScheduleType enum), isActive, date range, search
 * - validateGetByIdInput: UUID validation for schedule ID
 * - validateGetUpcomingInput: optional days parameter (1-30, integer)
 * - validateCreateInput: comprehensive validation including:
 *   - Required: name (1-100 chars), notificationType (enum), startDate, endDate (DateFromString),
 *              hour (0-23), minute (0-59), createdById (UUID)
 *   - Optional: tripId (null or UUID), notificationTitle/Body/Url (null or validated string),
 *              isActive (boolean)
 * - validateUpdateInput: partial updates with optional fields
 * - validateDeleteInput: UUID validation
 * - validateBulkDeleteInput: NonEmptyArray of UUIDs
 * - validateToggleActiveInput: UUID validation
 * - validateBulkToggleActiveInput: NonEmptyArray of UUIDs + isActive boolean
 * - validateDuplicateInput: id (UUID) + newCreatedById (UUID) + optional overrides
 * - validateUpdateLastRunInput: id (UUID) + lastRun (DateFromString)
 * - validateGetExecutionHistoryInput: scheduleId (UUID) + optional limit (1-100)
 *
 * All validators tested with:
 * - Valid inputs (success cases)
 * - Invalid formats (error cases)
 * - Edge cases (boundary values for numbers, date parsing)
 * - Enum validation (NotificationScheduleType)
 * - NonEmptyArray validation for bulk operations
 * - Missing required vs optional fields
 */
