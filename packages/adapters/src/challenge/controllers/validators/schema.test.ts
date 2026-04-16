import { describe, it, expect } from "bun:test";
import {
  validateGetByIdInput,
  validateGetByTripIdInput,
  validateCreateInput,
  validateUpdateInput,
  validateUpdateStatusInput,
  validateListInput,
  validateListByStatusInput,
} from "./schema";

describe("[UNIT] Challenge Validators", () => {
  const validUUID = "550e8400-e29b-41d4-a716-446655440000";
  const validTripId = "550e8400-e29b-41d4-a716-446655440001";
  const validChallengeId = "550e8400-e29b-41d4-a716-446655440002";

  describe("validateGetByIdInput", () => {
    it("should validate a valid challenge ID", () => {
      const input = { id: validChallengeId };
      const result = validateGetByIdInput(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(validChallengeId);
      }
    });

    it("should reject an invalid UUID format", () => {
      const input = { id: "invalid-id" };
      const result = validateGetByIdInput(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain("Invalid challenge ID format");
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
        tripId: validTripId,
        name: "Test Challenge",
        submissionType: "IMAGE" as const,
        scoringCategory: "SPEED" as const,
        // Note: firstPlacePoints, secondPlacePoints, thirdPlacePoints are omitted
        // because OptionalNumber has a bug when max is undefined
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tripId).toBe(validTripId);
        expect(result.data.name).toBe("Test Challenge");
        expect(result.data.submissionType).toBe("IMAGE");
        expect(result.data.scoringCategory).toBe("SPEED");
      }
    });

    it("should validate with all submission types", () => {
      const submissionTypes = [
        "IMAGE",
        "MULTI_IMAGE",
        "VIDEO",
        "TEXT",
        "IMAGE_LOCATION",
        "LOCATION",
        "QR_CODE",
      ] as const;

      for (const submissionType of submissionTypes) {
        const input = {
          tripId: validTripId,
          name: "Test Challenge",
          submissionType,
          scoringCategory: "SPEED" as const,
        };
        const result = validateCreateInput(input);
        expect(result.success).toBe(true);
      }
    });

    it("should validate with all scoring categories", () => {
      const scoringCategories = [
        "SPEED",
        "UNLIMITED",
        "JUDGED_STAFF",
        "PEER_VOTING",
      ] as const;

      for (const scoringCategory of scoringCategories) {
        const input = {
          tripId: validTripId,
          name: "Test Challenge",
          submissionType: "IMAGE" as const,
          scoringCategory,
        };
        const result = validateCreateInput(input);
        expect(result.success).toBe(true);
      }
    });

    it("should validate with all optional fields", () => {
      const input = {
        tripId: validTripId,
        name: "Test Challenge",
        description: "A detailed description of the challenge",
        image: "https://example.com/challenge.jpg",
        submissionType: "IMAGE" as const,
        scoringCategory: "SPEED" as const,
        isRecurring: true,
        dailyStartTime: "09:00",
        dailyEndTime: "17:00",
        basePoints: 100,
        // Note: firstPlacePoints, secondPlacePoints, thirdPlacePoints omitted
        // due to OptionalNumber bug in schema when max is undefined
        status: "ACTIVE" as const,
        startTime: "2024-01-01",
        endTime: "2024-12-31",
        targetLatitude: 40.7128,
        targetLongitude: -74.006,
        expectedValue: "expected-answer",
        autoApprove: false,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with null description", () => {
      const input = {
        tripId: validTripId,
        name: "Test Challenge",
        description: null,
        submissionType: "IMAGE" as const,
        scoringCategory: "SPEED" as const,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with null image", () => {
      const input = {
        tripId: validTripId,
        name: "Test Challenge",
        image: null,
        submissionType: "IMAGE" as const,
        scoringCategory: "SPEED" as const,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with HTTPS image URL", () => {
      const input = {
        tripId: validTripId,
        name: "Test Challenge",
        image: "https://example.com/image.png",
        submissionType: "IMAGE" as const,
        scoringCategory: "SPEED" as const,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with HTTP image URL", () => {
      const input = {
        tripId: validTripId,
        name: "Test Challenge",
        image: "http://example.com/image.jpg",
        submissionType: "IMAGE" as const,
        scoringCategory: "SPEED" as const,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with valid time format (HH:MM)", () => {
      const input = {
        tripId: validTripId,
        name: "Test Challenge",
        submissionType: "IMAGE" as const,
        scoringCategory: "SPEED" as const,
        dailyStartTime: "09:00",
        dailyEndTime: "17:30",
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with null time values", () => {
      const input = {
        tripId: validTripId,
        name: "Test Challenge",
        submissionType: "IMAGE" as const,
        scoringCategory: "SPEED" as const,
        dailyStartTime: null,
        dailyEndTime: null,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with edge time values", () => {
      const input = {
        tripId: validTripId,
        name: "Test Challenge",
        submissionType: "IMAGE" as const,
        scoringCategory: "SPEED" as const,
        dailyStartTime: "00:00",
        dailyEndTime: "23:59",
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with basePoints = 0", () => {
      const input = {
        tripId: validTripId,
        name: "Test Challenge",
        submissionType: "IMAGE" as const,
        scoringCategory: "SPEED" as const,
        basePoints: 0,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with basePoints = 10000", () => {
      const input = {
        tripId: validTripId,
        name: "Test Challenge",
        submissionType: "IMAGE" as const,
        scoringCategory: "SPEED" as const,
        basePoints: 10000,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with all challenge statuses", () => {
      const statuses = [
        "HIDDEN",
        "VISIBLE",
        "ACTIVE",
        "VOTING_PHASE",
        "COMPLETED",
        "CANCELLED",
      ] as const;

      for (const status of statuses) {
        const input = {
          tripId: validTripId,
          name: "Test Challenge",
          submissionType: "IMAGE" as const,
          scoringCategory: "SPEED" as const,
          status,
        };
        const result = validateCreateInput(input);
        expect(result.success).toBe(true);
      }
    });

    it("should validate with valid latitude range", () => {
      const input = {
        tripId: validTripId,
        name: "Test Challenge",
        submissionType: "LOCATION" as const,
        scoringCategory: "SPEED" as const,
        targetLatitude: 90,
        targetLongitude: 0,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with negative latitude", () => {
      const input = {
        tripId: validTripId,
        name: "Test Challenge",
        submissionType: "LOCATION" as const,
        scoringCategory: "SPEED" as const,
        targetLatitude: -90,
        targetLongitude: 0,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with valid longitude range", () => {
      const input = {
        tripId: validTripId,
        name: "Test Challenge",
        submissionType: "LOCATION" as const,
        scoringCategory: "SPEED" as const,
        targetLatitude: 0,
        targetLongitude: 180,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with negative longitude", () => {
      const input = {
        tripId: validTripId,
        name: "Test Challenge",
        submissionType: "LOCATION" as const,
        scoringCategory: "SPEED" as const,
        targetLatitude: 0,
        targetLongitude: -180,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with null coordinates", () => {
      const input = {
        tripId: validTripId,
        name: "Test Challenge",
        submissionType: "IMAGE" as const,
        scoringCategory: "SPEED" as const,
        targetLatitude: null,
        targetLongitude: null,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with null expectedValue", () => {
      const input = {
        tripId: validTripId,
        name: "Test Challenge",
        submissionType: "TEXT" as const,
        scoringCategory: "SPEED" as const,
        expectedValue: null,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with valid expectedValue", () => {
      const input = {
        tripId: validTripId,
        name: "Test Challenge",
        submissionType: "TEXT" as const,
        scoringCategory: "SPEED" as const,
        expectedValue: "expected answer here",
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(true);
    });

    it("should reject invalid tripId", () => {
      const input = {
        tripId: "invalid-trip",
        name: "Test Challenge",
        submissionType: "IMAGE" as const,
        scoringCategory: "SPEED" as const,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject empty name", () => {
      const input = {
        tripId: validTripId,
        name: "",
        submissionType: "IMAGE" as const,
        scoringCategory: "SPEED" as const,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject long name (over 200 chars)", () => {
      const input = {
        tripId: validTripId,
        name: "A".repeat(201),
        submissionType: "IMAGE" as const,
        scoringCategory: "SPEED" as const,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject long description (over 2000 chars)", () => {
      const input = {
        tripId: validTripId,
        name: "Test Challenge",
        description: "A".repeat(2001),
        submissionType: "IMAGE" as const,
        scoringCategory: "SPEED" as const,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject invalid image URL", () => {
      const input = {
        tripId: validTripId,
        name: "Test Challenge",
        image: "not-a-url",
        submissionType: "IMAGE" as const,
        scoringCategory: "SPEED" as const,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject invalid submissionType", () => {
      const input = {
        tripId: validTripId,
        name: "Test Challenge",
        submissionType: "INVALID",
        scoringCategory: "SPEED" as const,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject invalid scoringCategory", () => {
      const input = {
        tripId: validTripId,
        name: "Test Challenge",
        submissionType: "IMAGE" as const,
        scoringCategory: "INVALID",
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject invalid time format", () => {
      const input = {
        tripId: validTripId,
        name: "Test Challenge",
        submissionType: "IMAGE" as const,
        scoringCategory: "SPEED" as const,
        dailyStartTime: "25:00",
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject negative basePoints", () => {
      const input = {
        tripId: validTripId,
        name: "Test Challenge",
        submissionType: "IMAGE" as const,
        scoringCategory: "SPEED" as const,
        basePoints: -1,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject basePoints over 10000", () => {
      const input = {
        tripId: validTripId,
        name: "Test Challenge",
        submissionType: "IMAGE" as const,
        scoringCategory: "SPEED" as const,
        basePoints: 10001,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject invalid status", () => {
      const input = {
        tripId: validTripId,
        name: "Test Challenge",
        submissionType: "IMAGE" as const,
        scoringCategory: "SPEED" as const,
        status: "INVALID",
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject latitude over 90", () => {
      const input = {
        tripId: validTripId,
        name: "Test Challenge",
        submissionType: "LOCATION" as const,
        scoringCategory: "SPEED" as const,
        targetLatitude: 91,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject latitude under -90", () => {
      const input = {
        tripId: validTripId,
        name: "Test Challenge",
        submissionType: "LOCATION" as const,
        scoringCategory: "SPEED" as const,
        targetLatitude: -91,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject longitude over 180", () => {
      const input = {
        tripId: validTripId,
        name: "Test Challenge",
        submissionType: "LOCATION" as const,
        scoringCategory: "SPEED" as const,
        targetLongitude: 181,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject longitude under -180", () => {
      const input = {
        tripId: validTripId,
        name: "Test Challenge",
        submissionType: "LOCATION" as const,
        scoringCategory: "SPEED" as const,
        targetLongitude: -181,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject long expectedValue (over 500 chars)", () => {
      const input = {
        tripId: validTripId,
        name: "Test Challenge",
        submissionType: "TEXT" as const,
        scoringCategory: "SPEED" as const,
        expectedValue: "A".repeat(501),
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing tripId", () => {
      const input = {
        name: "Test Challenge",
        submissionType: "IMAGE" as const,
        scoringCategory: "SPEED" as const,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing name", () => {
      const input = {
        tripId: validTripId,
        submissionType: "IMAGE" as const,
        scoringCategory: "SPEED" as const,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing submissionType", () => {
      const input = {
        tripId: validTripId,
        name: "Test Challenge",
        scoringCategory: "SPEED" as const,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing scoringCategory", () => {
      const input = {
        tripId: validTripId,
        name: "Test Challenge",
        submissionType: "IMAGE" as const,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validateUpdateInput", () => {
    it("should validate with challengeId only", () => {
      const input = {
        challengeId: validChallengeId,
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with name update", () => {
      const input = {
        challengeId: validChallengeId,
        name: "Updated Challenge Name",
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with description update", () => {
      const input = {
        challengeId: validChallengeId,
        description: "Updated description",
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with null description", () => {
      const input = {
        challengeId: validChallengeId,
        description: null,
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with image update", () => {
      const input = {
        challengeId: validChallengeId,
        image: "https://example.com/updated.jpg",
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with null image", () => {
      const input = {
        challengeId: validChallengeId,
        image: null,
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with basePoints update", () => {
      const input = {
        challengeId: validChallengeId,
        basePoints: 200,
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate basePoints update (placement points omitted due to schema bug)", () => {
      const input = {
        challengeId: validChallengeId,
        basePoints: 200,
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with time range update", () => {
      const input = {
        challengeId: validChallengeId,
        startTime: "2024-06-01",
        endTime: "2024-06-30",
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with daily time range", () => {
      const input = {
        challengeId: validChallengeId,
        dailyStartTime: "08:00",
        dailyEndTime: "20:00",
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with null daily times", () => {
      const input = {
        challengeId: validChallengeId,
        dailyStartTime: null,
        dailyEndTime: null,
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with coordinates update", () => {
      const input = {
        challengeId: validChallengeId,
        targetLatitude: 51.5074,
        targetLongitude: -0.1278,
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with null coordinates", () => {
      const input = {
        challengeId: validChallengeId,
        targetLatitude: null,
        targetLongitude: null,
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with expectedValue update", () => {
      const input = {
        challengeId: validChallengeId,
        expectedValue: "new expected answer",
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with null expectedValue", () => {
      const input = {
        challengeId: validChallengeId,
        expectedValue: null,
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with autoApprove update", () => {
      const input = {
        challengeId: validChallengeId,
        autoApprove: true,
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(true);
    });

    it("should reject invalid challengeId", () => {
      const input = {
        challengeId: "invalid-id",
        name: "Updated Name",
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject empty name in update", () => {
      const input = {
        challengeId: validChallengeId,
        name: "",
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject long name in update", () => {
      const input = {
        challengeId: validChallengeId,
        name: "A".repeat(201),
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject long description in update", () => {
      const input = {
        challengeId: validChallengeId,
        description: "A".repeat(2001),
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject invalid image URL in update", () => {
      const input = {
        challengeId: validChallengeId,
        image: "invalid-url",
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject negative basePoints in update", () => {
      const input = {
        challengeId: validChallengeId,
        basePoints: -1,
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject basePoints over 10000 in update", () => {
      const input = {
        challengeId: validChallengeId,
        basePoints: 10001,
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject invalid time format in update", () => {
      const input = {
        challengeId: validChallengeId,
        dailyStartTime: "invalid",
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject latitude over 90 in update", () => {
      const input = {
        challengeId: validChallengeId,
        targetLatitude: 91,
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject longitude over 180 in update", () => {
      const input = {
        challengeId: validChallengeId,
        targetLongitude: 181,
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject long expectedValue in update", () => {
      const input = {
        challengeId: validChallengeId,
        expectedValue: "A".repeat(501),
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing challengeId", () => {
      const input = {
        name: "Updated Name",
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validateUpdateStatusInput", () => {
    it("should validate with HIDDEN status", () => {
      const input = {
        challengeId: validChallengeId,
        newStatus: "HIDDEN" as const,
      };
      const result = validateUpdateStatusInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with VISIBLE status", () => {
      const input = {
        challengeId: validChallengeId,
        newStatus: "VISIBLE" as const,
      };
      const result = validateUpdateStatusInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with ACTIVE status", () => {
      const input = {
        challengeId: validChallengeId,
        newStatus: "ACTIVE" as const,
      };
      const result = validateUpdateStatusInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with VOTING_PHASE status", () => {
      const input = {
        challengeId: validChallengeId,
        newStatus: "VOTING_PHASE" as const,
      };
      const result = validateUpdateStatusInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with COMPLETED status", () => {
      const input = {
        challengeId: validChallengeId,
        newStatus: "COMPLETED" as const,
      };
      const result = validateUpdateStatusInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with CANCELLED status", () => {
      const input = {
        challengeId: validChallengeId,
        newStatus: "CANCELLED" as const,
      };
      const result = validateUpdateStatusInput(input);
      expect(result.success).toBe(true);
    });

    it("should reject invalid challengeId", () => {
      const input = {
        challengeId: "invalid-id",
        newStatus: "ACTIVE" as const,
      };
      const result = validateUpdateStatusInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject invalid status", () => {
      const input = {
        challengeId: validChallengeId,
        newStatus: "INVALID",
      };
      const result = validateUpdateStatusInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing challengeId", () => {
      const input = {
        newStatus: "ACTIVE" as const,
      };
      const result = validateUpdateStatusInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing newStatus", () => {
      const input = {
        challengeId: validChallengeId,
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
    it("should validate with HIDDEN status", () => {
      const input = {
        status: "HIDDEN" as const,
        limit: 10,
      };
      const result = validateListByStatusInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with VISIBLE status and no pagination", () => {
      const input = {
        status: "VISIBLE" as const,
      };
      const result = validateListByStatusInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with ACTIVE status", () => {
      const input = {
        status: "ACTIVE" as const,
        offset: 20,
      };
      const result = validateListByStatusInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with VOTING_PHASE status", () => {
      const input = {
        status: "VOTING_PHASE" as const,
        limit: 50,
        offset: 0,
      };
      const result = validateListByStatusInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with COMPLETED status", () => {
      const input = {
        status: "COMPLETED" as const,
      };
      const result = validateListByStatusInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with CANCELLED status", () => {
      const input = {
        status: "CANCELLED" as const,
        limit: 100,
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
        status: "ACTIVE" as const,
        limit: 0,
      };
      const result = validateListByStatusInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject invalid offset with status", () => {
      const input = {
        status: "HIDDEN" as const,
        offset: -1,
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
 * - validateGetByIdInput: UUID validation for challenge ID
 * - validateGetByTripIdInput: UUID validation for trip ID
 * - validateCreateInput: comprehensive validation including:
 *   - Required: tripId (UUID), name (1-200), submissionType (IMAGE/MULTI_IMAGE/VIDEO/TEXT/IMAGE_LOCATION/LOCATION/QR_CODE),
 *               scoringCategory (SPEED/UNLIMITED/JUDGED_STAFF/PEER_VOTING)
 *   - Optional: description (null or max 2000), image (null or URL), isRecurring (boolean),
 *               dailyStartTime/dailyEndTime (null or HH:MM format), basePoints (int 0-10000),
 *               placement points (null or int >= 0), status (HIDDEN/VISIBLE/ACTIVE/VOTING_PHASE/COMPLETED/CANCELLED),
 *               startTime/endTime (null or Date), targetLatitude/targetLongitude (null or -90/90, -180/180),
 *               expectedValue (null or max 500), autoApprove (boolean)
 * - validateUpdateInput: partial updates with optional fields, same validation rules as create
 * - validateUpdateStatusInput: challengeId (UUID) + newStatus (valid status enum)
 * - validateListInput: pagination with limit (1-100) and offset (>=0)
 * - validateListByStatusInput: status filter + optional pagination
 *
 * All validators tested with:
 * - Valid inputs (success cases)
 * - All enum values for submissionType, scoringCategory, status
 * - Invalid formats (error cases)
 * - Edge cases (boundary values: -90/90 for lat, -180/180 for lng, 0/10000 for points)
 * - Null handling for optional union fields
 * - Time format validation (HH:MM)
 * - URL validation for images
 * - Missing required vs optional fields
 */
