import { describe, it, expect } from "bun:test";
import {
  validateGetMyVotesInput,
  validateGetByChallengeInput,
  validateGetVotingProgressInput,
  validateGetJudgedStaffProgressInput,
  validateSubmitVoteInput,
  validateSubmitVotesInput,
  validateForceEndVotingInput,
} from "./vote-schema";

describe("[UNIT] Challenge Vote Validators", () => {
  const validChallengeId = "550e8400-e29b-41d4-a716-446655440000";
  const validTripId = "550e8400-e29b-41d4-a716-446655440001";
  const validVoterId = "550e8400-e29b-41d4-a716-446655440002";
  const validSubmissionId = "550e8400-e29b-41d4-a716-446655440003";
  const validAdminId = "550e8400-e29b-41d4-a716-446655440004";

  describe("validateGetMyVotesInput", () => {
    it("should validate valid input", () => {
      const input = {
        challengeId: validChallengeId,
        voterId: validVoterId,
      };
      const result = validateGetMyVotesInput(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.challengeId).toBe(validChallengeId);
        expect(result.data.voterId).toBe(validVoterId);
      }
    });

    it("should reject empty challengeId", () => {
      const input = {
        challengeId: "",
        voterId: validVoterId,
      };
      const result = validateGetMyVotesInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject empty voterId", () => {
      const input = {
        challengeId: validChallengeId,
        voterId: "",
      };
      const result = validateGetMyVotesInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing challengeId", () => {
      const input = { voterId: validVoterId };
      const result = validateGetMyVotesInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing voterId", () => {
      const input = { challengeId: validChallengeId };
      const result = validateGetMyVotesInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validateGetByChallengeInput", () => {
    it("should validate valid challengeId", () => {
      const input = { challengeId: validChallengeId };
      const result = validateGetByChallengeInput(input);
      expect(result.success).toBe(true);
    });

    it("should reject empty challengeId", () => {
      const input = { challengeId: "" };
      const result = validateGetByChallengeInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing challengeId", () => {
      const input = {};
      const result = validateGetByChallengeInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validateGetVotingProgressInput", () => {
    it("should validate valid challengeId", () => {
      const input = { challengeId: validChallengeId };
      const result = validateGetVotingProgressInput(input);
      expect(result.success).toBe(true);
    });

    it("should reject empty challengeId", () => {
      const input = { challengeId: "" };
      const result = validateGetVotingProgressInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing challengeId", () => {
      const input = {};
      const result = validateGetVotingProgressInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validateGetJudgedStaffProgressInput", () => {
    it("should validate valid input", () => {
      const input = {
        challengeId: validChallengeId,
        tripId: validTripId,
        adminParticipantIds: [validAdminId, "admin-456"],
        requiredPositions: 3,
        eligibleSubmissionsCount: 10,
      };
      const result = validateGetJudgedStaffProgressInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with single admin", () => {
      const input = {
        challengeId: validChallengeId,
        tripId: validTripId,
        adminParticipantIds: [validAdminId],
        requiredPositions: 1,
        eligibleSubmissionsCount: 5,
      };
      const result = validateGetJudgedStaffProgressInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with requiredPositions = 3 (maximum)", () => {
      const input = {
        challengeId: validChallengeId,
        tripId: validTripId,
        adminParticipantIds: [validAdminId, "admin-2", "admin-3"],
        requiredPositions: 3,
        eligibleSubmissionsCount: 0,
      };
      const result = validateGetJudgedStaffProgressInput(input);
      expect(result.success).toBe(true);
    });

    it("should reject empty challengeId", () => {
      const input = {
        challengeId: "",
        tripId: validTripId,
        adminParticipantIds: [validAdminId],
        requiredPositions: 3,
        eligibleSubmissionsCount: 10,
      };
      const result = validateGetJudgedStaffProgressInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject empty tripId", () => {
      const input = {
        challengeId: validChallengeId,
        tripId: "",
        adminParticipantIds: [validAdminId],
        requiredPositions: 3,
        eligibleSubmissionsCount: 10,
      };
      const result = validateGetJudgedStaffProgressInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject empty adminParticipantIds array", () => {
      const input = {
        challengeId: validChallengeId,
        tripId: validTripId,
        adminParticipantIds: [],
        requiredPositions: 3,
        eligibleSubmissionsCount: 10,
      };
      const result = validateGetJudgedStaffProgressInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject requiredPositions = 0", () => {
      const input = {
        challengeId: validChallengeId,
        tripId: validTripId,
        adminParticipantIds: [validAdminId],
        requiredPositions: 0,
        eligibleSubmissionsCount: 10,
      };
      const result = validateGetJudgedStaffProgressInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject requiredPositions > 3", () => {
      const input = {
        challengeId: validChallengeId,
        tripId: validTripId,
        adminParticipantIds: [validAdminId],
        requiredPositions: 4,
        eligibleSubmissionsCount: 10,
      };
      const result = validateGetJudgedStaffProgressInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject negative eligibleSubmissionsCount", () => {
      const input = {
        challengeId: validChallengeId,
        tripId: validTripId,
        adminParticipantIds: [validAdminId],
        requiredPositions: 3,
        eligibleSubmissionsCount: -1,
      };
      const result = validateGetJudgedStaffProgressInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject non-integer requiredPositions", () => {
      const input = {
        challengeId: validChallengeId,
        tripId: validTripId,
        adminParticipantIds: [validAdminId],
        requiredPositions: 2.5,
        eligibleSubmissionsCount: 10,
      };
      const result = validateGetJudgedStaffProgressInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject non-integer eligibleSubmissionsCount", () => {
      const input = {
        challengeId: validChallengeId,
        tripId: validTripId,
        adminParticipantIds: [validAdminId],
        requiredPositions: 3,
        eligibleSubmissionsCount: 10.5,
      };
      const result = validateGetJudgedStaffProgressInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing challengeId", () => {
      const input = {
        tripId: validTripId,
        adminParticipantIds: [validAdminId],
        requiredPositions: 3,
        eligibleSubmissionsCount: 10,
      };
      const result = validateGetJudgedStaffProgressInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing tripId", () => {
      const input = {
        challengeId: validChallengeId,
        adminParticipantIds: [validAdminId],
        requiredPositions: 3,
        eligibleSubmissionsCount: 10,
      };
      const result = validateGetJudgedStaffProgressInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing adminParticipantIds", () => {
      const input = {
        challengeId: validChallengeId,
        tripId: validTripId,
        requiredPositions: 3,
        eligibleSubmissionsCount: 10,
      };
      const result = validateGetJudgedStaffProgressInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing requiredPositions", () => {
      const input = {
        challengeId: validChallengeId,
        tripId: validTripId,
        adminParticipantIds: [validAdminId],
        eligibleSubmissionsCount: 10,
      };
      const result = validateGetJudgedStaffProgressInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing eligibleSubmissionsCount", () => {
      const input = {
        challengeId: validChallengeId,
        tripId: validTripId,
        adminParticipantIds: [validAdminId],
        requiredPositions: 3,
      };
      const result = validateGetJudgedStaffProgressInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validateSubmitVoteInput", () => {
    it("should validate minimal vote", () => {
      const input = {
        challengeId: validChallengeId,
        submissionId: validSubmissionId,
        voterId: validVoterId,
        position: 1,
      };
      const result = validateSubmitVoteInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with all optional fields", () => {
      const input = {
        challengeId: validChallengeId,
        submissionId: validSubmissionId,
        voterId: validVoterId,
        position: 2,
        points: 50,
        normalizedWeight: 0.75,
        allowPartial: true,
      };
      const result = validateSubmitVoteInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with position = 1 (minimum)", () => {
      const input = {
        challengeId: validChallengeId,
        submissionId: validSubmissionId,
        voterId: validVoterId,
        position: 1,
      };
      const result = validateSubmitVoteInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with position = 3 (maximum)", () => {
      const input = {
        challengeId: validChallengeId,
        submissionId: validSubmissionId,
        voterId: validVoterId,
        position: 3,
      };
      const result = validateSubmitVoteInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with points = 0", () => {
      const input = {
        challengeId: validChallengeId,
        submissionId: validSubmissionId,
        voterId: validVoterId,
        position: 1,
        points: 0,
      };
      const result = validateSubmitVoteInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with allowPartial = false", () => {
      const input = {
        challengeId: validChallengeId,
        submissionId: validSubmissionId,
        voterId: validVoterId,
        position: 1,
        allowPartial: false,
      };
      const result = validateSubmitVoteInput(input);
      expect(result.success).toBe(true);
    });

    it("should reject position = 0", () => {
      const input = {
        challengeId: validChallengeId,
        submissionId: validSubmissionId,
        voterId: validVoterId,
        position: 0,
      };
      const result = validateSubmitVoteInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject position > 3", () => {
      const input = {
        challengeId: validChallengeId,
        submissionId: validSubmissionId,
        voterId: validVoterId,
        position: 4,
      };
      const result = validateSubmitVoteInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject negative position", () => {
      const input = {
        challengeId: validChallengeId,
        submissionId: validSubmissionId,
        voterId: validVoterId,
        position: -1,
      };
      const result = validateSubmitVoteInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject non-integer position", () => {
      const input = {
        challengeId: validChallengeId,
        submissionId: validSubmissionId,
        voterId: validVoterId,
        position: 1.5,
      };
      const result = validateSubmitVoteInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject negative points", () => {
      const input = {
        challengeId: validChallengeId,
        submissionId: validSubmissionId,
        voterId: validVoterId,
        position: 1,
        points: -10,
      };
      const result = validateSubmitVoteInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject non-integer points", () => {
      const input = {
        challengeId: validChallengeId,
        submissionId: validSubmissionId,
        voterId: validVoterId,
        position: 1,
        points: 10.5,
      };
      const result = validateSubmitVoteInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject normalizedWeight = 0", () => {
      const input = {
        challengeId: validChallengeId,
        submissionId: validSubmissionId,
        voterId: validVoterId,
        position: 1,
        normalizedWeight: 0,
      };
      const result = validateSubmitVoteInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject negative normalizedWeight", () => {
      const input = {
        challengeId: validChallengeId,
        submissionId: validSubmissionId,
        voterId: validVoterId,
        position: 1,
        normalizedWeight: -0.5,
      };
      const result = validateSubmitVoteInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject empty challengeId", () => {
      const input = {
        challengeId: "",
        submissionId: validSubmissionId,
        voterId: validVoterId,
        position: 1,
      };
      const result = validateSubmitVoteInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject empty submissionId", () => {
      const input = {
        challengeId: validChallengeId,
        submissionId: "",
        voterId: validVoterId,
        position: 1,
      };
      const result = validateSubmitVoteInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject empty voterId", () => {
      const input = {
        challengeId: validChallengeId,
        submissionId: validSubmissionId,
        voterId: "",
        position: 1,
      };
      const result = validateSubmitVoteInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject non-boolean allowPartial", () => {
      const input = {
        challengeId: validChallengeId,
        submissionId: validSubmissionId,
        voterId: validVoterId,
        position: 1,
        allowPartial: "true",
      };
      const result = validateSubmitVoteInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing challengeId", () => {
      const input = {
        submissionId: validSubmissionId,
        voterId: validVoterId,
        position: 1,
      };
      const result = validateSubmitVoteInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing submissionId", () => {
      const input = {
        challengeId: validChallengeId,
        voterId: validVoterId,
        position: 1,
      };
      const result = validateSubmitVoteInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing voterId", () => {
      const input = {
        challengeId: validChallengeId,
        submissionId: validSubmissionId,
        position: 1,
      };
      const result = validateSubmitVoteInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing position", () => {
      const input = {
        challengeId: validChallengeId,
        submissionId: validSubmissionId,
        voterId: validVoterId,
      };
      const result = validateSubmitVoteInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validateSubmitVotesInput", () => {
    it("should validate single vote", () => {
      const input = {
        challengeId: validChallengeId,
        voterId: validVoterId,
        votes: [
          {
            submissionId: validSubmissionId,
            position: 1,
          },
        ],
        requiredPositions: 3,
      };
      const result = validateSubmitVotesInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate multiple votes", () => {
      const input = {
        challengeId: validChallengeId,
        voterId: validVoterId,
        votes: [
          { submissionId: "sub-1", position: 1, points: 100 },
          { submissionId: "sub-2", position: 2, points: 75 },
          { submissionId: "sub-3", position: 3, points: 50 },
        ],
        requiredPositions: 3,
      };
      const result = validateSubmitVotesInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate votes with all fields", () => {
      const input = {
        challengeId: validChallengeId,
        voterId: validVoterId,
        votes: [
          {
            submissionId: validSubmissionId,
            position: 1,
            points: 100,
            normalizedWeight: 1.0,
          },
        ],
        requiredPositions: 1,
      };
      const result = validateSubmitVotesInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with requiredPositions = 1 (minimum)", () => {
      const input = {
        challengeId: validChallengeId,
        voterId: validVoterId,
        votes: [{ submissionId: validSubmissionId, position: 1 }],
        requiredPositions: 1,
      };
      const result = validateSubmitVotesInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with requiredPositions = 3 (maximum)", () => {
      const input = {
        challengeId: validChallengeId,
        voterId: validVoterId,
        votes: [
          { submissionId: "sub-1", position: 1 },
          { submissionId: "sub-2", position: 2 },
          { submissionId: "sub-3", position: 3 },
        ],
        requiredPositions: 3,
      };
      const result = validateSubmitVotesInput(input);
      expect(result.success).toBe(true);
    });

    it("should reject empty votes array", () => {
      const input = {
        challengeId: validChallengeId,
        voterId: validVoterId,
        votes: [],
        requiredPositions: 3,
      };
      const result = validateSubmitVotesInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject empty submissionId in vote", () => {
      const input = {
        challengeId: validChallengeId,
        voterId: validVoterId,
        votes: [{ submissionId: "", position: 1 }],
        requiredPositions: 3,
      };
      const result = validateSubmitVotesInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject position = 0 in vote", () => {
      const input = {
        challengeId: validChallengeId,
        voterId: validVoterId,
        votes: [{ submissionId: validSubmissionId, position: 0 }],
        requiredPositions: 3,
      };
      const result = validateSubmitVotesInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject position > 3 in vote", () => {
      const input = {
        challengeId: validChallengeId,
        voterId: validVoterId,
        votes: [{ submissionId: validSubmissionId, position: 4 }],
        requiredPositions: 3,
      };
      const result = validateSubmitVotesInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject negative points in vote", () => {
      const input = {
        challengeId: validChallengeId,
        voterId: validVoterId,
        votes: [{ submissionId: validSubmissionId, position: 1, points: -5 }],
        requiredPositions: 3,
      };
      const result = validateSubmitVotesInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject non-integer points in vote", () => {
      const input = {
        challengeId: validChallengeId,
        voterId: validVoterId,
        votes: [{ submissionId: validSubmissionId, position: 1, points: 5.5 }],
        requiredPositions: 3,
      };
      const result = validateSubmitVotesInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject normalizedWeight = 0 in vote", () => {
      const input = {
        challengeId: validChallengeId,
        voterId: validVoterId,
        votes: [
          { submissionId: validSubmissionId, position: 1, normalizedWeight: 0 },
        ],
        requiredPositions: 3,
      };
      const result = validateSubmitVotesInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject negative normalizedWeight in vote", () => {
      const input = {
        challengeId: validChallengeId,
        voterId: validVoterId,
        votes: [
          {
            submissionId: validSubmissionId,
            position: 1,
            normalizedWeight: -0.1,
          },
        ],
        requiredPositions: 3,
      };
      const result = validateSubmitVotesInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject requiredPositions = 0", () => {
      const input = {
        challengeId: validChallengeId,
        voterId: validVoterId,
        votes: [{ submissionId: validSubmissionId, position: 1 }],
        requiredPositions: 0,
      };
      const result = validateSubmitVotesInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject requiredPositions > 3", () => {
      const input = {
        challengeId: validChallengeId,
        voterId: validVoterId,
        votes: [{ submissionId: validSubmissionId, position: 1 }],
        requiredPositions: 4,
      };
      const result = validateSubmitVotesInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject non-integer requiredPositions", () => {
      const input = {
        challengeId: validChallengeId,
        voterId: validVoterId,
        votes: [{ submissionId: validSubmissionId, position: 1 }],
        requiredPositions: 2.5,
      };
      const result = validateSubmitVotesInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject empty challengeId", () => {
      const input = {
        challengeId: "",
        voterId: validVoterId,
        votes: [{ submissionId: validSubmissionId, position: 1 }],
        requiredPositions: 3,
      };
      const result = validateSubmitVotesInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject empty voterId", () => {
      const input = {
        challengeId: validChallengeId,
        voterId: "",
        votes: [{ submissionId: validSubmissionId, position: 1 }],
        requiredPositions: 3,
      };
      const result = validateSubmitVotesInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing challengeId", () => {
      const input = {
        voterId: validVoterId,
        votes: [{ submissionId: validSubmissionId, position: 1 }],
        requiredPositions: 3,
      };
      const result = validateSubmitVotesInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing voterId", () => {
      const input = {
        challengeId: validChallengeId,
        votes: [{ submissionId: validSubmissionId, position: 1 }],
        requiredPositions: 3,
      };
      const result = validateSubmitVotesInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing votes", () => {
      const input = {
        challengeId: validChallengeId,
        voterId: validVoterId,
        requiredPositions: 3,
      };
      const result = validateSubmitVotesInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing requiredPositions", () => {
      const input = {
        challengeId: validChallengeId,
        voterId: validVoterId,
        votes: [{ submissionId: validSubmissionId, position: 1 }],
      };
      const result = validateSubmitVotesInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validateForceEndVotingInput", () => {
    it("should validate valid input", () => {
      const input = {
        challengeId: validChallengeId,
        tripId: validTripId,
        adminId: validAdminId,
      };
      const result = validateForceEndVotingInput(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.challengeId).toBe(validChallengeId);
        expect(result.data.tripId).toBe(validTripId);
        expect(result.data.adminId).toBe(validAdminId);
      }
    });

    it("should reject empty challengeId", () => {
      const input = {
        challengeId: "",
        tripId: validTripId,
        adminId: validAdminId,
      };
      const result = validateForceEndVotingInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject empty tripId", () => {
      const input = {
        challengeId: validChallengeId,
        tripId: "",
        adminId: validAdminId,
      };
      const result = validateForceEndVotingInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject empty adminId", () => {
      const input = {
        challengeId: validChallengeId,
        tripId: validTripId,
        adminId: "",
      };
      const result = validateForceEndVotingInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing challengeId", () => {
      const input = {
        tripId: validTripId,
        adminId: validAdminId,
      };
      const result = validateForceEndVotingInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing tripId", () => {
      const input = {
        challengeId: validChallengeId,
        adminId: validAdminId,
      };
      const result = validateForceEndVotingInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing adminId", () => {
      const input = {
        challengeId: validChallengeId,
        tripId: validTripId,
      };
      const result = validateForceEndVotingInput(input);
      expect(result.success).toBe(false);
    });
  });
});

/*
 * Summary
 *
 * Tests cover:
 * - validateGetMyVotesInput: challengeId (string) + voterId (string)
 * - validateGetByChallengeInput: challengeId (string)
 * - validateGetVotingProgressInput: challengeId (string)
 * - validateGetJudgedStaffProgressInput: challengeId + tripId + adminParticipantIds (non-empty array) +
 *                                       requiredPositions (1-3, int) + eligibleSubmissionsCount (>=0, int)
 * - validateSubmitVoteInput: challengeId + submissionId + voterId (all strings) +
 *                           position (1-3, int) + optional points (>=0, int),
 *                           optional normalizedWeight (>0), optional allowPartial (boolean)
 * - validateSubmitVotesInput: challengeId + voterId (strings) + votes (non-empty array) +
 *                            requiredPositions (1-3, int)
 *   - Vote items: submissionId (string), position (1-3, int), optional points (>=0, int),
 *                optional normalizedWeight (>0)
 * - validateForceEndVotingInput: challengeId + tripId + adminId (all strings, non-empty)
 *
 * All validators tested with:
 * - Valid inputs (success cases)
 * - Invalid position values (0, >3, negative, non-integer)
 * - Integer validation for all numeric fields (position, points, requiredPositions, etc.)
 * - Boundary values (1-3 for positions, >=0 for counts and points, >0 for normalizedWeight)
 * - NonEmptyArray validation for votes and adminParticipantIds
 * - Missing required vs optional fields
 * - Type validation for booleans
 */
