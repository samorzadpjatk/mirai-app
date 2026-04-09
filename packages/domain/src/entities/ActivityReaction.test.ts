import { describe, it, expect } from "bun:test";
import { ActivityReaction } from "./ActivityReaction";

describe("[UNIT] ActivityReaction Entity", () => {
  describe("ActivityReaction.create", () => {
    it("should create reaction with valid data", () => {
      const result = ActivityReaction.create({
        activityId: "activity-123",
        userId: "user-456",
        reactionType: "like",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.id).toBeDefined();
        expect(result.value.activityId).toBe("activity-123");
        expect(result.value.userId).toBe("user-456");
        expect(result.value.reactionType).toBe("like");
        expect(result.value.createdAt).toBeInstanceOf(Date);
      }
    });

    it("should reject empty activityId", () => {
      const result = ActivityReaction.create({
        activityId: "",
        userId: "user-456",
        reactionType: "like",
      });

      expect(result.kind).toBe("err");
    });

    it("should reject empty userId", () => {
      const result = ActivityReaction.create({
        activityId: "activity-123",
        userId: "",
        reactionType: "like",
      });

      expect(result.kind).toBe("err");
    });

    it("should reject empty reactionType", () => {
      const result = ActivityReaction.create({
        activityId: "activity-123",
        userId: "user-456",
        reactionType: "",
      });

      expect(result.kind).toBe("err");
    });
  });

  describe("ActivityReaction type checks", () => {
    it("should identify like reaction", () => {
      const result = ActivityReaction.create({
        activityId: "activity-123",
        userId: "user-456",
        reactionType: "like",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.isLike()).toBe(true);
        expect(result.value.isLove()).toBe(false);
        expect(result.value.isOfType("like")).toBe(true);
      }
    });

    it("should identify love reaction", () => {
      const result = ActivityReaction.create({
        activityId: "activity-123",
        userId: "user-456",
        reactionType: "love",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.isLove()).toBe(true);
        expect(result.value.isLike()).toBe(false);
      }
    });

    it("should identify celebrate reaction", () => {
      const result = ActivityReaction.create({
        activityId: "activity-123",
        userId: "user-456",
        reactionType: "celebrate",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.isCelebrate()).toBe(true);
      }
    });

    it("should identify funny reaction", () => {
      const result = ActivityReaction.create({
        activityId: "activity-123",
        userId: "user-456",
        reactionType: "funny",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.isFunny()).toBe(true);
      }
    });

    it("should be case insensitive for type checking", () => {
      const result = ActivityReaction.create({
        activityId: "activity-123",
        userId: "user-456",
        reactionType: "LIKE",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.isLike()).toBe(true);
      }
    });
  });

  describe("ActivityReaction.getCompositeId", () => {
    it("should return composite ID", () => {
      const result = ActivityReaction.create({
        activityId: "activity-123",
        userId: "user-456",
        reactionType: "like",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.getCompositeId()).toBe(
          "activity-123:user-456:like",
        );
      }
    });
  });

  describe("ActivityReaction.matches", () => {
    it("should match correct activity, user, and type", () => {
      const result = ActivityReaction.create({
        activityId: "activity-123",
        userId: "user-456",
        reactionType: "like",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.matches("activity-123", "user-456", "like")).toBe(
          true,
        );
        expect(result.value.matches("activity-123", "user-456", "love")).toBe(
          false,
        );
        expect(result.value.matches("other-activity", "user-456", "like")).toBe(
          false,
        );
      }
    });
  });

  describe("ActivityReaction.isForActivity / isFromUser", () => {
    it("should check if for specific activity", () => {
      const result = ActivityReaction.create({
        activityId: "activity-123",
        userId: "user-456",
        reactionType: "like",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.isForActivity("activity-123")).toBe(true);
        expect(result.value.isForActivity("other-activity")).toBe(false);
      }
    });

    it("should check if from specific user", () => {
      const result = ActivityReaction.create({
        activityId: "activity-123",
        userId: "user-456",
        reactionType: "like",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.isFromUser("user-456")).toBe(true);
        expect(result.value.isFromUser("other-user")).toBe(false);
      }
    });
  });
});
