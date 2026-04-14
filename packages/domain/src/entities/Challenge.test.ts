import { describe, it, expect } from "bun:test";
import { Effect } from "effect";
import {
  Challenge,
  ChallengeStatus,
  SubmissionType,
  ScoringCategory,
} from "./Challenge";
import { ValidationError, StateTransitionError } from "../errors";

describe("[UNIT] Challenge Entity", () => {
  describe("[UNIT] Challenge.create", () => {
    it("should create challenge with minimum required fields", async () => {
      const challenge = await Effect.runPromise(
        Challenge.create({
          tripId: "trip-123",
          name: "Photo Challenge",
          submissionType: SubmissionType.IMAGE,
          scoringCategory: ScoringCategory.UNLIMITED,
        }),
      );

      expect(challenge.id).toBeDefined();
      expect(challenge.tripId).toBe("trip-123");
      expect(challenge.name).toBe("Photo Challenge");
      expect(challenge.status).toBe(ChallengeStatus.HIDDEN);
      expect(challenge.basePoints).toBe(0);
      expect(challenge.isRecurring).toBe(false);
      expect(challenge.autoApprove).toBe(false);
    });

    it("should create challenge with all fields", async () => {
      const startTime = new Date("2026-01-01");
      const endTime = new Date("2026-01-31");

      const challenge = await Effect.runPromise(
        Challenge.create({
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
        }),
      );

      expect(challenge.description).toBe("Submit your best video");
      expect(challenge.image).toBe("https://example.com/image.jpg");
      expect(challenge.scoringCategory).toBe(ScoringCategory.PEER_VOTING);
      expect(challenge.isRecurring).toBe(true);
      expect(challenge.dailyStartTime).toBe("09:00");
      expect(challenge.basePoints).toBe(100);
      expect(challenge.firstPlacePoints).toBe(50);
      expect(challenge.startTime).toEqual(startTime);
      expect(challenge.targetLatitude).toBe(40.7128);
      expect(challenge.expectedValue).toBe("QR123");
      expect(challenge.autoApprove).toBe(true);
    });

    it("should reject empty tripId", async () => {
      const error = await Effect.runPromise(
        Effect.flip(
          Challenge.create({
            tripId: "",
            name: "Test Challenge",
            submissionType: SubmissionType.IMAGE,
            scoringCategory: ScoringCategory.UNLIMITED,
          }),
        ),
      );

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.field).toBe("tripId");
    });

    it("should reject empty name", async () => {
      const error = await Effect.runPromise(
        Effect.flip(
          Challenge.create({
            tripId: "trip-123",
            name: "",
            submissionType: SubmissionType.IMAGE,
            scoringCategory: ScoringCategory.UNLIMITED,
          }),
        ),
      );

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.field).toBe("name");
    });

    it("should reject name longer than 200 characters", async () => {
      const error = await Effect.runPromise(
        Effect.flip(
          Challenge.create({
            tripId: "trip-123",
            name: "a".repeat(201),
            submissionType: SubmissionType.IMAGE,
            scoringCategory: ScoringCategory.UNLIMITED,
          }),
        ),
      );

      expect(error).toBeInstanceOf(ValidationError);
    });

    it("should reject negative basePoints", async () => {
      const error = await Effect.runPromise(
        Effect.flip(
          Challenge.create({
            tripId: "trip-123",
            name: "Test Challenge",
            submissionType: SubmissionType.IMAGE,
            scoringCategory: ScoringCategory.UNLIMITED,
            basePoints: -10,
          }),
        ),
      );

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.field).toBe("basePoints");
    });

    it("should reject endTime before startTime", async () => {
      const error = await Effect.runPromise(
        Effect.flip(
          Challenge.create({
            tripId: "trip-123",
            name: "Test Challenge",
            submissionType: SubmissionType.IMAGE,
            scoringCategory: ScoringCategory.UNLIMITED,
            startTime: new Date("2026-01-31"),
            endTime: new Date("2026-01-01"),
          }),
        ),
      );

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.field).toBe("endTime");
    });
  });

  describe("[UNIT] Challenge.updateDetails", () => {
    it("should update name and description", async () => {
      const challenge = await Effect.runPromise(
        Challenge.create({
          tripId: "trip-123",
          name: "Original Name",
          submissionType: SubmissionType.IMAGE,
          scoringCategory: ScoringCategory.UNLIMITED,
        }),
      );

      const updated = await Effect.runPromise(
        challenge.updateDetails({
          name: "Updated Name",
          description: "Updated description",
        }),
      );

      expect(updated.name).toBe("Updated Name");
      expect(updated.description).toBe("Updated description");
      expect(updated.id).toBe(challenge.id); // Same ID
    });

    it("should reject invalid name update", async () => {
      const challenge = await Effect.runPromise(
        Challenge.create({
          tripId: "trip-123",
          name: "Original Name",
          submissionType: SubmissionType.IMAGE,
          scoringCategory: ScoringCategory.UNLIMITED,
        }),
      );

      const error = await Effect.runPromise(
        Effect.flip(challenge.updateDetails({ name: "" })),
      );
      expect(error).toBeInstanceOf(ValidationError);
    });
  });

  describe("[UNIT] Challenge.updateStatus", () => {
    it("should transition from HIDDEN to VISIBLE", async () => {
      const challenge = await Effect.runPromise(
        Challenge.create({
          tripId: "trip-123",
          name: "Test Challenge",
          submissionType: SubmissionType.IMAGE,
          scoringCategory: ScoringCategory.UNLIMITED,
        }),
      );

      expect(challenge.status).toBe(ChallengeStatus.HIDDEN);

      const updated = await Effect.runPromise(
        challenge.updateStatus(ChallengeStatus.VISIBLE),
      );
      expect(updated.status).toBe(ChallengeStatus.VISIBLE);
    });

    it("should transition through valid workflow", async () => {
      let challenge = await Effect.runPromise(
        Challenge.create({
          tripId: "trip-123",
          name: "Test Challenge",
          submissionType: SubmissionType.IMAGE,
          scoringCategory: ScoringCategory.PEER_VOTING,
        }),
      );

      // HIDDEN -> VISIBLE
      challenge = await Effect.runPromise(
        challenge.updateStatus(ChallengeStatus.VISIBLE),
      );
      expect(challenge.status).toBe(ChallengeStatus.VISIBLE);

      // VISIBLE -> ACTIVE
      challenge = await Effect.runPromise(
        challenge.updateStatus(ChallengeStatus.ACTIVE),
      );
      expect(challenge.status).toBe(ChallengeStatus.ACTIVE);

      // ACTIVE -> VOTING_PHASE (for PEER_VOTING)
      challenge = await Effect.runPromise(
        challenge.updateStatus(ChallengeStatus.VOTING_PHASE),
      );
      expect(challenge.status).toBe(ChallengeStatus.VOTING_PHASE);

      // VOTING_PHASE -> COMPLETED
      challenge = await Effect.runPromise(
        challenge.updateStatus(ChallengeStatus.COMPLETED),
      );
      expect(challenge.status).toBe(ChallengeStatus.COMPLETED);
    });

    it("should return StateTransitionError for invalid transition", async () => {
      const challenge = await Effect.runPromise(
        Challenge.create({
          tripId: "trip-123",
          name: "Test Challenge",
          submissionType: SubmissionType.IMAGE,
          scoringCategory: ScoringCategory.UNLIMITED,
        }),
      );

      // Try to transition directly from HIDDEN to ACTIVE (invalid)
      const error = await Effect.runPromise(
        Effect.flip(challenge.updateStatus(ChallengeStatus.ACTIVE)),
      );
      expect(error).toBeInstanceOf(StateTransitionError);
      expect(error.from).toBe(ChallengeStatus.HIDDEN);
      expect(error.to).toBe(ChallengeStatus.ACTIVE);
    });
  });

  describe("[UNIT] Challenge.updatePoints", () => {
    it("should update points", async () => {
      const challenge = await Effect.runPromise(
        Challenge.create({
          tripId: "trip-123",
          name: "Test Challenge",
          submissionType: SubmissionType.IMAGE,
          scoringCategory: ScoringCategory.SPEED,
          basePoints: 50,
        }),
      );

      const updated = await Effect.runPromise(
        challenge.updatePoints({
          basePoints: 100,
          firstPlacePoints: 50,
          secondPlacePoints: 30,
          thirdPlacePoints: 20,
        }),
      );

      expect(updated.basePoints).toBe(100);
      expect(updated.firstPlacePoints).toBe(50);
      expect(updated.secondPlacePoints).toBe(30);
      expect(updated.thirdPlacePoints).toBe(20);
    });

    it("should reject negative points", async () => {
      const challenge = await Effect.runPromise(
        Challenge.create({
          tripId: "trip-123",
          name: "Test Challenge",
          submissionType: SubmissionType.IMAGE,
          scoringCategory: ScoringCategory.UNLIMITED,
        }),
      );

      const error = await Effect.runPromise(
        Effect.flip(challenge.updatePoints({ basePoints: -10 })),
      );
      expect(error).toBeInstanceOf(ValidationError);
    });
  });

  describe("[UNIT] Challenge.updateSchedule", () => {
    it("should update schedule", async () => {
      const startTime = new Date("2026-02-01");
      const endTime = new Date("2026-02-28");

      const challenge = await Effect.runPromise(
        Challenge.create({
          tripId: "trip-123",
          name: "Test Challenge",
          submissionType: SubmissionType.IMAGE,
          scoringCategory: ScoringCategory.UNLIMITED,
        }),
      );

      const updated = await Effect.runPromise(
        challenge.updateSchedule({
          startTime,
          endTime,
          dailyStartTime: "10:00",
          dailyEndTime: "20:00",
        }),
      );

      expect(updated.startTime).toEqual(startTime);
      expect(updated.endTime).toEqual(endTime);
      expect(updated.dailyStartTime).toBe("10:00");
      expect(updated.dailyEndTime).toBe("20:00");
    });
  });

  describe("[UNIT] Challenge.isActive", () => {
    it("should return true for ACTIVE status", async () => {
      const challenge = await Effect.runPromise(
        Challenge.create({
          tripId: "trip-123",
          name: "Test Challenge",
          submissionType: SubmissionType.IMAGE,
          scoringCategory: ScoringCategory.UNLIMITED,
          status: ChallengeStatus.ACTIVE,
        }),
      );

      expect(challenge.isActive()).toBe(true);
    });

    it("should return false for HIDDEN status", async () => {
      const challenge = await Effect.runPromise(
        Challenge.create({
          tripId: "trip-123",
          name: "Test Challenge",
          submissionType: SubmissionType.IMAGE,
          scoringCategory: ScoringCategory.UNLIMITED,
          status: ChallengeStatus.HIDDEN,
        }),
      );

      expect(challenge.isActive()).toBe(false);
    });
  });

  describe("[UNIT] Challenge.isOpenForSubmission", () => {
    it("should return true when ACTIVE and within time window", async () => {
      const now = new Date();
      const startTime = new Date(now.getTime() - 1000); // Started 1 second ago
      const endTime = new Date(now.getTime() + 10000); // Ends in 10 seconds

      const challenge = await Effect.runPromise(
        Challenge.create({
          tripId: "trip-123",
          name: "Test Challenge",
          submissionType: SubmissionType.IMAGE,
          scoringCategory: ScoringCategory.UNLIMITED,
          status: ChallengeStatus.ACTIVE,
          startTime,
          endTime,
        }),
      );

      expect(challenge.isOpenForSubmission()).toBe(true);
    });

    it("should return false when not ACTIVE", async () => {
      const challenge = await Effect.runPromise(
        Challenge.create({
          tripId: "trip-123",
          name: "Test Challenge",
          submissionType: SubmissionType.IMAGE,
          scoringCategory: ScoringCategory.UNLIMITED,
          status: ChallengeStatus.VISIBLE,
        }),
      );

      expect(challenge.isOpenForSubmission()).toBe(false);
    });
  });

  describe("[UNIT] Challenge.requiresLocation", () => {
    it("should return true for IMAGE_LOCATION type", async () => {
      const challenge = await Effect.runPromise(
        Challenge.create({
          tripId: "trip-123",
          name: "Test Challenge",
          submissionType: SubmissionType.IMAGE_LOCATION,
          scoringCategory: ScoringCategory.UNLIMITED,
        }),
      );

      expect(challenge.requiresLocation()).toBe(true);
    });

    it("should return true for LOCATION type", async () => {
      const challenge = await Effect.runPromise(
        Challenge.create({
          tripId: "trip-123",
          name: "Test Challenge",
          submissionType: SubmissionType.LOCATION,
          scoringCategory: ScoringCategory.UNLIMITED,
        }),
      );

      expect(challenge.requiresLocation()).toBe(true);
    });

    it("should return false for TEXT type", async () => {
      const challenge = await Effect.runPromise(
        Challenge.create({
          tripId: "trip-123",
          name: "Test Challenge",
          submissionType: SubmissionType.TEXT,
          scoringCategory: ScoringCategory.UNLIMITED,
        }),
      );

      expect(challenge.requiresLocation()).toBe(false);
    });
  });

  describe("[UNIT] Challenge.requiresQRCode", () => {
    it("should return true for QR_CODE type", async () => {
      const challenge = await Effect.runPromise(
        Challenge.create({
          tripId: "trip-123",
          name: "Test Challenge",
          submissionType: SubmissionType.QR_CODE,
          scoringCategory: ScoringCategory.UNLIMITED,
        }),
      );

      expect(challenge.requiresQRCode()).toBe(true);
    });

    it("should return false for IMAGE type", async () => {
      const challenge = await Effect.runPromise(
        Challenge.create({
          tripId: "trip-123",
          name: "Test Challenge",
          submissionType: SubmissionType.IMAGE,
          scoringCategory: ScoringCategory.UNLIMITED,
        }),
      );

      expect(challenge.requiresQRCode()).toBe(false);
    });
  });

  describe("[UNIT] Challenge.hasVotingPhase", () => {
    it("should return true for PEER_VOTING category", async () => {
      const challenge = await Effect.runPromise(
        Challenge.create({
          tripId: "trip-123",
          name: "Test Challenge",
          submissionType: SubmissionType.IMAGE,
          scoringCategory: ScoringCategory.PEER_VOTING,
        }),
      );

      expect(challenge.hasVotingPhase()).toBe(true);
    });

    it("should return false for SPEED category", async () => {
      const challenge = await Effect.runPromise(
        Challenge.create({
          tripId: "trip-123",
          name: "Test Challenge",
          submissionType: SubmissionType.IMAGE,
          scoringCategory: ScoringCategory.SPEED,
        }),
      );

      expect(challenge.hasVotingPhase()).toBe(false);
    });
  });
});
