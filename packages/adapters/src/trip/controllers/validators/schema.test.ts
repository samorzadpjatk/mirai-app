import { describe, it, expect } from "bun:test";
import {
  validateGetByIdInput,
  validateCreateTripInput,
  validateUpdateTripInput,
  validateUpdateStatusInput,
  validateListInput,
  validateListByStatusInput,
  type GetByIdInput,
  type CreateTripInput,
  type UpdateTripInput,
  type UpdateStatusInput,
  type ListInput,
  type ListByStatusInput,
} from "./schema";

describe("[UNIT] Trip Validators", () => {
  const validUUID = "550e8400-e29b-41d4-a716-446655440000";

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
      if (!result.success) {
        expect(result.error.message).toContain("Invalid trip ID format");
      }
    });

    it("should reject a UUID with wrong length", () => {
      const input = { id: "550e8400-e29b-41d4-a716" };
      const result = validateGetByIdInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject a UUID with invalid characters", () => {
      const input = { id: "550e8400-e29b-41d4-a716-XXXXXXXXXXXX" };
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

  describe("validateCreateTripInput", () => {
    it("should validate minimal valid input", () => {
      const input = {
        name: "Summer Trip 2024",
        startDate: "2024-06-01",
        endDate: "2024-06-10",
      };
      const result = validateCreateTripInput(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Summer Trip 2024");
      }
    });

    it("should validate with all optional fields", () => {
      const input = {
        name: "Complete Trip",
        description: "A detailed description of the trip",
        startDate: "2024-07-15",
        endDate: "2024-07-25",
        backgroundImagePath: "https://example.com/background.jpg",
        status: "PLANNING" as const,
      };
      const result = validateCreateTripInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with null description", () => {
      const input = {
        name: "Trip with Null Description",
        description: null,
        startDate: "2024-08-01",
        endDate: "2024-08-05",
      };
      const result = validateCreateTripInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with null backgroundImagePath", () => {
      const input = {
        name: "Trip without Background",
        startDate: "2024-09-01",
        endDate: "2024-09-10",
        backgroundImagePath: null,
      };
      const result = validateCreateTripInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with PLANNING status", () => {
      const input = {
        name: "Planning Trip",
        startDate: "2024-10-01",
        endDate: "2024-10-10",
        status: "PLANNING" as const,
      };
      const result = validateCreateTripInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with ACTIVE status", () => {
      const input = {
        name: "Active Trip",
        startDate: "2024-11-01",
        endDate: "2024-11-10",
        status: "ACTIVE" as const,
      };
      const result = validateCreateTripInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with COMPLETED status", () => {
      const input = {
        name: "Completed Trip",
        startDate: "2024-12-01",
        endDate: "2024-12-10",
        status: "COMPLETED" as const,
      };
      const result = validateCreateTripInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with CANCELLED status", () => {
      const input = {
        name: "Cancelled Trip",
        startDate: "2024-12-15",
        endDate: "2024-12-20",
        status: "CANCELLED" as const,
      };
      const result = validateCreateTripInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with HTTP background image URL", () => {
      const input = {
        name: "HTTP Background",
        startDate: "2024-06-01",
        endDate: "2024-06-10",
        backgroundImagePath: "http://example.com/image.jpg",
      };
      const result = validateCreateTripInput(input);
      expect(result.success).toBe(true);
    });

    it("should reject empty name", () => {
      const input = {
        name: "",
        startDate: "2024-06-01",
        endDate: "2024-06-10",
      };
      const result = validateCreateTripInput(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain("Name is required");
      }
    });

    it("should reject name exceeding 200 characters", () => {
      const input = {
        name: "A".repeat(201),
        startDate: "2024-06-01",
        endDate: "2024-06-10",
      };
      const result = validateCreateTripInput(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain("at most 200 characters");
      }
    });

    it("should reject description exceeding 2000 characters", () => {
      const input = {
        name: "Valid Name",
        description: "A".repeat(2001),
        startDate: "2024-06-01",
        endDate: "2024-06-10",
      };
      const result = validateCreateTripInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject invalid backgroundImagePath URL", () => {
      const input = {
        name: "Invalid URL",
        startDate: "2024-06-01",
        endDate: "2024-06-10",
        backgroundImagePath: "not-a-url",
      };
      const result = validateCreateTripInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject invalid status", () => {
      const input = {
        name: "Invalid Status",
        startDate: "2024-06-01",
        endDate: "2024-06-10",
        status: "INVALID_STATUS",
      };
      const result = validateCreateTripInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing name", () => {
      const input = {
        startDate: "2024-06-01",
        endDate: "2024-06-10",
      };
      const result = validateCreateTripInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing startDate", () => {
      const input = {
        name: "Missing Start",
        endDate: "2024-06-10",
      };
      const result = validateCreateTripInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing endDate", () => {
      const input = {
        name: "Missing End",
        startDate: "2024-06-01",
      };
      const result = validateCreateTripInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validateUpdateTripInput", () => {
    it("should validate with tripId only", () => {
      const input = {
        tripId: validUUID,
      };
      const result = validateUpdateTripInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with name update", () => {
      const input = {
        tripId: validUUID,
        name: "Updated Trip Name",
      };
      const result = validateUpdateTripInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with description update", () => {
      const input = {
        tripId: validUUID,
        description: "Updated description",
      };
      const result = validateUpdateTripInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with null description", () => {
      const input = {
        tripId: validUUID,
        description: null,
      };
      const result = validateUpdateTripInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with date updates", () => {
      const input = {
        tripId: validUUID,
        startDate: "2024-08-01",
        endDate: "2024-08-15",
      };
      const result = validateUpdateTripInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with backgroundImagePath update", () => {
      const input = {
        tripId: validUUID,
        backgroundImagePath: "https://example.com/new-image.jpg",
      };
      const result = validateUpdateTripInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with null backgroundImagePath", () => {
      const input = {
        tripId: validUUID,
        backgroundImagePath: null,
      };
      const result = validateUpdateTripInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with all fields updated", () => {
      const input = {
        tripId: validUUID,
        name: "Fully Updated Trip",
        description: "New description",
        startDate: "2024-09-01",
        endDate: "2024-09-20",
        backgroundImagePath: "https://example.com/updated.jpg",
      };
      const result = validateUpdateTripInput(input);
      expect(result.success).toBe(true);
    });

    it("should reject invalid tripId format", () => {
      const input = {
        tripId: "invalid-id",
        name: "Updated Name",
      };
      const result = validateUpdateTripInput(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain("Invalid trip ID format");
      }
    });

    it("should reject empty name in update", () => {
      const input = {
        tripId: validUUID,
        name: "",
      };
      const result = validateUpdateTripInput(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain("Name is required");
      }
    });

    it("should reject long name in update", () => {
      const input = {
        tripId: validUUID,
        name: "A".repeat(201),
      };
      const result = validateUpdateTripInput(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain("at most 200 characters");
      }
    });

    it("should reject long description in update", () => {
      const input = {
        tripId: validUUID,
        description: "A".repeat(2001),
      };
      const result = validateUpdateTripInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject invalid URL in update", () => {
      const input = {
        tripId: validUUID,
        backgroundImagePath: "not-a-url",
      };
      const result = validateUpdateTripInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing tripId", () => {
      const input = {
        name: "Updated Name",
      };
      const result = validateUpdateTripInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validateUpdateStatusInput", () => {
    it("should validate with PLANNING status", () => {
      const input = {
        tripId: validUUID,
        newStatus: "PLANNING" as const,
      };
      const result = validateUpdateStatusInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with ACTIVE status", () => {
      const input = {
        tripId: validUUID,
        newStatus: "ACTIVE" as const,
      };
      const result = validateUpdateStatusInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with COMPLETED status", () => {
      const input = {
        tripId: validUUID,
        newStatus: "COMPLETED" as const,
      };
      const result = validateUpdateStatusInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with CANCELLED status", () => {
      const input = {
        tripId: validUUID,
        newStatus: "CANCELLED" as const,
      };
      const result = validateUpdateStatusInput(input);
      expect(result.success).toBe(true);
    });

    it("should reject invalid tripId format", () => {
      const input = {
        tripId: "invalid-id",
        newStatus: "ACTIVE" as const,
      };
      const result = validateUpdateStatusInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject invalid status", () => {
      const input = {
        tripId: validUUID,
        newStatus: "INVALID_STATUS",
      };
      const result = validateUpdateStatusInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing tripId", () => {
      const input = {
        newStatus: "ACTIVE" as const,
      };
      const result = validateUpdateStatusInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing newStatus", () => {
      const input = {
        tripId: validUUID,
      };
      const result = validateUpdateStatusInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validateListInput", () => {
    it("should validate empty input with defaults", () => {
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
    it("should validate with PLANNING status", () => {
      const input = {
        status: "PLANNING" as const,
      };
      const result = validateListByStatusInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with ACTIVE status and pagination", () => {
      const input = {
        status: "ACTIVE" as const,
        limit: 20,
        offset: 10,
      };
      const result = validateListByStatusInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with COMPLETED status", () => {
      const input = {
        status: "COMPLETED" as const,
        limit: 50,
      };
      const result = validateListByStatusInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with CANCELLED status and offset", () => {
      const input = {
        status: "CANCELLED" as const,
        offset: 5,
      };
      const result = validateListByStatusInput(input);
      expect(result.success).toBe(true);
    });

    it("should reject invalid status", () => {
      const input = {
        status: "INVALID",
      };
      const result = validateListByStatusInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject invalid limit with status", () => {
      const input = {
        status: "PLANNING" as const,
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
});

/*
 * Summary
 *
 * Tests cover:
 * - validateGetByIdInput: UUID validation for trip ID
 * - validateCreateTripInput: comprehensive validation including:
 *   - Required: name (1-200 chars), startDate/endDate (DateFromString)
 *   - Optional: description (null or max 2000 chars),
 *               backgroundImagePath (null or valid URL),
 *               status (PLANNING/ACTIVE/COMPLETED/CANCELLED enum)
 * - validateUpdateTripInput: partial updates with tripId (UUID) + optional fields
 * - validateUpdateStatusInput: tripId (UUID) + newStatus (trip status enum)
 * - validateListInput: pagination with limit (1-100) and offset (>=0, both integers)
 * - validateListByStatusInput: status (trip status enum) + optional pagination
 *
 * All validators tested with:
 * - Valid inputs (success cases)
 * - Invalid formats (error cases)
 * - Edge cases (boundary values for strings and numbers)
 * - Literal type validation (status enum)
 * - URL validation for backgroundImagePath
 * - Date string parsing for startDate/endDate
 * - Missing required vs optional fields
 * - Integer validation for pagination
 */
