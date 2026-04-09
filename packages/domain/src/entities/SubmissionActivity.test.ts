import { describe, it, expect } from "bun:test";
import { SubmissionActivity } from "./SubmissionActivity";

describe("[UNIT] SubmissionActivity Entity", () => {
  describe("SubmissionActivity.create", () => {
    it("should create with valid data", () => {
      const result = SubmissionActivity.create({
        activityId: "activity-123",
        submissionId: "submission-456",
        challengeId: "challenge-789",
        groupId: "group-abc",
        hasVideo: false,
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.activityId).toBe("activity-123");
        expect(result.value.submissionId).toBe("submission-456");
        expect(result.value.challengeId).toBe("challenge-789");
        expect(result.value.groupId).toBe("group-abc");
        expect(result.value.hasVideo).toBe(false);
        expect(result.value.isWinner).toBe(false);
        expect(result.value.ranking).toBeNull();
        expect(result.value.pointsAwarded).toBeNull();
      }
    });

    it("should create with winner data", () => {
      const result = SubmissionActivity.create({
        activityId: "activity-123",
        submissionId: "submission-456",
        challengeId: "challenge-789",
        groupId: "group-abc",
        hasVideo: true,
        isWinner: true,
        ranking: 1,
        pointsAwarded: 100,
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.isWinner).toBe(true);
        expect(result.value.ranking).toBe(1);
        expect(result.value.pointsAwarded).toBe(100);
        expect(result.value.isWinningSubmission()).toBe(true);
        expect(result.value.hasRanking()).toBe(true);
        expect(result.value.hasPointsAwarded()).toBe(true);
      }
    });

    it("should reject empty activityId", () => {
      const result = SubmissionActivity.create({
        activityId: "",
        submissionId: "submission-456",
        challengeId: "challenge-789",
        groupId: "group-abc",
        hasVideo: false,
      });

      expect(result.kind).toBe("err");
    });

    it("should reject ranking less than 1", () => {
      const result = SubmissionActivity.create({
        activityId: "activity-123",
        submissionId: "submission-456",
        challengeId: "challenge-789",
        groupId: "group-abc",
        hasVideo: false,
        ranking: 0,
      });

      expect(result.kind).toBe("err");
    });

    it("should reject negative points", () => {
      const result = SubmissionActivity.create({
        activityId: "activity-123",
        submissionId: "submission-456",
        challengeId: "challenge-789",
        groupId: "group-abc",
        hasVideo: false,
        pointsAwarded: -10,
      });

      expect(result.kind).toBe("err");
    });
  });

  describe("SubmissionActivity.markAsWinner", () => {
    it("should mark as winner", () => {
      const activityResult = SubmissionActivity.create({
        activityId: "activity-123",
        submissionId: "submission-456",
        challengeId: "challenge-789",
        groupId: "group-abc",
        hasVideo: false,
      });

      expect(activityResult.kind).toBe("ok");
      if (activityResult.kind !== "ok") return;

      const updated = activityResult.value.markAsWinner(2, 50);

      expect(updated.kind).toBe("ok");
      if (updated.kind === "ok") {
        expect(updated.value.isWinner).toBe(true);
        expect(updated.value.ranking).toBe(2);
        expect(updated.value.pointsAwarded).toBe(50);
      }
    });

    it("should reject invalid ranking", () => {
      const activityResult = SubmissionActivity.create({
        activityId: "activity-123",
        submissionId: "submission-456",
        challengeId: "challenge-789",
        groupId: "group-abc",
        hasVideo: false,
      });

      expect(activityResult.kind).toBe("ok");
      if (activityResult.kind !== "ok") return;

      const updated = activityResult.value.markAsWinner(0, 50);
      expect(updated.kind).toBe("err");
    });
  });

  describe("SubmissionActivity.removeWinnerStatus", () => {
    it("should remove winner status", () => {
      const activityResult = SubmissionActivity.create({
        activityId: "activity-123",
        submissionId: "submission-456",
        challengeId: "challenge-789",
        groupId: "group-abc",
        hasVideo: false,
        isWinner: true,
        ranking: 1,
        pointsAwarded: 100,
      });

      expect(activityResult.kind).toBe("ok");
      if (activityResult.kind !== "ok") return;

      const updated = activityResult.value.removeWinnerStatus();

      expect(updated.isWinner).toBe(false);
      expect(updated.ranking).toBeNull();
      expect(updated.pointsAwarded).toBeNull();
    });
  });

  describe("SubmissionActivity.updatePointsAwarded", () => {
    it("should update points", () => {
      const activityResult = SubmissionActivity.create({
        activityId: "activity-123",
        submissionId: "submission-456",
        challengeId: "challenge-789",
        groupId: "group-abc",
        hasVideo: false,
      });

      expect(activityResult.kind).toBe("ok");
      if (activityResult.kind !== "ok") return;

      const updated = activityResult.value.updatePointsAwarded(75);

      expect(updated.kind).toBe("ok");
      if (updated.kind === "ok") {
        expect(updated.value.pointsAwarded).toBe(75);
      }
    });

    it("should reject negative points", () => {
      const activityResult = SubmissionActivity.create({
        activityId: "activity-123",
        submissionId: "submission-456",
        challengeId: "challenge-789",
        groupId: "group-abc",
        hasVideo: false,
      });

      expect(activityResult.kind).toBe("ok");
      if (activityResult.kind !== "ok") return;

      const updated = activityResult.value.updatePointsAwarded(-10);
      expect(updated.kind).toBe("err");
    });
  });

  describe("SubmissionActivity.getRankingText", () => {
    it("should return formatted ranking", () => {
      const tests = [
        { ranking: 1, expected: "1st place" },
        { ranking: 2, expected: "2nd place" },
        { ranking: 3, expected: "3rd place" },
        { ranking: 4, expected: "4th place" },
        { ranking: 11, expected: "11th place" },
      ];

      for (const test of tests) {
        const result = SubmissionActivity.create({
          activityId: "activity-123",
          submissionId: "submission-456",
          challengeId: "challenge-789",
          groupId: "group-abc",
          hasVideo: false,
          isWinner: true,
          ranking: test.ranking,
          pointsAwarded: 50,
        });

        expect(result.kind).toBe("ok");
        if (result.kind === "ok") {
          expect(result.value.getRankingText()).toBe(test.expected);
        }
      }
    });

    it("should return Unranked when no ranking", () => {
      const result = SubmissionActivity.create({
        activityId: "activity-123",
        submissionId: "submission-456",
        challengeId: "challenge-789",
        groupId: "group-abc",
        hasVideo: false,
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.getRankingText()).toBe("Unranked");
      }
    });
  });

  describe("SubmissionActivity.includesVideo", () => {
    it("should check if has video", () => {
      const result = SubmissionActivity.create({
        activityId: "activity-123",
        submissionId: "submission-456",
        challengeId: "challenge-789",
        groupId: "group-abc",
        hasVideo: true,
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.includesVideo()).toBe(true);
      }
    });
  });
});
