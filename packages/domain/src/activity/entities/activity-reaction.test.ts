import { describe, it, expect } from "bun:test";
import { Effect } from "effect";
import { ActivityReaction } from "./activity-reaction";
import { ValidationError } from "../../system/errors";

// =============================================================================
// ActivityReaction Tests
// =============================================================================

describe("[UNIT] ActivityReaction", () => {
  const baseProps = {
    id: "reaction-123",
    activityId: "activity-123",
    userId: "user-123",
    reactionType: "heart",
    createdAt: new Date("2024-01-01"),
  };

  // ============================================================================
  // Factory Tests
  // ============================================================================
  describe("[UNIT] ActivityReaction.create", () => {
    it("creates reaction with valid data", async () => {
      const result = await Effect.runPromise(
        ActivityReaction.create(baseProps),
      );
      expect(result.id).toBe("reaction-123");
      expect(result.activityId).toBe("activity-123");
      expect(result.userId).toBe("user-123");
      expect(result.reactionType).toBe("heart");
    });

    it("creates with minimal required data", async () => {
      const result = await Effect.runPromise(
        ActivityReaction.create({
          activityId: "activity-123",
          userId: "user-123",
          reactionType: "fire",
        }),
      );
      expect(result.activityId).toBe("activity-123");
      expect(result.userId).toBe("user-123");
      expect(result.reactionType).toBe("fire");
    });

    it("fails for empty activityId", async () => {
      const result = await Effect.runPromise(
        Effect.either(
          ActivityReaction.create({ ...baseProps, activityId: "" }),
        ),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("activityId");
      }
    });

    it("fails for whitespace-only activityId", async () => {
      const result = await Effect.runPromise(
        Effect.either(
          ActivityReaction.create({ ...baseProps, activityId: "   " }),
        ),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("activityId");
      }
    });

    it("fails for empty userId", async () => {
      const result = await Effect.runPromise(
        Effect.either(ActivityReaction.create({ ...baseProps, userId: "" })),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("userId");
      }
    });

    it("fails for whitespace-only userId", async () => {
      const result = await Effect.runPromise(
        Effect.either(ActivityReaction.create({ ...baseProps, userId: "   " })),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("userId");
      }
    });

    it("fails for empty reactionType", async () => {
      const result = await Effect.runPromise(
        Effect.either(
          ActivityReaction.create({ ...baseProps, reactionType: "" }),
        ),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("reactionType");
      }
    });

    it("fails for whitespace-only reactionType", async () => {
      const result = await Effect.runPromise(
        Effect.either(
          ActivityReaction.create({ ...baseProps, reactionType: "   " }),
        ),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("reactionType");
      }
    });

    it("fails for reactionType > 50 chars", async () => {
      const result = await Effect.runPromise(
        Effect.either(
          ActivityReaction.create({
            ...baseProps,
            reactionType: "a".repeat(51),
          }),
        ),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("reactionType");
      }
    });

    it("fails for invalid reaction type", async () => {
      const result = await Effect.runPromise(
        Effect.either(
          ActivityReaction.create({ ...baseProps, reactionType: "invalid" }),
        ),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("reactionType");
        expect(result.left.message).toContain("Invalid reaction type");
      }
    });

    it("accepts all valid reaction types", async () => {
      const validTypes = ["heart", "fire", "clap", "star"];
      for (const type of validTypes) {
        const result = await Effect.runPromise(
          ActivityReaction.create({
            activityId: "activity-123",
            userId: "user-123",
            reactionType: type,
          }),
        );
        expect(result.reactionType).toBe(type);
      }
    });

    it("trims reactionType on creation", async () => {
      const result = await Effect.runPromise(
        ActivityReaction.create({
          ...baseProps,
          reactionType: "  heart  ",
        }),
      );
      expect(result.reactionType).toBe("heart");
    });
  });

  // ============================================================================
  // getCompositeId Tests
  // ============================================================================
  describe("[UNIT] ActivityReaction.getCompositeId", () => {
    it("returns composite id with activity:user:type format", async () => {
      const reaction = await Effect.runPromise(
        ActivityReaction.create({
          activityId: "activity-123",
          userId: "user-456",
          reactionType: "heart",
        }),
      );
      expect(reaction.getCompositeId()).toBe("activity-123:user-456:heart");
    });

    it("generates unique ids for different reactions", async () => {
      const reaction1 = await Effect.runPromise(
        ActivityReaction.create({
          activityId: "activity-123",
          userId: "user-456",
          reactionType: "heart",
        }),
      );
      const reaction2 = await Effect.runPromise(
        ActivityReaction.create({
          activityId: "activity-123",
          userId: "user-456",
          reactionType: "fire",
        }),
      );
      const reaction3 = await Effect.runPromise(
        ActivityReaction.create({
          activityId: "activity-123",
          userId: "user-789",
          reactionType: "heart",
        }),
      );

      expect(reaction1.getCompositeId()).not.toBe(reaction2.getCompositeId());
      expect(reaction1.getCompositeId()).not.toBe(reaction3.getCompositeId());
      expect(reaction2.getCompositeId()).not.toBe(reaction3.getCompositeId());
    });
  });

  // ============================================================================
  // Type Check Tests
  // ============================================================================
  describe("[UNIT] ActivityReaction Type Checks", () => {
    describe("isOfType", () => {
      it("returns true for matching type (case insensitive)", async () => {
        const reaction = await Effect.runPromise(
          ActivityReaction.create({
            activityId: "activity-123",
            userId: "user-123",
            reactionType: "heart",
          }),
        );
        expect(reaction.isOfType("heart")).toBe(true);
        expect(reaction.isOfType("HEART")).toBe(true);
        expect(reaction.isOfType("Heart")).toBe(true);
      });

      it("returns false for non-matching type", async () => {
        const reaction = await Effect.runPromise(
          ActivityReaction.create({
            activityId: "activity-123",
            userId: "user-123",
            reactionType: "heart",
          }),
        );
        expect(reaction.isOfType("fire")).toBe(false);
      });
    });

    describe("isHeart", () => {
      it("returns true for heart reaction", async () => {
        const reaction = await Effect.runPromise(
          ActivityReaction.create({
            activityId: "activity-123",
            userId: "user-123",
            reactionType: "heart",
          }),
        );
        expect(reaction.isHeart()).toBe(true);
      });

      it("returns false for non-heart reactions", async () => {
        const reaction = await Effect.runPromise(
          ActivityReaction.create({
            activityId: "activity-123",
            userId: "user-123",
            reactionType: "fire",
          }),
        );
        expect(reaction.isHeart()).toBe(false);
      });
    });

    describe("isFire", () => {
      it("returns true for fire reaction", async () => {
        const reaction = await Effect.runPromise(
          ActivityReaction.create({
            activityId: "activity-123",
            userId: "user-123",
            reactionType: "fire",
          }),
        );
        expect(reaction.isFire()).toBe(true);
      });

      it("returns false for non-fire reactions", async () => {
        const reaction = await Effect.runPromise(
          ActivityReaction.create({
            activityId: "activity-123",
            userId: "user-123",
            reactionType: "heart",
          }),
        );
        expect(reaction.isFire()).toBe(false);
      });
    });

    describe("isClap", () => {
      it("returns true for clap reaction", async () => {
        const reaction = await Effect.runPromise(
          ActivityReaction.create({
            activityId: "activity-123",
            userId: "user-123",
            reactionType: "clap",
          }),
        );
        expect(reaction.isClap()).toBe(true);
      });

      it("returns false for non-clap reactions", async () => {
        const reaction = await Effect.runPromise(
          ActivityReaction.create({
            activityId: "activity-123",
            userId: "user-123",
            reactionType: "heart",
          }),
        );
        expect(reaction.isClap()).toBe(false);
      });
    });

    describe("isStar", () => {
      it("returns true for star reaction", async () => {
        const reaction = await Effect.runPromise(
          ActivityReaction.create({
            activityId: "activity-123",
            userId: "user-123",
            reactionType: "star",
          }),
        );
        expect(reaction.isStar()).toBe(true);
      });

      it("returns false for non-star reactions", async () => {
        const reaction = await Effect.runPromise(
          ActivityReaction.create({
            activityId: "activity-123",
            userId: "user-123",
            reactionType: "heart",
          }),
        );
        expect(reaction.isStar()).toBe(false);
      });
    });
  });

  // ============================================================================
  // Activity/User Matching Tests
  // ============================================================================
  describe("[UNIT] ActivityReaction Matching Methods", () => {
    describe("isForActivity", () => {
      it("returns true for matching activityId", async () => {
        const reaction = await Effect.runPromise(
          ActivityReaction.create({
            activityId: "activity-123",
            userId: "user-123",
            reactionType: "heart",
          }),
        );
        expect(reaction.isForActivity("activity-123")).toBe(true);
      });

      it("returns false for non-matching activityId", async () => {
        const reaction = await Effect.runPromise(
          ActivityReaction.create({
            activityId: "activity-123",
            userId: "user-123",
            reactionType: "heart",
          }),
        );
        expect(reaction.isForActivity("activity-456")).toBe(false);
      });
    });

    describe("isFromUser", () => {
      it("returns true for matching userId", async () => {
        const reaction = await Effect.runPromise(
          ActivityReaction.create({
            activityId: "activity-123",
            userId: "user-123",
            reactionType: "heart",
          }),
        );
        expect(reaction.isFromUser("user-123")).toBe(true);
      });

      it("returns false for non-matching userId", async () => {
        const reaction = await Effect.runPromise(
          ActivityReaction.create({
            activityId: "activity-123",
            userId: "user-123",
            reactionType: "heart",
          }),
        );
        expect(reaction.isFromUser("user-456")).toBe(false);
      });
    });

    describe("matches", () => {
      it("returns true for exact match", async () => {
        const reaction = await Effect.runPromise(
          ActivityReaction.create({
            activityId: "activity-123",
            userId: "user-456",
            reactionType: "heart",
          }),
        );
        expect(reaction.matches("activity-123", "user-456", "heart")).toBe(
          true,
        );
      });

      it("returns false for different activityId", async () => {
        const reaction = await Effect.runPromise(
          ActivityReaction.create({
            activityId: "activity-123",
            userId: "user-456",
            reactionType: "heart",
          }),
        );
        expect(reaction.matches("activity-999", "user-456", "heart")).toBe(
          false,
        );
      });

      it("returns false for different userId", async () => {
        const reaction = await Effect.runPromise(
          ActivityReaction.create({
            activityId: "activity-123",
            userId: "user-456",
            reactionType: "heart",
          }),
        );
        expect(reaction.matches("activity-123", "user-999", "heart")).toBe(
          false,
        );
      });

      it("returns false for different reactionType", async () => {
        const reaction = await Effect.runPromise(
          ActivityReaction.create({
            activityId: "activity-123",
            userId: "user-456",
            reactionType: "heart",
          }),
        );
        expect(reaction.matches("activity-123", "user-456", "fire")).toBe(
          false,
        );
      });

      it("matches case-insensitively for reactionType", async () => {
        const reaction = await Effect.runPromise(
          ActivityReaction.create({
            activityId: "activity-123",
            userId: "user-456",
            reactionType: "heart",
          }),
        );
        expect(reaction.matches("activity-123", "user-456", "HEART")).toBe(
          true,
        );
        expect(reaction.matches("activity-123", "user-456", "Heart")).toBe(
          true,
        );
      });
    });
  });
});
