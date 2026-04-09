import { describe, it, expect } from "bun:test";
import { ChallengeActivity } from "./ChallengeActivity";
import { SubmissionType } from "./Challenge";

describe("[UNIT] ChallengeActivity Entity", () => {
  describe("ChallengeActivity.create", () => {
    it("should create with valid data", () => {
      const result = ChallengeActivity.create({
        activityId: "activity-123",
        challengeId: "challenge-456",
        eventType: "started",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.activityId).toBe("activity-123");
        expect(result.value.challengeId).toBe("challenge-456");
        expect(result.value.eventType).toBe("started");
        expect(result.value.endTime).toBeNull();
        expect(result.value.submissionType).toBeNull();
      }
    });

    it("should create with all optional fields", () => {
      const endTime = new Date("2024-12-31T23:59:59Z");

      const result = ChallengeActivity.create({
        activityId: "activity-123",
        challengeId: "challenge-456",
        eventType: "started",
        endTime,
        submissionType: SubmissionType.IMAGE,
        basePoints: 100,
        submissionCount: 5,
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.endTime).toBe(endTime);
        expect(result.value.submissionType).toBe(SubmissionType.IMAGE);
        expect(result.value.basePoints).toBe(100);
        expect(result.value.submissionCount).toBe(5);
      }
    });

    it("should reject empty activityId", () => {
      const result = ChallengeActivity.create({
        activityId: "",
        challengeId: "challenge-456",
        eventType: "started",
      });

      expect(result.kind).toBe("err");
    });

    it("should reject negative basePoints", () => {
      const result = ChallengeActivity.create({
        activityId: "activity-123",
        challengeId: "challenge-456",
        eventType: "started",
        basePoints: -10,
      });

      expect(result.kind).toBe("err");
    });

    it("should reject negative submissionCount", () => {
      const result = ChallengeActivity.create({
        activityId: "activity-123",
        challengeId: "challenge-456",
        eventType: "started",
        submissionCount: -5,
      });

      expect(result.kind).toBe("err");
    });
  });

  describe("ChallengeActivity.updateEndTime", () => {
    it("should update end time", () => {
      const activityResult = ChallengeActivity.create({
        activityId: "activity-123",
        challengeId: "challenge-456",
        eventType: "started",
      });

      expect(activityResult.kind).toBe("ok");
      if (activityResult.kind !== "ok") return;

      const newEndTime = new Date("2024-12-31T23:59:59Z");
      const updated = activityResult.value.updateEndTime(newEndTime);

      expect(updated.endTime).toBe(newEndTime);
    });

    it("should clear end time", () => {
      const activityResult = ChallengeActivity.create({
        activityId: "activity-123",
        challengeId: "challenge-456",
        eventType: "started",
        endTime: new Date(),
      });

      expect(activityResult.kind).toBe("ok");
      if (activityResult.kind !== "ok") return;

      const updated = activityResult.value.updateEndTime(null);

      expect(updated.endTime).toBeNull();
    });
  });

  describe("ChallengeActivity.updateSubmissionCount", () => {
    it("should update submission count", () => {
      const activityResult = ChallengeActivity.create({
        activityId: "activity-123",
        challengeId: "challenge-456",
        eventType: "started",
      });

      expect(activityResult.kind).toBe("ok");
      if (activityResult.kind !== "ok") return;

      const updated = activityResult.value.updateSubmissionCount(10);

      expect(updated.kind).toBe("ok");
      if (updated.kind === "ok") {
        expect(updated.value.submissionCount).toBe(10);
      }
    });

    it("should reject negative count", () => {
      const activityResult = ChallengeActivity.create({
        activityId: "activity-123",
        challengeId: "challenge-456",
        eventType: "started",
      });

      expect(activityResult.kind).toBe("ok");
      if (activityResult.kind !== "ok") return;

      const updated = activityResult.value.updateSubmissionCount(-5);
      expect(updated.kind).toBe("err");
    });
  });

  describe("ChallengeActivity.updateBasePoints", () => {
    it("should update base points", () => {
      const activityResult = ChallengeActivity.create({
        activityId: "activity-123",
        challengeId: "challenge-456",
        eventType: "started",
      });

      expect(activityResult.kind).toBe("ok");
      if (activityResult.kind !== "ok") return;

      const updated = activityResult.value.updateBasePoints(150);

      expect(updated.kind).toBe("ok");
      if (updated.kind === "ok") {
        expect(updated.value.basePoints).toBe(150);
      }
    });

    it("should clear base points", () => {
      const activityResult = ChallengeActivity.create({
        activityId: "activity-123",
        challengeId: "challenge-456",
        eventType: "started",
        basePoints: 100,
      });

      expect(activityResult.kind).toBe("ok");
      if (activityResult.kind !== "ok") return;

      const updated = activityResult.value.updateBasePoints(null);

      expect(updated.kind).toBe("ok");
      if (updated.kind === "ok") {
        expect(updated.value.basePoints).toBeNull();
      }
    });
  });

  describe("ChallengeActivity event type checks", () => {
    it("should identify started", () => {
      const result = ChallengeActivity.create({
        activityId: "activity-123",
        challengeId: "challenge-456",
        eventType: "started",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.isStarted()).toBe(true);
        expect(result.value.isEnded()).toBe(false);
      }
    });

    it("should identify ended", () => {
      const result = ChallengeActivity.create({
        activityId: "activity-123",
        challengeId: "challenge-456",
        eventType: "ended",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.isEnded()).toBe(true);
        expect(result.value.isStarted()).toBe(false);
      }
    });

    it("should identify voting events", () => {
      const result = ChallengeActivity.create({
        activityId: "activity-123",
        challengeId: "challenge-456",
        eventType: "voting_started",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.isVotingStarted()).toBe(true);
        expect(result.value.isVotingEnded()).toBe(false);
      }
    });

    it("should be case insensitive", () => {
      const result = ChallengeActivity.create({
        activityId: "activity-123",
        challengeId: "challenge-456",
        eventType: "STARTED",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.isStarted()).toBe(true);
      }
    });
  });
});
