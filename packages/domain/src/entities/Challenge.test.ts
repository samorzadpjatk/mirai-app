import { describe, it, expect } from "bun:test";
import {
  Challenge,
  ChallengeStatus,
  SubmissionType,
  ScoringCategory,
} from "./Challenge";

describe("[UNIT] Challenge Entity", () => {
  describe("Challenge.create", () => {
    it("should create challenge with minimum required fields", () => {
      const result = Challenge.create({
        tripId: "trip-123",
        name: "Photo Challenge",
        submissionType: SubmissionType.IMAGE,
        scoringCategory: ScoringCategory.UNLIMITED,
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.id).toBeDefined();
        expect(result.value.tripId).toBe("trip-123");
        expect(result.value.name).toBe("Photo Challenge");
        expect(result.value.status).toBe(ChallengeStatus.HIDDEN);
        expect(result.value.basePoints).toBe(0);
        expect(result.value.isRecurring).toBe(false);
        expect(result.value.autoApprove).toBe(false);
      }
    });

    it("should create challenge with all fields", () => {
      const startTime = new Date("2026-01-01");
      const endTime = new Date("2026-01-31");

      const result = Challenge.create({
        tripId: "trip-123",
        name: "Video Challenge",
        description: "Submit your best video",
        image: "https://example.com/image.jpg",
        submissionType: SubmissionType.VIDEO,
        scoringCategory: ScoringCategory.PEER_VOTING,
        isRecurring: true,
        dailyStartTime: "09:00",
        dailyEndTime: "18:00",
        basePoints: 100,
        firstPlacePoints: 50,
        secondPlacePoints: 30,
        thirdPlacePoints: 20,
        status: ChallengeStatus.VISIBLE,
        startTime,
        endTime,
        targetLatitude: 40.7128,
        targetLongitude: -74.006,
        expectedValue: "QR123",
        autoApprove: true,
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.description).toBe("Submit your best video");
        expect(result.value.image).toBe("https://example.com/image.jpg");
        expect(result.value.scoringCategory).toBe(ScoringCategory.PEER_VOTING);
        expect(result.value.isRecurring).toBe(true);
        expect(result.value.dailyStartTime).toBe("09:00");
        expect(result.value.basePoints).toBe(100);
        expect(result.value.firstPlacePoints).toBe(50);
        expect(result.value.startTime).toEqual(startTime);
        expect(result.value.targetLatitude).toBe(40.7128);
        expect(result.value.expectedValue).toBe("QR123");
        expect(result.value.autoApprove).toBe(true);
      }
    });

    it("should reject empty tripId", () => {
      const result = Challenge.create({
        tripId: "",
        name: "Test Challenge",
        submissionType: SubmissionType.IMAGE,
        scoringCategory: ScoringCategory.UNLIMITED,
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("tripId");
      }
    });

    it("should reject empty name", () => {
      const result = Challenge.create({
        tripId: "trip-123",
        name: "",
        submissionType: SubmissionType.IMAGE,
        scoringCategory: ScoringCategory.UNLIMITED,
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("name");
      }
    });

    it("should reject name longer than 200 characters", () => {
      const result = Challenge.create({
        tripId: "trip-123",
        name: "a".repeat(201),
        submissionType: SubmissionType.IMAGE,
        scoringCategory: ScoringCategory.UNLIMITED,
      });

      expect(result.kind).toBe("err");
    });

    it("should reject negative basePoints", () => {
      const result = Challenge.create({
        tripId: "trip-123",
        name: "Test Challenge",
        submissionType: SubmissionType.IMAGE,
        scoringCategory: ScoringCategory.UNLIMITED,
        basePoints: -10,
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("basePoints");
      }
    });

    it("should reject endTime before startTime", () => {
      const result = Challenge.create({
        tripId: "trip-123",
        name: "Test Challenge",
        submissionType: SubmissionType.IMAGE,
        scoringCategory: ScoringCategory.UNLIMITED,
        startTime: new Date("2026-01-31"),
        endTime: new Date("2026-01-01"),
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("endTime");
      }
    });
  });

  describe("Challenge.updateDetails", () => {
    it("should update name and description", () => {
      const challengeResult = Challenge.create({
        tripId: "trip-123",
        name: "Original Name",
        submissionType: SubmissionType.IMAGE,
        scoringCategory: ScoringCategory.UNLIMITED,
      });

      expect(challengeResult.kind).toBe("ok");
      if (challengeResult.kind !== "ok") return;

      const challenge = challengeResult.value;
      const updatedResult = challenge.updateDetails({
        name: "Updated Name",
        description: "Updated description",
      });

      expect(updatedResult.kind).toBe("ok");
      if (updatedResult.kind === "ok") {
        expect(updatedResult.value.name).toBe("Updated Name");
        expect(updatedResult.value.description).toBe("Updated description");
        expect(updatedResult.value.id).toBe(challenge.id); // Same ID
      }
    });

    it("should reject invalid name update", () => {
      const challengeResult = Challenge.create({
        tripId: "trip-123",
        name: "Original Name",
        submissionType: SubmissionType.IMAGE,
        scoringCategory: ScoringCategory.UNLIMITED,
      });

      expect(challengeResult.kind).toBe("ok");
      if (challengeResult.kind !== "ok") return;

      const result = challengeResult.value.updateDetails({ name: "" });
      expect(result.kind).toBe("err");
    });
  });

  describe("Challenge.updateStatus", () => {
    it("should transition from HIDDEN to VISIBLE", () => {
      const challengeResult = Challenge.create({
        tripId: "trip-123",
        name: "Test Challenge",
        submissionType: SubmissionType.IMAGE,
        scoringCategory: ScoringCategory.UNLIMITED,
      });

      expect(challengeResult.kind).toBe("ok");
      if (challengeResult.kind !== "ok") return;

      const challenge = challengeResult.value;
      expect(challenge.status).toBe(ChallengeStatus.HIDDEN);

      const updated = challenge.updateStatus(ChallengeStatus.VISIBLE);
      expect(updated.status).toBe(ChallengeStatus.VISIBLE);
    });

    it("should transition through valid workflow", () => {
      const challengeResult = Challenge.create({
        tripId: "trip-123",
        name: "Test Challenge",
        submissionType: SubmissionType.IMAGE,
        scoringCategory: ScoringCategory.PEER_VOTING,
      });

      expect(challengeResult.kind).toBe("ok");
      if (challengeResult.kind !== "ok") return;

      let challenge = challengeResult.value;

      // HIDDEN -> VISIBLE
      challenge = challenge.updateStatus(ChallengeStatus.VISIBLE);
      expect(challenge.status).toBe(ChallengeStatus.VISIBLE);

      // VISIBLE -> ACTIVE
      challenge = challenge.updateStatus(ChallengeStatus.ACTIVE);
      expect(challenge.status).toBe(ChallengeStatus.ACTIVE);

      // ACTIVE -> VOTING_PHASE (for PEER_VOTING)
      challenge = challenge.updateStatus(ChallengeStatus.VOTING_PHASE);
      expect(challenge.status).toBe(ChallengeStatus.VOTING_PHASE);

      // VOTING_PHASE -> COMPLETED
      challenge = challenge.updateStatus(ChallengeStatus.COMPLETED);
      expect(challenge.status).toBe(ChallengeStatus.COMPLETED);
    });
  });

  describe("Challenge.updatePoints", () => {
    it("should update points", () => {
      const challengeResult = Challenge.create({
        tripId: "trip-123",
        name: "Test Challenge",
        submissionType: SubmissionType.IMAGE,
        scoringCategory: ScoringCategory.SPEED,
        basePoints: 50,
      });

      expect(challengeResult.kind).toBe("ok");
      if (challengeResult.kind !== "ok") return;

      const challenge = challengeResult.value;
      const updatedResult = challenge.updatePoints({
        basePoints: 100,
        firstPlacePoints: 50,
        secondPlacePoints: 30,
        thirdPlacePoints: 20,
      });

      expect(updatedResult.kind).toBe("ok");
      if (updatedResult.kind === "ok") {
        expect(updatedResult.value.basePoints).toBe(100);
        expect(updatedResult.value.firstPlacePoints).toBe(50);
        expect(updatedResult.value.secondPlacePoints).toBe(30);
        expect(updatedResult.value.thirdPlacePoints).toBe(20);
      }
    });

    it("should reject negative points", () => {
      const challengeResult = Challenge.create({
        tripId: "trip-123",
        name: "Test Challenge",
        submissionType: SubmissionType.IMAGE,
        scoringCategory: ScoringCategory.UNLIMITED,
      });

      expect(challengeResult.kind).toBe("ok");
      if (challengeResult.kind !== "ok") return;

      const result = challengeResult.value.updatePoints({ basePoints: -10 });
      expect(result.kind).toBe("err");
    });
  });

  describe("Challenge.updateSchedule", () => {
    it("should update schedule", () => {
      const startTime = new Date("2026-02-01");
      const endTime = new Date("2026-02-28");

      const challengeResult = Challenge.create({
        tripId: "trip-123",
        name: "Test Challenge",
        submissionType: SubmissionType.IMAGE,
        scoringCategory: ScoringCategory.UNLIMITED,
      });

      expect(challengeResult.kind).toBe("ok");
      if (challengeResult.kind !== "ok") return;

      const challenge = challengeResult.value;
      const updatedResult = challenge.updateSchedule({
        startTime,
        endTime,
        dailyStartTime: "10:00",
        dailyEndTime: "20:00",
      });

      expect(updatedResult.kind).toBe("ok");
      if (updatedResult.kind === "ok") {
        expect(updatedResult.value.startTime).toEqual(startTime);
        expect(updatedResult.value.endTime).toEqual(endTime);
        expect(updatedResult.value.dailyStartTime).toBe("10:00");
        expect(updatedResult.value.dailyEndTime).toBe("20:00");
      }
    });
  });

  describe("Challenge.isActive", () => {
    it("should return true for ACTIVE status", () => {
      const challengeResult = Challenge.create({
        tripId: "trip-123",
        name: "Test Challenge",
        submissionType: SubmissionType.IMAGE,
        scoringCategory: ScoringCategory.UNLIMITED,
        status: ChallengeStatus.ACTIVE,
      });

      expect(challengeResult.kind).toBe("ok");
      if (challengeResult.kind === "ok") {
        expect(challengeResult.value.isActive()).toBe(true);
      }
    });

    it("should return false for HIDDEN status", () => {
      const challengeResult = Challenge.create({
        tripId: "trip-123",
        name: "Test Challenge",
        submissionType: SubmissionType.IMAGE,
        scoringCategory: ScoringCategory.UNLIMITED,
        status: ChallengeStatus.HIDDEN,
      });

      expect(challengeResult.kind).toBe("ok");
      if (challengeResult.kind === "ok") {
        expect(challengeResult.value.isActive()).toBe(false);
      }
    });
  });

  describe("Challenge.isOpenForSubmission", () => {
    it("should return true when ACTIVE and within time window", () => {
      const now = new Date();
      const startTime = new Date(now.getTime() - 1000); // Started 1 second ago
      const endTime = new Date(now.getTime() + 10000); // Ends in 10 seconds

      const challengeResult = Challenge.create({
        tripId: "trip-123",
        name: "Test Challenge",
        submissionType: SubmissionType.IMAGE,
        scoringCategory: ScoringCategory.UNLIMITED,
        status: ChallengeStatus.ACTIVE,
        startTime,
        endTime,
      });

      expect(challengeResult.kind).toBe("ok");
      if (challengeResult.kind === "ok") {
        expect(challengeResult.value.isOpenForSubmission()).toBe(true);
      }
    });

    it("should return false when not ACTIVE", () => {
      const challengeResult = Challenge.create({
        tripId: "trip-123",
        name: "Test Challenge",
        submissionType: SubmissionType.IMAGE,
        scoringCategory: ScoringCategory.UNLIMITED,
        status: ChallengeStatus.VISIBLE,
      });

      expect(challengeResult.kind).toBe("ok");
      if (challengeResult.kind === "ok") {
        expect(challengeResult.value.isOpenForSubmission()).toBe(false);
      }
    });
  });

  describe("Challenge.requiresLocation", () => {
    it("should return true for IMAGE_LOCATION type", () => {
      const challengeResult = Challenge.create({
        tripId: "trip-123",
        name: "Test Challenge",
        submissionType: SubmissionType.IMAGE_LOCATION,
        scoringCategory: ScoringCategory.UNLIMITED,
      });

      expect(challengeResult.kind).toBe("ok");
      if (challengeResult.kind === "ok") {
        expect(challengeResult.value.requiresLocation()).toBe(true);
      }
    });

    it("should return true for LOCATION type", () => {
      const challengeResult = Challenge.create({
        tripId: "trip-123",
        name: "Test Challenge",
        submissionType: SubmissionType.LOCATION,
        scoringCategory: ScoringCategory.UNLIMITED,
      });

      expect(challengeResult.kind).toBe("ok");
      if (challengeResult.kind === "ok") {
        expect(challengeResult.value.requiresLocation()).toBe(true);
      }
    });

    it("should return false for TEXT type", () => {
      const challengeResult = Challenge.create({
        tripId: "trip-123",
        name: "Test Challenge",
        submissionType: SubmissionType.TEXT,
        scoringCategory: ScoringCategory.UNLIMITED,
      });

      expect(challengeResult.kind).toBe("ok");
      if (challengeResult.kind === "ok") {
        expect(challengeResult.value.requiresLocation()).toBe(false);
      }
    });
  });

  describe("Challenge.requiresQRCode", () => {
    it("should return true for QR_CODE type", () => {
      const challengeResult = Challenge.create({
        tripId: "trip-123",
        name: "Test Challenge",
        submissionType: SubmissionType.QR_CODE,
        scoringCategory: ScoringCategory.UNLIMITED,
      });

      expect(challengeResult.kind).toBe("ok");
      if (challengeResult.kind === "ok") {
        expect(challengeResult.value.requiresQRCode()).toBe(true);
      }
    });

    it("should return false for IMAGE type", () => {
      const challengeResult = Challenge.create({
        tripId: "trip-123",
        name: "Test Challenge",
        submissionType: SubmissionType.IMAGE,
        scoringCategory: ScoringCategory.UNLIMITED,
      });

      expect(challengeResult.kind).toBe("ok");
      if (challengeResult.kind === "ok") {
        expect(challengeResult.value.requiresQRCode()).toBe(false);
      }
    });
  });

  describe("Challenge.hasVotingPhase", () => {
    it("should return true for PEER_VOTING category", () => {
      const challengeResult = Challenge.create({
        tripId: "trip-123",
        name: "Test Challenge",
        submissionType: SubmissionType.IMAGE,
        scoringCategory: ScoringCategory.PEER_VOTING,
      });

      expect(challengeResult.kind).toBe("ok");
      if (challengeResult.kind === "ok") {
        expect(challengeResult.value.hasVotingPhase()).toBe(true);
      }
    });

    it("should return false for SPEED category", () => {
      const challengeResult = Challenge.create({
        tripId: "trip-123",
        name: "Test Challenge",
        submissionType: SubmissionType.IMAGE,
        scoringCategory: ScoringCategory.SPEED,
      });

      expect(challengeResult.kind).toBe("ok");
      if (challengeResult.kind === "ok") {
        expect(challengeResult.value.hasVotingPhase()).toBe(false);
      }
    });
  });
});
