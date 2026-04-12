import { describe, it, expect } from "bun:test";
import { Effect, Exit, Cause } from "effect";
import { ActivityReaction } from "./ActivityReaction";
import { REACTION_TYPES } from "./ActivityFeed";
import { ValidationError } from "../errors/effect-errors";

describe("[UNIT] ActivityReaction Entity", () => {
  describe("ActivityReaction.create", () => {
    it("should create reaction with valid data", () => {
      const effect = ActivityReaction.create({
        activityId: "activity-123",
        userId: "user-456",
        reactionType: "heart",
      });

      const reaction = Effect.runSync(effect);
      expect(reaction.id).toBeDefined();
      expect(reaction.activityId).toBe("activity-123");
      expect(reaction.userId).toBe("user-456");
      expect(reaction.reactionType).toBe("heart");
      expect(reaction.createdAt).toBeInstanceOf(Date);
    });

    it("should reject empty activityId", () => {
      const effect = ActivityReaction.create({
        activityId: "",
        userId: "user-456",
        reactionType: "heart",
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        const error = exit.cause.error;
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.field).toBe("activityId");
      }
    });

    it("should reject empty userId", () => {
      const effect = ActivityReaction.create({
        activityId: "activity-123",
        userId: "",
        reactionType: "heart",
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        const error = exit.cause.error;
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.field).toBe("userId");
      }
    });

    it("should reject empty reactionType", () => {
      const effect = ActivityReaction.create({
        activityId: "activity-123",
        userId: "user-456",
        reactionType: "",
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        const error = exit.cause.error;
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.field).toBe("reactionType");
      }
    });

    it("should reject invalid reaction type", () => {
      const effect = ActivityReaction.create({
        activityId: "activity-123",
        userId: "user-456",
        reactionType: "invalid",
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        const error = exit.cause.error;
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.field).toBe("reactionType");
        expect(error.message).toContain("Invalid reaction type");
      }
    });

    it("should accept all valid reaction types", () => {
      for (const reactionType of REACTION_TYPES) {
        const effect = ActivityReaction.create({
          activityId: "activity-123",
          userId: "user-456",
          reactionType,
        });

        const reaction = Effect.runSync(effect);
        expect(reaction.reactionType).toBe(reactionType);
      }
    });
  });

  describe("ActivityReaction type checks", () => {
    it("should identify heart reaction", () => {
      const effect = ActivityReaction.create({
        activityId: "activity-123",
        userId: "user-456",
        reactionType: "heart",
      });

      const reaction = Effect.runSync(effect);
      expect(reaction.isHeart()).toBe(true);
      expect(reaction.isFire()).toBe(false);
      expect(reaction.isOfType("heart")).toBe(true);
    });

    it("should identify fire reaction", () => {
      const effect = ActivityReaction.create({
        activityId: "activity-123",
        userId: "user-456",
        reactionType: "fire",
      });

      const reaction = Effect.runSync(effect);
      expect(reaction.isFire()).toBe(true);
      expect(reaction.isHeart()).toBe(false);
    });

    it("should identify clap reaction", () => {
      const effect = ActivityReaction.create({
        activityId: "activity-123",
        userId: "user-456",
        reactionType: "clap",
      });

      const reaction = Effect.runSync(effect);
      expect(reaction.isClap()).toBe(true);
    });

    it("should identify star reaction", () => {
      const effect = ActivityReaction.create({
        activityId: "activity-123",
        userId: "user-456",
        reactionType: "star",
      });

      const reaction = Effect.runSync(effect);
      expect(reaction.isStar()).toBe(true);
    });

    it("should be case insensitive for type checking", () => {
      const effect = ActivityReaction.create({
        activityId: "activity-123",
        userId: "user-456",
        reactionType: "HEART",
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        const error = exit.cause.error;
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.field).toBe("reactionType");
      }
    });
  });

  describe("ActivityReaction.getCompositeId", () => {
    it("should return composite ID", () => {
      const effect = ActivityReaction.create({
        activityId: "activity-123",
        userId: "user-456",
        reactionType: "heart",
      });

      const reaction = Effect.runSync(effect);
      expect(reaction.getCompositeId()).toBe("activity-123:user-456:heart");
    });
  });

  describe("ActivityReaction.matches", () => {
    it("should match correct activity, user, and type", () => {
      const effect = ActivityReaction.create({
        activityId: "activity-123",
        userId: "user-456",
        reactionType: "heart",
      });

      const reaction = Effect.runSync(effect);
      expect(reaction.matches("activity-123", "user-456", "heart")).toBe(true);
      expect(reaction.matches("activity-123", "user-456", "fire")).toBe(false);
      expect(reaction.matches("other-activity", "user-456", "heart")).toBe(
        false,
      );
    });
  });

  describe("ActivityReaction.isForActivity / isFromUser", () => {
    it("should check if for specific activity", () => {
      const effect = ActivityReaction.create({
        activityId: "activity-123",
        userId: "user-456",
        reactionType: "heart",
      });

      const reaction = Effect.runSync(effect);
      expect(reaction.isForActivity("activity-123")).toBe(true);
      expect(reaction.isForActivity("other-activity")).toBe(false);
    });

    it("should check if from specific user", () => {
      const effect = ActivityReaction.create({
        activityId: "activity-123",
        userId: "user-456",
        reactionType: "heart",
      });

      const reaction = Effect.runSync(effect);
      expect(reaction.isFromUser("user-456")).toBe(true);
      expect(reaction.isFromUser("other-user")).toBe(false);
    });
  });
});
