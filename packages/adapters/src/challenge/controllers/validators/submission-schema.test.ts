import { describe, it, expect } from "bun:test";
import {
  validateGetByIdInput,
  validateGetByChallengeAndGroupInput,
  validateGetByChallengeInput,
  validateCreateInput,
  validateUpdateInput,
  validateDeleteInput,
} from "./submission-schema";

describe("[UNIT] Challenge Submission Validators", () => {
  const validSubmissionId = "sub-123";
  const validChallengeId = "550e8400-e29b-41d4-a716-446655440000";
  const validGroupId = "550e8400-e29b-41d4-a716-446655440001";
  const validVideoId = "video-456";

  describe("validateGetByIdInput", () => {
    it("should validate valid submission ID", () => {
      const input = { submissionId: validSubmissionId };
      const result = validateGetByIdInput(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.submissionId).toBe(validSubmissionId);
      }
    });

    it("should reject empty submissionId", () => {
      const input = { submissionId: "" };
      const result = validateGetByIdInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing submissionId", () => {
      const input = {};
      const result = validateGetByIdInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validateGetByChallengeAndGroupInput", () => {
    it("should validate valid IDs", () => {
      const input = {
        challengeId: validChallengeId,
        groupId: validGroupId,
      };
      const result = validateGetByChallengeAndGroupInput(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.challengeId).toBe(validChallengeId);
        expect(result.data.groupId).toBe(validGroupId);
      }
    });

    it("should reject empty challengeId", () => {
      const input = {
        challengeId: "",
        groupId: validGroupId,
      };
      const result = validateGetByChallengeAndGroupInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject empty groupId", () => {
      const input = {
        challengeId: validChallengeId,
        groupId: "",
      };
      const result = validateGetByChallengeAndGroupInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing challengeId", () => {
      const input = { groupId: validGroupId };
      const result = validateGetByChallengeAndGroupInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing groupId", () => {
      const input = { challengeId: validChallengeId };
      const result = validateGetByChallengeAndGroupInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validateGetByChallengeInput", () => {
    it("should validate with challengeId only", () => {
      const input = { challengeId: validChallengeId };
      const result = validateGetByChallengeInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with sorting options", () => {
      const input = {
        challengeId: validChallengeId,
        orderBy: "voteScore" as const,
        orderDirection: "desc" as const,
      };
      const result = validateGetByChallengeInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with pagination", () => {
      const input = {
        challengeId: validChallengeId,
        limit: 20,
        offset: 10,
      };
      const result = validateGetByChallengeInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with all options", () => {
      const input = {
        challengeId: validChallengeId,
        orderBy: "createdAt" as const,
        orderDirection: "asc" as const,
        limit: 50,
        offset: 0,
      };
      const result = validateGetByChallengeInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with limit = 1 (minimum)", () => {
      const input = {
        challengeId: validChallengeId,
        limit: 1,
      };
      const result = validateGetByChallengeInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with limit = 100 (maximum)", () => {
      const input = {
        challengeId: validChallengeId,
        limit: 100,
      };
      const result = validateGetByChallengeInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with offset = 0 (minimum)", () => {
      const input = {
        challengeId: validChallengeId,
        offset: 0,
      };
      const result = validateGetByChallengeInput(input);
      expect(result.success).toBe(true);
    });

    it("should reject empty challengeId", () => {
      const input = { challengeId: "" };
      const result = validateGetByChallengeInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject invalid orderBy", () => {
      const input = {
        challengeId: validChallengeId,
        orderBy: "invalid" as const,
      };
      const result = validateGetByChallengeInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject invalid orderDirection", () => {
      const input = {
        challengeId: validChallengeId,
        orderDirection: "up" as const,
      };
      const result = validateGetByChallengeInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject limit = 0", () => {
      const input = {
        challengeId: validChallengeId,
        limit: 0,
      };
      const result = validateGetByChallengeInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject limit > 100", () => {
      const input = {
        challengeId: validChallengeId,
        limit: 101,
      };
      const result = validateGetByChallengeInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject negative offset", () => {
      const input = {
        challengeId: validChallengeId,
        offset: -1,
      };
      const result = validateGetByChallengeInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject non-integer limit", () => {
      const input = {
        challengeId: validChallengeId,
        limit: 10.5,
      };
      const result = validateGetByChallengeInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject non-integer offset", () => {
      const input = {
        challengeId: validChallengeId,
        offset: 5.5,
      };
      const result = validateGetByChallengeInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing challengeId", () => {
      const input = {};
      const result = validateGetByChallengeInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validateCreateInput", () => {
    it("should validate minimal valid input", () => {
      const input = {
        challengeId: validChallengeId,
        groupId: validGroupId,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with imageIds", () => {
      const input = {
        challengeId: validChallengeId,
        groupId: validGroupId,
        imageIds: ["img1", "img2", "img3"],
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with maximum imageIds (10)", () => {
      const input = {
        challengeId: validChallengeId,
        groupId: validGroupId,
        imageIds: Array(10).fill("image"),
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with videoId", () => {
      const input = {
        challengeId: validChallengeId,
        groupId: validGroupId,
        videoId: validVideoId,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with textContent", () => {
      const input = {
        challengeId: validChallengeId,
        groupId: validGroupId,
        textContent: "This is our submission description",
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with coordinates", () => {
      const input = {
        challengeId: validChallengeId,
        groupId: validGroupId,
        latitude: 52.2297,
        longitude: 21.0122,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with all fields", () => {
      const input = {
        challengeId: validChallengeId,
        groupId: validGroupId,
        imageIds: ["img1", "img2"],
        videoId: validVideoId,
        textContent: "Complete submission",
        latitude: 40.7128,
        longitude: -74.006,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate latitude = -90 (minimum)", () => {
      const input = {
        challengeId: validChallengeId,
        groupId: validGroupId,
        latitude: -90,
        longitude: 0,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate latitude = 90 (maximum)", () => {
      const input = {
        challengeId: validChallengeId,
        groupId: validGroupId,
        latitude: 90,
        longitude: 0,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate longitude = -180 (minimum)", () => {
      const input = {
        challengeId: validChallengeId,
        groupId: validGroupId,
        latitude: 0,
        longitude: -180,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate longitude = 180 (maximum)", () => {
      const input = {
        challengeId: validChallengeId,
        groupId: validGroupId,
        latitude: 0,
        longitude: 180,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(true);
    });

    it("should reject empty challengeId", () => {
      const input = {
        challengeId: "",
        groupId: validGroupId,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject empty groupId", () => {
      const input = {
        challengeId: validChallengeId,
        groupId: "",
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject more than 10 imageIds", () => {
      const input = {
        challengeId: validChallengeId,
        groupId: validGroupId,
        imageIds: Array(11).fill("image"),
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject empty imageIds", () => {
      const input = {
        challengeId: validChallengeId,
        groupId: validGroupId,
        imageIds: [""],
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject empty videoId", () => {
      const input = {
        challengeId: validChallengeId,
        groupId: validGroupId,
        videoId: "",
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject textContent exceeding 10000 characters", () => {
      const input = {
        challengeId: validChallengeId,
        groupId: validGroupId,
        textContent: "A".repeat(10001),
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject latitude < -90", () => {
      const input = {
        challengeId: validChallengeId,
        groupId: validGroupId,
        latitude: -91,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject latitude > 90", () => {
      const input = {
        challengeId: validChallengeId,
        groupId: validGroupId,
        latitude: 91,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject longitude < -180", () => {
      const input = {
        challengeId: validChallengeId,
        groupId: validGroupId,
        longitude: -181,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject longitude > 180", () => {
      const input = {
        challengeId: validChallengeId,
        groupId: validGroupId,
        longitude: 181,
      };
      const result = validateCreateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing challengeId", () => {
      const input = { groupId: validGroupId };
      const result = validateCreateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing groupId", () => {
      const input = { challengeId: validChallengeId };
      const result = validateCreateInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validateUpdateInput", () => {
    it("should validate with submissionId only", () => {
      const input = { submissionId: validSubmissionId };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with imageIds update", () => {
      const input = {
        submissionId: validSubmissionId,
        imageIds: ["new-img1", "new-img2"],
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with videoId update (string)", () => {
      const input = {
        submissionId: validSubmissionId,
        videoId: "new-video",
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with videoId update (null)", () => {
      const input = {
        submissionId: validSubmissionId,
        videoId: null,
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with textContent update (string)", () => {
      const input = {
        submissionId: validSubmissionId,
        textContent: "Updated description",
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with textContent update (null)", () => {
      const input = {
        submissionId: validSubmissionId,
        textContent: null,
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with coordinates update (both numbers)", () => {
      const input = {
        submissionId: validSubmissionId,
        latitude: 51.5074,
        longitude: -0.1278,
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with coordinates update (nulls)", () => {
      const input = {
        submissionId: validSubmissionId,
        latitude: null,
        longitude: null,
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with review action", () => {
      const input = {
        submissionId: validSubmissionId,
        reviewAction: "APPROVE" as const,
        reviewedById: "admin-123",
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with REJECT review action", () => {
      const input = {
        submissionId: validSubmissionId,
        reviewAction: "REJECT" as const,
        reviewedById: "admin-123",
        rejectionReason: "Does not meet requirements",
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with points awarded", () => {
      const input = {
        submissionId: validSubmissionId,
        awardedPoints: 100,
        bonusPoints: 25,
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with ranking", () => {
      const input = {
        submissionId: validSubmissionId,
        ranking: 2,
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with ranking = null", () => {
      const input = {
        submissionId: validSubmissionId,
        ranking: null,
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with ranking = 1 (minimum)", () => {
      const input = {
        submissionId: validSubmissionId,
        ranking: 1,
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with ranking = 3 (maximum)", () => {
      const input = {
        submissionId: validSubmissionId,
        ranking: 3,
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(true);
    });

    it("should reject empty submissionId", () => {
      const input = {
        submissionId: "",
        textContent: "Updated",
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject empty imageIds", () => {
      const input = {
        submissionId: validSubmissionId,
        imageIds: [""],
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject empty videoId", () => {
      const input = {
        submissionId: validSubmissionId,
        videoId: "",
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject textContent exceeding 10000 characters", () => {
      const input = {
        submissionId: validSubmissionId,
        textContent: "A".repeat(10001),
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject invalid latitude", () => {
      const input = {
        submissionId: validSubmissionId,
        latitude: 95,
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject invalid longitude", () => {
      const input = {
        submissionId: validSubmissionId,
        longitude: -200,
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject invalid reviewAction", () => {
      const input = {
        submissionId: validSubmissionId,
        reviewAction: "INVALID" as const,
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject rejectionReason exceeding 1000 characters", () => {
      const input = {
        submissionId: validSubmissionId,
        reviewAction: "REJECT" as const,
        rejectionReason: "A".repeat(1001),
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject negative awardedPoints", () => {
      const input = {
        submissionId: validSubmissionId,
        awardedPoints: -10,
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject non-integer awardedPoints", () => {
      const input = {
        submissionId: validSubmissionId,
        awardedPoints: 10.5,
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject negative bonusPoints", () => {
      const input = {
        submissionId: validSubmissionId,
        bonusPoints: -5,
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject non-integer bonusPoints", () => {
      const input = {
        submissionId: validSubmissionId,
        bonusPoints: 5.5,
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject ranking = 0", () => {
      const input = {
        submissionId: validSubmissionId,
        ranking: 0,
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject ranking > 3", () => {
      const input = {
        submissionId: validSubmissionId,
        ranking: 4,
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing submissionId", () => {
      const input = { textContent: "Updated" };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validateDeleteInput", () => {
    it("should validate valid submission ID", () => {
      const input = { submissionId: validSubmissionId };
      const result = validateDeleteInput(input);
      expect(result.success).toBe(true);
    });

    it("should reject empty submissionId", () => {
      const input = { submissionId: "" };
      const result = validateDeleteInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing submissionId", () => {
      const input = {};
      const result = validateDeleteInput(input);
      expect(result.success).toBe(false);
    });
  });
});

/*
 * Summary
 *
 * Tests cover:
 * - validateGetByIdInput: submissionId (string, non-empty)
 * - validateGetByChallengeAndGroupInput: challengeId (string) + groupId (string)
 * - validateGetByChallengeInput: challengeId (string) + optional orderBy/orderDirection (enum),
 *                                optional limit (1-100) and offset (>=0, both integers)
 * - validateCreateInput: challengeId (string) + groupId (string) + optional:
 *   - imageIds (array of 0-10 non-empty strings)
 *   - videoId (non-empty string)
 *   - textContent (max 10000 chars)
 *   - latitude/longitude (-90 to 90, -180 to 180)
 * - validateUpdateInput: submissionId (string) + optional fields:
 *   - imageIds (mutable array of non-empty strings)
 *   - videoId (null or non-empty string)
 *   - textContent (null or max 10000 chars)
 *   - latitude/longitude (null or valid coordinates)
 *   - reviewAction (APPROVE/REJECT enum)
 *   - reviewedById (string)
 *   - rejectionReason (max 1000 chars)
 *   - awardedPoints/bonusPoints (>=0, int)
 *   - ranking (null or 1-3, int)
 * - validateDeleteInput: submissionId (string, non-empty)
 *
 * All validators tested with:
 * - Valid inputs (success cases)
 * - Invalid formats (error cases)
 * - Edge cases (boundary values for coordinates, text length, ranking, pagination)
 * - Enum validation (orderBy, orderDirection, reviewAction)
 * - Array validation (imageIds max 10 items)
 * - Integer validation for numeric fields
 * - Missing required vs optional fields
 */
