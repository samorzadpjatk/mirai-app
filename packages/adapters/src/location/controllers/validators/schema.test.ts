import { describe, it, expect } from "bun:test";
import {
  validateGetByUserIdInput,
  validateCreateInput,
  validateUpdateInput,
  validateListInput,
  validateUpdateSharingSettingsInput,
  validateAddSharingUserInput,
  validateRemoveSharingUserInput,
  validateGetSharingSettingsInput,
  validateDeleteByUserIdInput,
} from "./schema";

describe("[UNIT] Location Validators", () => {
  const validUserId = "550e8400-e29b-41d4-a716-446655440000";
  const validTripId = "550e8400-e29b-41d4-a716-446655440001";
  const validTargetUserId = "550e8400-e29b-41d4-a716-446655440002";

  describe("validateGetByUserIdInput", () => {
    it("should validate valid user ID", () => {
      const input = { userId: validUserId };
      const result = validateGetByUserIdInput(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.userId).toBe(validUserId);
      }
    });

    it("should reject empty userId", () => {
      const input = { userId: "" };
      const result = validateGetByUserIdInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing userId", () => {
      const input = {};
      const result = validateGetByUserIdInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validateCreateInput", () => {
    it("should validate minimal valid input", () => {
      const input = {
        userId: validUserId,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with coordinates", () => {
      const input = {
        userId: validUserId,
        latitude: 52.2297,
        longitude: 21.0122,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with null coordinates", () => {
      const input = {
        userId: validUserId,
        latitude: null,
        longitude: null,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with all location fields", () => {
      const input = {
        userId: validUserId,
        latitude: 52.2297,
        longitude: 21.0122,
        accuracy: 10,
        altitude: 100,
        altitudeAccuracy: 5,
        heading: 90,
        speed: 5.5,
        isSharingLocation: true,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with null optional fields", () => {
      const input = {
        userId: validUserId,
        latitude: 52.2297,
        longitude: 21.0122,
        accuracy: null,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate latitude = -90 (minimum)", () => {
      const input = {
        userId: validUserId,
        latitude: -90,
        longitude: 0,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate latitude = 90 (maximum)", () => {
      const input = {
        userId: validUserId,
        latitude: 90,
        longitude: 0,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate longitude = -180 (minimum)", () => {
      const input = {
        userId: validUserId,
        latitude: 0,
        longitude: -180,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate longitude = 180 (maximum)", () => {
      const input = {
        userId: validUserId,
        latitude: 0,
        longitude: 180,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate accuracy = 0 (minimum)", () => {
      const input = {
        userId: validUserId,
        accuracy: 0,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate heading = 0 (minimum)", () => {
      const input = {
        userId: validUserId,
        heading: 0,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate heading = 360 (maximum)", () => {
      const input = {
        userId: validUserId,
        heading: 360,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate speed = 0 (minimum)", () => {
      const input = {
        userId: validUserId,
        speed: 0,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(true);
    });

    it("should reject latitude < -90", () => {
      const input = {
        userId: validUserId,
        latitude: -91,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject latitude > 90", () => {
      const input = {
        userId: validUserId,
        latitude: 91,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject longitude < -180", () => {
      const input = {
        userId: validUserId,
        longitude: -181,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject longitude > 180", () => {
      const input = {
        userId: validUserId,
        longitude: 181,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject negative accuracy", () => {
      const input = {
        userId: validUserId,
        accuracy: -1,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject negative heading", () => {
      const input = {
        userId: validUserId,
        heading: -1,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject heading > 360", () => {
      const input = {
        userId: validUserId,
        heading: 361,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject negative speed", () => {
      const input = {
        userId: validUserId,
        speed: -1,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject empty userId", () => {
      const input = { userId: "" };
      const result = validateCreateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing userId", () => {
      const input = { latitude: 52.2297 };
      const result = validateCreateInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validateUpdateInput", () => {
    it("should validate same schema as create", () => {
      const input = {
        userId: validUserId,
        latitude: 40.7128,
        longitude: -74.006,
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with null coordinates", () => {
      const input = {
        userId: validUserId,
        latitude: null,
        longitude: null,
        accuracy: null,
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(true);
    });

    it("should reject invalid coordinates", () => {
      const input = {
        userId: validUserId,
        latitude: 95,
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validateListInput", () => {
    it("should validate minimal valid input", () => {
      const input = {
        viewerUserId: validUserId,
      };
      const result = validateListInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with target user IDs", () => {
      const input = {
        viewerUserId: validUserId,
        targetUserIds: [validTargetUserId, "user-456"],
      };
      const result = validateListInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with radius and center coordinates", () => {
      const input = {
        viewerUserId: validUserId,
        radiusKm: 50,
        centerLatitude: 52.2297,
        centerLongitude: 21.0122,
      };
      const result = validateListInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with radius = 0.1 (small)", () => {
      const input = {
        viewerUserId: validUserId,
        radiusKm: 0.1,
        centerLatitude: 52.2297,
        centerLongitude: 21.0122,
      };
      const result = validateListInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with radius = 1000 (maximum)", () => {
      const input = {
        viewerUserId: validUserId,
        radiusKm: 1000,
        centerLatitude: 52.2297,
        centerLongitude: 21.0122,
      };
      const result = validateListInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with empty targetUserIds array", () => {
      const input = {
        viewerUserId: validUserId,
        targetUserIds: [],
      };
      const result = validateListInput(input);
      expect(result.success).toBe(true);
    });

    it("should reject empty viewerUserId", () => {
      const input = { viewerUserId: "" };
      const result = validateListInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject radius without center coordinates", () => {
      const input = {
        viewerUserId: validUserId,
        radiusKm: 50,
      };
      const result = validateListInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject radius with only centerLatitude", () => {
      const input = {
        viewerUserId: validUserId,
        radiusKm: 50,
        centerLatitude: 52.2297,
      };
      const result = validateListInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject radius with only centerLongitude", () => {
      const input = {
        viewerUserId: validUserId,
        radiusKm: 50,
        centerLongitude: 21.0122,
      };
      const result = validateListInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject radius = 0", () => {
      const input = {
        viewerUserId: validUserId,
        radiusKm: 0,
        centerLatitude: 52.2297,
        centerLongitude: 21.0122,
      };
      const result = validateListInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject radius > 1000", () => {
      const input = {
        viewerUserId: validUserId,
        radiusKm: 1001,
        centerLatitude: 52.2297,
        centerLongitude: 21.0122,
      };
      const result = validateListInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject centerLatitude < -90", () => {
      const input = {
        viewerUserId: validUserId,
        radiusKm: 50,
        centerLatitude: -91,
        centerLongitude: 21.0122,
      };
      const result = validateListInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject centerLatitude > 90", () => {
      const input = {
        viewerUserId: validUserId,
        radiusKm: 50,
        centerLatitude: 91,
        centerLongitude: 21.0122,
      };
      const result = validateListInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject centerLongitude < -180", () => {
      const input = {
        viewerUserId: validUserId,
        radiusKm: 50,
        centerLatitude: 52.2297,
        centerLongitude: -181,
      };
      const result = validateListInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject centerLongitude > 180", () => {
      const input = {
        viewerUserId: validUserId,
        radiusKm: 50,
        centerLatitude: 52.2297,
        centerLongitude: 181,
      };
      const result = validateListInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing viewerUserId", () => {
      const input = {};
      const result = validateListInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validateUpdateSharingSettingsInput", () => {
    it("should validate minimal input", () => {
      const input = {
        userId: validUserId,
        isSharingLocation: true,
      };
      const result = validateUpdateSharingSettingsInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with usersToShareWith", () => {
      const input = {
        userId: validUserId,
        isSharingLocation: true,
        usersToShareWith: [
          { id: validTargetUserId, firstName: "Jane", lastName: "Smith" },
        ],
      };
      const result = validateUpdateSharingSettingsInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with multiple users", () => {
      const input = {
        userId: validUserId,
        isSharingLocation: true,
        usersToShareWith: [
          { id: validTargetUserId, firstName: "Jane", lastName: "Smith" },
          { id: "user-456", firstName: "Bob", lastName: null },
        ],
      };
      const result = validateUpdateSharingSettingsInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with null names", () => {
      const input = {
        userId: validUserId,
        isSharingLocation: false,
        usersToShareWith: [
          { id: validTargetUserId, firstName: null, lastName: null },
        ],
      };
      const result = validateUpdateSharingSettingsInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate disabling sharing", () => {
      const input = {
        userId: validUserId,
        isSharingLocation: false,
      };
      const result = validateUpdateSharingSettingsInput(input);
      expect(result.success).toBe(true);
    });

    it("should reject empty userId", () => {
      const input = {
        userId: "",
        isSharingLocation: true,
      };
      const result = validateUpdateSharingSettingsInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject non-boolean isSharingLocation", () => {
      const input = {
        userId: validUserId,
        isSharingLocation: "true",
      };
      const result = validateUpdateSharingSettingsInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing userId", () => {
      const input = { isSharingLocation: true };
      const result = validateUpdateSharingSettingsInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing isSharingLocation", () => {
      const input = { userId: validUserId };
      const result = validateUpdateSharingSettingsInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validateAddSharingUserInput", () => {
    it("should validate with null names", () => {
      const input = {
        ownerUserId: validUserId,
        userToAddId: validTargetUserId,
        userFirstName: null,
        userLastName: null,
      };
      const result = validateAddSharingUserInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with string names", () => {
      const input = {
        ownerUserId: validUserId,
        userToAddId: validTargetUserId,
        userFirstName: "Jane",
        userLastName: "Smith",
      };
      const result = validateAddSharingUserInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with only firstName", () => {
      const input = {
        ownerUserId: validUserId,
        userToAddId: validTargetUserId,
        userFirstName: "Jane",
        userLastName: null,
      };
      const result = validateAddSharingUserInput(input);
      expect(result.success).toBe(true);
    });

    it("should reject empty ownerUserId", () => {
      const input = {
        ownerUserId: "",
        userToAddId: validTargetUserId,
        userFirstName: "Jane",
        userLastName: "Smith",
      };
      const result = validateAddSharingUserInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject empty userToAddId", () => {
      const input = {
        ownerUserId: validUserId,
        userToAddId: "",
        userFirstName: "Jane",
        userLastName: "Smith",
      };
      const result = validateAddSharingUserInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing ownerUserId", () => {
      const input = {
        userToAddId: validTargetUserId,
        userFirstName: "Jane",
        userLastName: "Smith",
      };
      const result = validateAddSharingUserInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing userToAddId", () => {
      const input = {
        ownerUserId: validUserId,
        userFirstName: "Jane",
        userLastName: "Smith",
      };
      const result = validateAddSharingUserInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validateRemoveSharingUserInput", () => {
    it("should validate removing a user", () => {
      const input = {
        ownerUserId: validUserId,
        userToRemoveId: validTargetUserId,
      };
      const result = validateRemoveSharingUserInput(input);
      expect(result.success).toBe(true);
    });

    it("should reject empty ownerUserId", () => {
      const input = {
        ownerUserId: "",
        userToRemoveId: validTargetUserId,
      };
      const result = validateRemoveSharingUserInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject empty userToRemoveId", () => {
      const input = {
        ownerUserId: validUserId,
        userToRemoveId: "",
      };
      const result = validateRemoveSharingUserInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing ownerUserId", () => {
      const input = { userToRemoveId: validTargetUserId };
      const result = validateRemoveSharingUserInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing userToRemoveId", () => {
      const input = { ownerUserId: validUserId };
      const result = validateRemoveSharingUserInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validateGetSharingSettingsInput", () => {
    it("should validate valid user ID", () => {
      const input = { userId: validUserId };
      const result = validateGetSharingSettingsInput(input);
      expect(result.success).toBe(true);
    });

    it("should reject empty userId", () => {
      const input = { userId: "" };
      const result = validateGetSharingSettingsInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing userId", () => {
      const input = {};
      const result = validateGetSharingSettingsInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validateDeleteByUserIdInput", () => {
    it("should validate valid user ID", () => {
      const input = { userId: validUserId };
      const result = validateDeleteByUserIdInput(input);
      expect(result.success).toBe(true);
    });

    it("should reject empty userId", () => {
      const input = { userId: "" };
      const result = validateDeleteByUserIdInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing userId", () => {
      const input = {};
      const result = validateDeleteByUserIdInput(input);
      expect(result.success).toBe(false);
    });
  });
});

/*
 * Summary
 *
 * Tests cover:
 * - validateGetByUserIdInput: userId (string, non-empty)
 * - validateCreateInput: comprehensive location data validation:
 *   - Required: userId
 *   - Optional coordinates: latitude (-90 to 90), longitude (-180 to 180)
 *   - Optional metadata: accuracy (>=0), altitude (number or null),
 *     altitudeAccuracy (>=0 or null), heading (0-360 or null),
 *     speed (>=0 or null), isSharingLocation (boolean)
 * - validateUpdateInput: same schema as create
 * - validateListInput: viewerUserId + optional targetUserIds +
 *   optional radiusKm (0-1000) with required center coordinates
 * - validateUpdateSharingSettingsInput: userId + isSharingLocation +
 *   optional usersToShareWith array
 * - validateAddSharingUserInput: ownerUserId + userToAddId +
 *   userFirstName/userLastName (null or string)
 * - validateRemoveSharingUserInput: ownerUserId + userToRemoveId
 * - validateGetSharingSettingsInput: userId (string, non-empty)
 * - validateDeleteByUserIdInput: userId (string, non-empty)
 *
 * All validators tested with:
 * - Valid inputs (success cases)
 * - Boundary values for coordinates and numeric fields
 * - Cross-field validation (radius requires center coordinates)
 * - Null handling for optional fields
 * - Missing required fields
 * - Type validation for complex nested structures
 */
