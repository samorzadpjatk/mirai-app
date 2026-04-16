import { describe, it, expect } from "bun:test";
import {
  validateGetByIdInput,
  validateGetByAuthIdInput,
  validateCreateUserInput,
  validateUpdateUserInput,
  validateListInput,
  type GetByIdInput,
  type GetByAuthIdInput,
  type CreateUserInput,
  type UpdateUserInput,
  type ListInput,
} from "./schema";

describe("[UNIT] User Validators", () => {
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
        expect(result.error.message).toContain("Invalid user ID format");
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

  describe("validateGetByAuthIdInput", () => {
    it("should validate a valid auth user ID", () => {
      const input = { authUserId: "auth-123" };
      const result = validateGetByAuthIdInput(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.authUserId).toBe("auth-123");
      }
    });

    it("should reject empty auth user ID", () => {
      const input = { authUserId: "" };
      const result = validateGetByAuthIdInput(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain("Auth user ID is required");
      }
    });

    it("should reject missing authUserId", () => {
      const input = {};
      const result = validateGetByAuthIdInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject non-string authUserId", () => {
      const input = { authUserId: 123 };
      const result = validateGetByAuthIdInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validateCreateUserInput", () => {
    it("should validate minimal valid input", () => {
      const input = {
        authUserId: "auth-123",
        firstName: "John",
        lastName: "Doe",
      };
      const result = validateCreateUserInput(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.authUserId).toBe("auth-123");
        expect(result.data.firstName).toBe("John");
        expect(result.data.lastName).toBe("Doe");
      }
    });

    it("should validate with USER role", () => {
      const input = {
        authUserId: "auth-123",
        firstName: "John",
        lastName: "Doe",
        role: "USER" as const,
      };
      const result = validateCreateUserInput(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.role).toBe("USER");
      }
    });

    it("should validate with MODERATOR role", () => {
      const input = {
        authUserId: "auth-123",
        firstName: "John",
        lastName: "Doe",
        role: "MODERATOR" as const,
      };
      const result = validateCreateUserInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with ADMIN role", () => {
      const input = {
        authUserId: "auth-123",
        firstName: "John",
        lastName: "Doe",
        role: "ADMIN" as const,
      };
      const result = validateCreateUserInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with SERVICE role", () => {
      const input = {
        authUserId: "auth-123",
        firstName: "John",
        lastName: "Doe",
        role: "SERVICE" as const,
      };
      const result = validateCreateUserInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate without role (optional)", () => {
      const input = {
        authUserId: "auth-123",
        firstName: "John",
        lastName: "Doe",
      };
      const result = validateCreateUserInput(input);
      expect(result.success).toBe(true);
    });

    it("should reject missing authUserId", () => {
      const input = {
        firstName: "John",
        lastName: "Doe",
      };
      const result = validateCreateUserInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject empty authUserId", () => {
      const input = {
        authUserId: "",
        firstName: "John",
        lastName: "Doe",
      };
      const result = validateCreateUserInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject short first name (less than 2 chars)", () => {
      const input = {
        authUserId: "auth-123",
        firstName: "J",
        lastName: "Doe",
      };
      const result = validateCreateUserInput(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain("at least 2 characters");
      }
    });

    it("should reject long first name (more than 100 chars)", () => {
      const input = {
        authUserId: "auth-123",
        firstName: "A".repeat(101),
        lastName: "Doe",
      };
      const result = validateCreateUserInput(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain("at most 100 characters");
      }
    });

    it("should reject first name with digits", () => {
      const input = {
        authUserId: "auth-123",
        firstName: "John123",
        lastName: "Doe",
      };
      const result = validateCreateUserInput(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain("cannot contain digits");
      }
    });

    it("should reject short last name", () => {
      const input = {
        authUserId: "auth-123",
        firstName: "John",
        lastName: "D",
      };
      const result = validateCreateUserInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject long last name", () => {
      const input = {
        authUserId: "auth-123",
        firstName: "John",
        lastName: "A".repeat(101),
      };
      const result = validateCreateUserInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject last name with digits", () => {
      const input = {
        authUserId: "auth-123",
        firstName: "John",
        lastName: "Doe123",
      };
      const result = validateCreateUserInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject invalid role", () => {
      const input = {
        authUserId: "auth-123",
        firstName: "John",
        lastName: "Doe",
        role: "INVALID_ROLE",
      };
      const result = validateCreateUserInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validateUpdateUserInput", () => {
    it("should validate update with userId only", () => {
      const input = {
        userId: validUUID,
      };
      const result = validateUpdateUserInput(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.userId).toBe(validUUID);
      }
    });

    it("should validate update with firstName", () => {
      const input = {
        userId: validUUID,
        firstName: "Jane",
      };
      const result = validateUpdateUserInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate update with lastName", () => {
      const input = {
        userId: validUUID,
        lastName: "Smith",
      };
      const result = validateUpdateUserInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate update with hasAvatar", () => {
      const input = {
        userId: validUUID,
        hasAvatar: true,
      };
      const result = validateUpdateUserInput(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.hasAvatar).toBe(true);
      }
    });

    it("should validate update with all optional fields", () => {
      const input = {
        userId: validUUID,
        firstName: "Jane",
        lastName: "Smith",
        hasAvatar: false,
      };
      const result = validateUpdateUserInput(input);
      expect(result.success).toBe(true);
    });

    it("should reject invalid userId format", () => {
      const input = {
        userId: "invalid-id",
        firstName: "Jane",
      };
      const result = validateUpdateUserInput(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain("Invalid user ID format");
      }
    });

    it("should reject short firstName in update", () => {
      const input = {
        userId: validUUID,
        firstName: "J",
      };
      const result = validateUpdateUserInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject firstName with digits in update", () => {
      const input = {
        userId: validUUID,
        firstName: "Jane123",
      };
      const result = validateUpdateUserInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject non-boolean hasAvatar", () => {
      const input = {
        userId: validUUID,
        hasAvatar: "yes",
      };
      const result = validateUpdateUserInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing userId", () => {
      const input = {
        firstName: "Jane",
      };
      const result = validateUpdateUserInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validateListInput", () => {
    it("should validate empty input (all optional)", () => {
      const input = {};
      const result = validateListInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with limit only", () => {
      const input = { limit: 10 };
      const result = validateListInput(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(10);
      }
    });

    it("should validate with offset only", () => {
      const input = { offset: 20 };
      const result = validateListInput(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.offset).toBe(20);
      }
    });

    it("should validate with limit and offset", () => {
      const input = { limit: 25, offset: 50 };
      const result = validateListInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with limit at minimum (1)", () => {
      const input = { limit: 1 };
      const result = validateListInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with limit at maximum (100)", () => {
      const input = { limit: 100 };
      const result = validateListInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with offset at minimum (0)", () => {
      const input = { offset: 0 };
      const result = validateListInput(input);
      expect(result.success).toBe(true);
    });

    it("should reject limit below 1", () => {
      const input = { limit: 0 };
      const result = validateListInput(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain("at least 1");
      }
    });

    it("should reject limit above 100", () => {
      const input = { limit: 101 };
      const result = validateListInput(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain("at most 100");
      }
    });

    it("should reject negative offset", () => {
      const input = { offset: -1 };
      const result = validateListInput(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain("at least 0");
      }
    });

    it("should reject non-integer limit", () => {
      const input = { limit: 10.5 };
      const result = validateListInput(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain("integer");
      }
    });

    it("should reject non-integer offset", () => {
      const input = { offset: 5.5 };
      const result = validateListInput(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain("integer");
      }
    });

    it("should reject non-number limit", () => {
      const input = { limit: "10" };
      const result = validateListInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject non-number offset", () => {
      const input = { offset: "20" };
      const result = validateListInput(input);
      expect(result.success).toBe(false);
    });
  });
});

/*
 * Summary
 *
 * Tests cover:
 * - validateGetByIdInput: valid UUID, invalid formats, missing fields
 * - validateGetByAuthIdInput: valid auth ID, empty/missing values
 * - validateCreateUserInput: complete validation including:
 *   - Required fields (authUserId, firstName, lastName)
 *   - Optional role field (USER, MODERATOR, ADMIN, SERVICE)
 *   - Name validation (length 2-100, no digits)
 * - validateUpdateUserInput: partial updates with valid UUID
 * - validateListInput: pagination with limit (1-100) and offset (>=0)
 *
 * All validators tested with:
 * - Valid inputs (success cases)
 * - Invalid formats (error messages)
 * - Edge cases (boundary values)
 * - Missing optional vs required fields
 */
