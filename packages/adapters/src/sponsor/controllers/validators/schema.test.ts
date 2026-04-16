import { describe, it, expect } from "bun:test";
import {
  validateGetByIdInput,
  validateGetByTripIdInput,
  validateCreateSponsorInput,
  validateUpdateSponsorInput,
  validateDeleteSponsorInput,
  validateListInput,
  validateLinkToTripInput,
  validateUnlinkFromTripInput,
  type GetByIdInput,
  type GetByTripIdInput,
  type CreateSponsorInput,
  type UpdateSponsorInput,
  type DeleteSponsorInput,
  type ListInput,
  type LinkToTripInput,
  type UnlinkFromTripInput,
} from "./schema";

describe("[UNIT] Sponsor Validators", () => {
  const validCUID = "ckxqjl0ky0000a1bcd2efgh3i";
  const validTripCUID = "ckxqjl0ky0001a2bcd3efgh4i";
  const validSponsorCUID = "ckxqjl0ky0002a3bcd4efgh5i";

  describe("validateGetByIdInput", () => {
    it("should validate a valid CUID", () => {
      const input = { id: validCUID };
      const result = validateGetByIdInput(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(validCUID);
      }
    });

    it("should reject an invalid CUID format (not starting with 'c')", () => {
      const input = { id: "akxqjl0ky0000a1bcd2efgh3i" };
      const result = validateGetByIdInput(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain("Invalid sponsor ID format");
      }
    });

    it("should reject a CUID with wrong length", () => {
      const input = { id: "ckxqjl0ky0000a1" }; // too short
      const result = validateGetByIdInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject a CUID with invalid characters", () => {
      const input = { id: "ckxqjl0ky0000a1bcd2efgh3!" }; // contains '!'
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

  describe("validateGetByTripIdInput", () => {
    it("should validate a valid trip CUID", () => {
      const input = { tripId: validTripCUID };
      const result = validateGetByTripIdInput(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tripId).toBe(validTripCUID);
      }
    });

    it("should reject an invalid tripId format", () => {
      const input = { tripId: "invalid-trip-id" };
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

  describe("validateCreateSponsorInput", () => {
    it("should validate minimal valid input", () => {
      const input = {
        name: "Acme Corporation",
        description: "A leading sponsor for our events",
        logoPath: "https://example.com/logo.png",
      };
      const result = validateCreateSponsorInput(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Acme Corporation");
        expect(result.data.description).toBe(
          "A leading sponsor for our events",
        );
        expect(result.data.logoPath).toBe("https://example.com/logo.png");
      }
    });

    it("should validate with all optional fields", () => {
      const input = {
        name: "TechCorp",
        description: "Technology partner for the trip",
        logoPath: "/logos/techcorp.svg",
        height: 120,
        offsetX: 10,
        offsetY: 5,
        isActive: true,
      };
      const result = validateCreateSponsorInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with null optional fields", () => {
      const input = {
        name: "Minimal Sponsor",
        description: "Simple sponsor",
        logoPath: "logo.jpg",
        height: null,
        offsetX: null,
        offsetY: null,
      };
      const result = validateCreateSponsorInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with height = 0", () => {
      const input = {
        name: "Zero Height Sponsor",
        description: "Description",
        logoPath: "logo.png",
        height: 0,
      };
      const result = validateCreateSponsorInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with large height", () => {
      const input = {
        name: "Tall Sponsor",
        description: "Description",
        logoPath: "logo.png",
        height: 500,
      };
      const result = validateCreateSponsorInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with isActive = false", () => {
      const input = {
        name: "Inactive Sponsor",
        description: "Description",
        logoPath: "logo.png",
        isActive: false,
      };
      const result = validateCreateSponsorInput(input);
      expect(result.success).toBe(true);
    });

    it("should reject empty name", () => {
      const input = {
        name: "",
        description: "Description",
        logoPath: "logo.png",
      };
      const result = validateCreateSponsorInput(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain("Name is required");
      }
    });

    it("should reject name exceeding 200 characters", () => {
      const input = {
        name: "A".repeat(201),
        description: "Description",
        logoPath: "logo.png",
      };
      const result = validateCreateSponsorInput(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain("at most 200 characters");
      }
    });

    it("should reject empty description", () => {
      const input = {
        name: "Sponsor Name",
        description: "",
        logoPath: "logo.png",
      };
      const result = validateCreateSponsorInput(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain("Description is required");
      }
    });

    it("should reject description exceeding 2000 characters", () => {
      const input = {
        name: "Sponsor Name",
        description: "A".repeat(2001),
        logoPath: "logo.png",
      };
      const result = validateCreateSponsorInput(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain("at most 2000 characters");
      }
    });

    it("should reject empty logoPath", () => {
      const input = {
        name: "Sponsor Name",
        description: "Description",
        logoPath: "",
      };
      const result = validateCreateSponsorInput(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain("Logo path is required");
      }
    });

    it("should reject negative height", () => {
      const input = {
        name: "Sponsor Name",
        description: "Description",
        logoPath: "logo.png",
        height: -10,
      };
      const result = validateCreateSponsorInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject non-integer height", () => {
      const input = {
        name: "Sponsor Name",
        description: "Description",
        logoPath: "logo.png",
        height: 100.5,
      };
      const result = validateCreateSponsorInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject negative offsetX", () => {
      const input = {
        name: "Sponsor Name",
        description: "Description",
        logoPath: "logo.png",
        offsetX: -5,
      };
      const result = validateCreateSponsorInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject negative offsetY", () => {
      const input = {
        name: "Sponsor Name",
        description: "Description",
        logoPath: "logo.png",
        offsetY: -5,
      };
      const result = validateCreateSponsorInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing name", () => {
      const input = {
        description: "Description",
        logoPath: "logo.png",
      };
      const result = validateCreateSponsorInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing description", () => {
      const input = {
        name: "Sponsor Name",
        logoPath: "logo.png",
      };
      const result = validateCreateSponsorInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing logoPath", () => {
      const input = {
        name: "Sponsor Name",
        description: "Description",
      };
      const result = validateCreateSponsorInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validateUpdateSponsorInput", () => {
    it("should validate with sponsorId only", () => {
      const input = {
        sponsorId: validSponsorCUID,
      };
      const result = validateUpdateSponsorInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with name update", () => {
      const input = {
        sponsorId: validSponsorCUID,
        name: "Updated Sponsor Name",
      };
      const result = validateUpdateSponsorInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with description update", () => {
      const input = {
        sponsorId: validSponsorCUID,
        description: "Updated description",
      };
      const result = validateUpdateSponsorInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with logoPath update", () => {
      const input = {
        sponsorId: validSponsorCUID,
        logoPath: "https://example.com/new-logo.png",
      };
      const result = validateUpdateSponsorInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with layout fields update", () => {
      const input = {
        sponsorId: validSponsorCUID,
        height: 150,
        offsetX: 20,
        offsetY: 10,
      };
      const result = validateUpdateSponsorInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with null layout fields", () => {
      const input = {
        sponsorId: validSponsorCUID,
        height: null,
        offsetX: null,
        offsetY: null,
      };
      const result = validateUpdateSponsorInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with isActive update", () => {
      const input = {
        sponsorId: validSponsorCUID,
        isActive: false,
      };
      const result = validateUpdateSponsorInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with all fields updated", () => {
      const input = {
        sponsorId: validSponsorCUID,
        name: "Fully Updated Sponsor",
        description: "Completely new description",
        logoPath: "/updated/logo.svg",
        height: 200,
        offsetX: 30,
        offsetY: 15,
        isActive: true,
      };
      const result = validateUpdateSponsorInput(input);
      expect(result.success).toBe(true);
    });

    it("should reject invalid sponsorId format", () => {
      const input = {
        sponsorId: "invalid-id",
        name: "Updated Name",
      };
      const result = validateUpdateSponsorInput(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain("Invalid sponsor ID format");
      }
    });

    it("should reject empty name in update", () => {
      const input = {
        sponsorId: validSponsorCUID,
        name: "",
      };
      const result = validateUpdateSponsorInput(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain("Name is required");
      }
    });

    it("should reject long name in update", () => {
      const input = {
        sponsorId: validSponsorCUID,
        name: "A".repeat(201),
      };
      const result = validateUpdateSponsorInput(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain("at most 200 characters");
      }
    });

    it("should reject empty description in update", () => {
      const input = {
        sponsorId: validSponsorCUID,
        description: "",
      };
      const result = validateUpdateSponsorInput(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain("Description is required");
      }
    });

    it("should reject long description in update", () => {
      const input = {
        sponsorId: validSponsorCUID,
        description: "A".repeat(2001),
      };
      const result = validateUpdateSponsorInput(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain("at most 2000 characters");
      }
    });

    it("should reject empty logoPath in update", () => {
      const input = {
        sponsorId: validSponsorCUID,
        logoPath: "",
      };
      const result = validateUpdateSponsorInput(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain("Logo path is required");
      }
    });

    it("should reject negative height in update", () => {
      const input = {
        sponsorId: validSponsorCUID,
        height: -5,
      };
      const result = validateUpdateSponsorInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing sponsorId", () => {
      const input = {
        name: "Updated Name",
      };
      const result = validateUpdateSponsorInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validateDeleteSponsorInput", () => {
    it("should validate valid sponsor ID", () => {
      const input = { id: validSponsorCUID };
      const result = validateDeleteSponsorInput(input);
      expect(result.success).toBe(true);
    });

    it("should reject invalid sponsorId format", () => {
      const input = { id: "invalid-id" };
      const result = validateDeleteSponsorInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing id", () => {
      const input = {};
      const result = validateDeleteSponsorInput(input);
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
      const input = { limit: 20 };
      const result = validateListInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with offset only", () => {
      const input = { offset: 10 };
      const result = validateListInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with activeOnly = true", () => {
      const input = { activeOnly: true };
      const result = validateListInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with activeOnly = false", () => {
      const input = { activeOnly: false };
      const result = validateListInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with all pagination fields", () => {
      const input = {
        limit: 25,
        offset: 50,
        activeOnly: true,
      };
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

    it("should reject non-boolean activeOnly", () => {
      const input = { activeOnly: "true" };
      const result = validateListInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validateLinkToTripInput", () => {
    it("should validate valid sponsor and trip IDs", () => {
      const input = {
        sponsorId: validSponsorCUID,
        tripId: validTripCUID,
      };
      const result = validateLinkToTripInput(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sponsorId).toBe(validSponsorCUID);
        expect(result.data.tripId).toBe(validTripCUID);
      }
    });

    it("should reject invalid sponsorId format", () => {
      const input = {
        sponsorId: "invalid-sponsor",
        tripId: validTripCUID,
      };
      const result = validateLinkToTripInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject invalid tripId format", () => {
      const input = {
        sponsorId: validSponsorCUID,
        tripId: "invalid-trip",
      };
      const result = validateLinkToTripInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing sponsorId", () => {
      const input = { tripId: validTripCUID };
      const result = validateLinkToTripInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing tripId", () => {
      const input = { sponsorId: validSponsorCUID };
      const result = validateLinkToTripInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validateUnlinkFromTripInput", () => {
    it("should validate valid sponsor and trip IDs", () => {
      const input = {
        sponsorId: validSponsorCUID,
        tripId: validTripCUID,
      };
      const result = validateUnlinkFromTripInput(input);
      expect(result.success).toBe(true);
    });

    it("should reject invalid sponsorId format", () => {
      const input = {
        sponsorId: "not-a-cuid",
        tripId: validTripCUID,
      };
      const result = validateUnlinkFromTripInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject invalid tripId format", () => {
      const input = {
        sponsorId: validSponsorCUID,
        tripId: "not-a-cuid",
      };
      const result = validateUnlinkFromTripInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing sponsorId", () => {
      const input = { tripId: validTripCUID };
      const result = validateUnlinkFromTripInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing tripId", () => {
      const input = { sponsorId: validSponsorCUID };
      const result = validateUnlinkFromTripInput(input);
      expect(result.success).toBe(false);
    });
  });
});

/*
 * Summary
 *
 * Tests cover:
 * - validateGetByIdInput: CUID validation (c[a-z0-9]{24} pattern)
 * - validateGetByTripIdInput: CUID validation for tripId
 * - validateCreateSponsorInput: comprehensive validation including:
 *   - Required: name (1-200 chars), description (1-2000 chars), logoPath (non-empty string)
 *   - Optional: height/offsetX/offsetY (null or non-negative integers), isActive (boolean)
 * - validateUpdateSponsorInput: partial updates with sponsorId (CUID) + optional fields
 * - validateDeleteSponsorInput: CUID validation
 * - validateListInput: pagination with limit (1-100), offset (>=0, both integers),
 *                    optional activeOnly (boolean)
 * - validateLinkToTripInput: sponsorId (CUID) + tripId (CUID)
 * - validateUnlinkFromTripInput: sponsorId (CUID) + tripId (CUID)
 *
 * All validators tested with:
 * - Valid inputs (success cases)
 * - CUID format validation (must start with 'c', 25 chars total, lowercase alphanumeric)
 * - String length boundaries for name (1-200), description (1-2000), logoPath (required)
 * - Integer validation for height, offsetX, offsetY (>= 0)
 * - Missing required vs optional fields
 * - Type validation for booleans and integers
 */
