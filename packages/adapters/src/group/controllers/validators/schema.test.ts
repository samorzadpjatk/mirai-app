import { describe, it, expect } from "bun:test";
import {
  validateGetByIdInput,
  validateGetByCodeInput,
  validateGetByTripIdInput,
  validateCreateGroupInput,
  validateUpdateGroupInput,
  validateAddCoinsInput,
  validateListInput,
  validateGetByOrganizerInput,
  validateAssignUserToGroupInput,
  validateRemoveUserFromGroupInput,
} from "./schema";

describe("[UNIT] Group Validators", () => {
  const validUUID = "550e8400-e29b-41d4-a716-446655440000";
  const validTripId = "550e8400-e29b-41d4-a716-446655440001";
  const validGroupId = "550e8400-e29b-41d4-a716-446655440002";
  const validUserId = "550e8400-e29b-41d4-a716-446655440003";
  const validOrganizerId = "550e8400-e29b-41d4-a716-446655440004";

  describe("validateGetByIdInput", () => {
    it("should validate a valid UUID", () => {
      const input = { id: validGroupId };
      const result = validateGetByIdInput(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(validGroupId);
      }
    });

    it("should reject an invalid UUID format", () => {
      const input = { id: "invalid-id" };
      const result = validateGetByIdInput(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain("Invalid group ID format");
      }
    });

    it("should reject missing id", () => {
      const input = {};
      const result = validateGetByIdInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validateGetByCodeInput", () => {
    it("should validate a valid group code", () => {
      const input = { code: "GROUP-123" };
      const result = validateGetByCodeInput(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.code).toBe("GROUP-123");
      }
    });

    it("should validate minimum length code", () => {
      const input = { code: "A" };
      const result = validateGetByCodeInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate maximum length code (50 chars)", () => {
      const input = { code: "A".repeat(50) };
      const result = validateGetByCodeInput(input);
      expect(result.success).toBe(true);
    });

    it("should reject empty code", () => {
      const input = { code: "" };
      const result = validateGetByCodeInput(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain("Group code is required");
      }
    });

    it("should reject code exceeding 50 characters", () => {
      const input = { code: "A".repeat(51) };
      const result = validateGetByCodeInput(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain("at most 50 characters");
      }
    });

    it("should reject missing code", () => {
      const input = {};
      const result = validateGetByCodeInput(input);
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

  describe("validateCreateGroupInput", () => {
    it("should validate minimal valid input", () => {
      const input = {
        tripId: validTripId,
        name: "Test Group",
        organizerId: validOrganizerId,
        code: "GRP-001",
      };
      const result = validateCreateGroupInput(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tripId).toBe(validTripId);
        expect(result.data.name).toBe("Test Group");
        expect(result.data.organizerId).toBe(validOrganizerId);
        expect(result.data.code).toBe("GRP-001");
      }
    });

    it("should validate with all optional fields", () => {
      const input = {
        tripId: validTripId,
        name: "Test Group",
        description: "A test group description",
        image: "https://example.com/image.jpg",
        organizerId: validOrganizerId,
        code: "GRP-001",
        coins: 100,
      };
      const result = validateCreateGroupInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with null description", () => {
      const input = {
        tripId: validTripId,
        name: "Test Group",
        description: null,
        organizerId: validOrganizerId,
        code: "GRP-001",
      };
      const result = validateCreateGroupInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with null image", () => {
      const input = {
        tripId: validTripId,
        name: "Test Group",
        image: null,
        organizerId: validOrganizerId,
        code: "GRP-001",
      };
      const result = validateCreateGroupInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with valid HTTPS image URL", () => {
      const input = {
        tripId: validTripId,
        name: "Test Group",
        image: "https://example.com/image.png",
        organizerId: validOrganizerId,
        code: "GRP-001",
      };
      const result = validateCreateGroupInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with valid HTTP image URL", () => {
      const input = {
        tripId: validTripId,
        name: "Test Group",
        image: "http://example.com/image.jpg",
        organizerId: validOrganizerId,
        code: "GRP-001",
      };
      const result = validateCreateGroupInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with coins = 0", () => {
      const input = {
        tripId: validTripId,
        name: "Test Group",
        organizerId: validOrganizerId,
        code: "GRP-001",
        coins: 0,
      };
      const result = validateCreateGroupInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with large coins value", () => {
      const input = {
        tripId: validTripId,
        name: "Test Group",
        organizerId: validOrganizerId,
        code: "GRP-001",
        coins: 1000000,
      };
      const result = validateCreateGroupInput(input);
      expect(result.success).toBe(true);
    });

    it("should reject invalid trip ID", () => {
      const input = {
        tripId: "invalid-trip",
        name: "Test Group",
        organizerId: validOrganizerId,
        code: "GRP-001",
      };
      const result = validateCreateGroupInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject empty name", () => {
      const input = {
        tripId: validTripId,
        name: "",
        organizerId: validOrganizerId,
        code: "GRP-001",
      };
      const result = validateCreateGroupInput(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain("Name is required");
      }
    });

    it("should reject long name (over 100 chars)", () => {
      const input = {
        tripId: validTripId,
        name: "A".repeat(101),
        organizerId: validOrganizerId,
        code: "GRP-001",
      };
      const result = validateCreateGroupInput(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain("at most 100 characters");
      }
    });

    it("should reject long description (over 500 chars)", () => {
      const input = {
        tripId: validTripId,
        name: "Test Group",
        description: "A".repeat(501),
        organizerId: validOrganizerId,
        code: "GRP-001",
      };
      const result = validateCreateGroupInput(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain("at most 500 characters");
      }
    });

    it("should reject invalid image URL", () => {
      const input = {
        tripId: validTripId,
        name: "Test Group",
        image: "not-a-url",
        organizerId: validOrganizerId,
        code: "GRP-001",
      };
      const result = validateCreateGroupInput(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain("Invalid image URL");
      }
    });

    it("should reject invalid organizer ID", () => {
      const input = {
        tripId: validTripId,
        name: "Test Group",
        organizerId: "invalid-id",
        code: "GRP-001",
      };
      const result = validateCreateGroupInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject empty code", () => {
      const input = {
        tripId: validTripId,
        name: "Test Group",
        organizerId: validOrganizerId,
        code: "",
      };
      const result = validateCreateGroupInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject long code (over 50 chars)", () => {
      const input = {
        tripId: validTripId,
        name: "Test Group",
        organizerId: validOrganizerId,
        code: "A".repeat(51),
      };
      const result = validateCreateGroupInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject negative coins", () => {
      const input = {
        tripId: validTripId,
        name: "Test Group",
        organizerId: validOrganizerId,
        code: "GRP-001",
        coins: -1,
      };
      const result = validateCreateGroupInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject non-integer coins", () => {
      const input = {
        tripId: validTripId,
        name: "Test Group",
        organizerId: validOrganizerId,
        code: "GRP-001",
        coins: 10.5,
      };
      const result = validateCreateGroupInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validateUpdateGroupInput", () => {
    it("should validate with groupId only", () => {
      const input = {
        groupId: validGroupId,
      };
      const result = validateUpdateGroupInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with name update", () => {
      const input = {
        groupId: validGroupId,
        name: "Updated Group Name",
      };
      const result = validateUpdateGroupInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with description update", () => {
      const input = {
        groupId: validGroupId,
        description: "Updated description",
      };
      const result = validateUpdateGroupInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with null description", () => {
      const input = {
        groupId: validGroupId,
        description: null,
      };
      const result = validateUpdateGroupInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with image update", () => {
      const input = {
        groupId: validGroupId,
        image: "https://example.com/new-image.jpg",
      };
      const result = validateUpdateGroupInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with null image", () => {
      const input = {
        groupId: validGroupId,
        image: null,
      };
      const result = validateUpdateGroupInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with all fields", () => {
      const input = {
        groupId: validGroupId,
        name: "Updated Name",
        description: "Updated description",
        image: "https://example.com/image.jpg",
      };
      const result = validateUpdateGroupInput(input);
      expect(result.success).toBe(true);
    });

    it("should reject invalid groupId", () => {
      const input = {
        groupId: "invalid-id",
        name: "Updated Name",
      };
      const result = validateUpdateGroupInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject empty name in update", () => {
      const input = {
        groupId: validGroupId,
        name: "",
      };
      const result = validateUpdateGroupInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject long name in update", () => {
      const input = {
        groupId: validGroupId,
        name: "A".repeat(101),
      };
      const result = validateUpdateGroupInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject invalid image URL in update", () => {
      const input = {
        groupId: validGroupId,
        image: "invalid-url",
      };
      const result = validateUpdateGroupInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing groupId", () => {
      const input = {
        name: "Updated Name",
      };
      const result = validateUpdateGroupInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validateAddCoinsInput", () => {
    it("should validate valid add coins input", () => {
      const input = {
        groupId: validGroupId,
        amount: 50,
      };
      const result = validateAddCoinsInput(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.groupId).toBe(validGroupId);
        expect(result.data.amount).toBe(50);
      }
    });

    it("should validate with amount = 1 (minimum)", () => {
      const input = {
        groupId: validGroupId,
        amount: 1,
      };
      const result = validateAddCoinsInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with large amount", () => {
      const input = {
        groupId: validGroupId,
        amount: 1000000,
      };
      const result = validateAddCoinsInput(input);
      expect(result.success).toBe(true);
    });

    it("should reject invalid groupId", () => {
      const input = {
        groupId: "invalid-id",
        amount: 50,
      };
      const result = validateAddCoinsInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject amount = 0", () => {
      const input = {
        groupId: validGroupId,
        amount: 0,
      };
      const result = validateAddCoinsInput(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain("at least 1");
      }
    });

    it("should reject negative amount", () => {
      const input = {
        groupId: validGroupId,
        amount: -10,
      };
      const result = validateAddCoinsInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject non-integer amount", () => {
      const input = {
        groupId: validGroupId,
        amount: 10.5,
      };
      const result = validateAddCoinsInput(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain("integer");
      }
    });

    it("should reject missing groupId", () => {
      const input = {
        amount: 50,
      };
      const result = validateAddCoinsInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing amount", () => {
      const input = {
        groupId: validGroupId,
      };
      const result = validateAddCoinsInput(input);
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

  describe("validateGetByOrganizerInput", () => {
    it("should validate valid organizer ID", () => {
      const input = { organizerId: validOrganizerId };
      const result = validateGetByOrganizerInput(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.organizerId).toBe(validOrganizerId);
      }
    });

    it("should validate with any non-empty string", () => {
      const input = { organizerId: "any-organizer-id" };
      const result = validateGetByOrganizerInput(input);
      expect(result.success).toBe(true);
    });

    it("should reject empty organizerId", () => {
      const input = { organizerId: "" };
      const result = validateGetByOrganizerInput(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain("Organizer ID is required");
      }
    });

    it("should reject missing organizerId", () => {
      const input = {};
      const result = validateGetByOrganizerInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validateAssignUserToGroupInput", () => {
    it("should validate valid input", () => {
      const input = {
        groupId: validGroupId,
        userId: validUserId,
      };
      const result = validateAssignUserToGroupInput(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.groupId).toBe(validGroupId);
        expect(result.data.userId).toBe(validUserId);
      }
    });

    it("should reject invalid groupId", () => {
      const input = {
        groupId: "invalid-group",
        userId: validUserId,
      };
      const result = validateAssignUserToGroupInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject invalid userId", () => {
      const input = {
        groupId: validGroupId,
        userId: "invalid-user",
      };
      const result = validateAssignUserToGroupInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing groupId", () => {
      const input = {
        userId: validUserId,
      };
      const result = validateAssignUserToGroupInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing userId", () => {
      const input = {
        groupId: validGroupId,
      };
      const result = validateAssignUserToGroupInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validateRemoveUserFromGroupInput", () => {
    it("should validate valid input", () => {
      const input = {
        groupId: validGroupId,
        userId: validUserId,
      };
      const result = validateRemoveUserFromGroupInput(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.groupId).toBe(validGroupId);
        expect(result.data.userId).toBe(validUserId);
      }
    });

    it("should reject invalid groupId", () => {
      const input = {
        groupId: "invalid-group",
        userId: validUserId,
      };
      const result = validateRemoveUserFromGroupInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject invalid userId", () => {
      const input = {
        groupId: validGroupId,
        userId: "invalid-user",
      };
      const result = validateRemoveUserFromGroupInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing groupId", () => {
      const input = {
        userId: validUserId,
      };
      const result = validateRemoveUserFromGroupInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing userId", () => {
      const input = {
        groupId: validGroupId,
      };
      const result = validateRemoveUserFromGroupInput(input);
      expect(result.success).toBe(false);
    });
  });
});

/*
 * Summary
 *
 * Tests cover:
 * - validateGetByIdInput: UUID validation for group ID
 * - validateGetByCodeInput: string validation (1-50 chars, required)
 * - validateGetByTripIdInput: UUID validation for trip ID
 * - validateCreateGroupInput: comprehensive validation including:
 *   - Required: tripId (UUID), name (1-100), organizerId (UUID), code (1-50)
 *   - Optional: description (null or string, max 500), image (null or URL), coins (int >= 0)
 * - validateUpdateGroupInput: partial updates with valid UUID
 * - validateAddCoinsInput: groupId (UUID) + amount (int >= 1)
 * - validateListInput: pagination with limit (1-100) and offset (>=0)
 * - validateGetByOrganizerInput: non-empty string required
 * - validateAssignUserToGroupInput: both groupId and userId must be valid UUIDs
 * - validateRemoveUserFromGroupInput: both groupId and userId must be valid UUIDs
 *
 * All validators tested with:
 * - Valid inputs (success cases)
 * - Invalid formats (error messages)
 * - Edge cases (boundary values, nulls)
 * - Missing required fields
 * - Optional field handling
 */
