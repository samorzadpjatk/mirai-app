import { describe, it, expect } from "bun:test";
import { ActivityReaction } from "./ActivityReaction";
import { REACTION_TYPES } from "./ActivityFeed";
import { ValidationError } from "../errors/domain-errors";

describe("[UNIT] ActivityReaction Entity", () => {
  describe("ActivityReaction.create", () => {
    it("should create reaction with valid data", () => {
      const result = ActivityReaction.create({
        activityId: "activity-123",
        userId: "user-456",
        reactionType: "heart",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.id).toBeDefined();
        expect(result.value.activityId).toBe("activity-123");
        expect(result.value.userId).toBe("user-456");
        expect(result.value.reactionType).toBe("heart");
        expect(result.value.createdAt).toBeInstanceOf(Date);
      }
    });

    it("should reject empty activityId", () => {
      const result = ActivityReaction.create({
        activityId: "",
        userId: "user-456",
        reactionType: "heart",
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.field).toBe("activityId");
      }
    });

    it("should reject empty userId", () => {
      const result = ActivityReaction.create({
        activityId: "activity-123",
        userId: "",
        reactionType: "heart",
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.field).toBe("userId");
      }
    });

    it("should reject empty reactionType", () => {
      const result = ActivityReaction.create({
        activityId: "activity-123",
        userId: "user-456",
        reactionType: "",
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.field).toBe("reactionType");
      }
    });

    it("should reject invalid reaction type", () => {
      const result = ActivityReaction.create({
        activityId: "activity-123",
        userId: "user-456",
        reactionType: "invalid",
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.field).toBe("reactionType");
        expect(result.error.message).toContain("Invalid reaction type");
      }
    });

    it("should accept all valid reaction types", () => {
      for (const reactionType of REACTION_TYPES) {
        const result = ActivityReaction.create({
          activityId: "activity-123",
          userId: "user-456",
          reactionType,
        });

        expect(result.kind).toBe("ok");
        if (result.kind === "ok") {
          expect(result.value.reactionType).toBe(reactionType);
        }
      }
    });
  });

  describe("ActivityReaction type checks", () => {
    it("should identify heart reaction", () => {
      const result = ActivityReaction.create({
        activityId: "activity-123",
        userId: "user-456",
        reactionType: "heart",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.isHeart()).toBe(true);
        expect(result.value.isFire()).toBe(false);
        expect(result.value.isOfType("heart")).toBe(true);
      }
    });

    it("should identify fire reaction", () => {
      const result = ActivityReaction.create({
        activityId: "activity-123",
        userId: "user-456",
        reactionType: "fire",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.isFire()).toBe(true);
        expect(result.value.isHeart()).toBe(false);
      }
    });

    it("should identify clap reaction", () => {
      const result = ActivityReaction.create({
        activityId: "activity-123",
        userId: "user-456",
        reactionType: "clap",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.isClap()).toBe(true);
      }
    });

    it("should identify star reaction", () => {
      const result = ActivityReaction.create({
        activityId: "activity-123",
        userId: "user-456",
        reactionType: "star",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.isStar()).toBe(true);
      }
    });

    it("should be case insensitive for type checking", () => {
      const result = ActivityReaction.create({
        activityId: "activity-123",
        userId: "user-456",
        reactionType: "HEART",
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.field).toBe("reactionType");
      }
    });
  });

  describe("ActivityReaction.getCompositeId", () => {
    it("should return composite ID", () => {
      const result = ActivityReaction.create({
        activityId: "activity-123",
        userId: "user-456",
        reactionType: "heart",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.getCompositeId()).toBe(
          "activity-123:user-456:heart",
        );
      }
    });
  });

  describe("ActivityReaction.matches", () => {
    it("should match correct activity, user, and type", () => {
      const result = ActivityReaction.create({
        activityId: "activity-123",
        userId: "user-456",
        reactionType: "heart",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.matches("activity-123", "user-456", "heart")).toBe(
          true,
        );
        expect(result.value.matches("activity-123", "user-456", "fire")).toBe(
          false,
        );
        expect(
          result.value.matches("other-activity", "user-456", "heart"),
        ).toBe(false);
      }
    });
  });

  describe("ActivityReaction.isForActivity / isFromUser", () => {
    it("should check if for specific activity", () => {
      const result = ActivityReaction.create({
        activityId: "activity-123",
        userId: "user-456",
        reactionType: "heart",
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
        reactionType: "heart",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.isFromUser("user-456")).toBe(true);
        expect(result.value.isFromUser("other-user")).toBe(false);
      }
    });
  });
});
