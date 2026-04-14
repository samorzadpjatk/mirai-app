import { describe, it, expect } from "bun:test";
import { Effect, Exit, Cause } from "effect";
import {
  ActivityFeed,
  REACTION_TYPES,
  emptyReactionCounts,
  type ActivityType,
  type ReactionType,
} from "./ActivityFeed";
import { ActivityReaction } from "./ActivityReaction";
import { ActivityId } from "../value-objects/ActivityId";
import { ValidationError } from "../errors";

describe("[UNIT] ActivityFeed Entity", () => {
  describe("[UNIT] ActivityFeed.create", () => {
    it("should create activity with valid data", () => {
      const effect = ActivityFeed.create({
        tripId: "trip-123",
        activityType: "custom",
        title: "Test Activity",
        description: "Test description",
      });

      const activity = Effect.runSync(effect);
      expect(activity.tripId).toBe("trip-123");
      expect(activity.activityType).toBe("custom");
      expect(activity.title).toBe("Test Activity");
      expect(activity.description).toBe("Test description");
      expect(activity.isPinned).toBe(false);
      expect(activity.isHidden).toBe(false);
      expect(activity.createdAt).toBeInstanceOf(Date);
    });

    it("should create activity with minimum required fields", () => {
      const effect = ActivityFeed.create({
        tripId: "trip-123",
        activityType: "custom",
        title: "Test",
      });

      const activity = Effect.runSync(effect);
      expect(activity.description).toBeNull();
      expect(activity.imageUrl).toBeNull();
    });

    it("should reject empty tripId", () => {
      const effect = ActivityFeed.create({
        tripId: "",
        activityType: "custom",
        title: "Test",
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        const error = exit.cause.error;
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.field).toBe("tripId");
      }
    });

    it("should reject empty title", () => {
      const effect = ActivityFeed.create({
        tripId: "trip-123",
        activityType: "custom",
        title: "",
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        const error = exit.cause.error;
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.field).toBe("title");
      }
    });

    it("should require submissionActivity or submissionMetadata for submission type", () => {
      const effect = ActivityFeed.create({
        tripId: "trip-123",
        activityType: "submission",
        title: "Test",
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        const error = exit.cause.error;
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.field).toBe("submissionMetadata");
      }
    });

    it("should require challengeActivity or challengeMetadata for challenge_event type", () => {
      const effect = ActivityFeed.create({
        tripId: "trip-123",
        activityType: "challenge_event",
        title: "Test",
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        const error = exit.cause.error;
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.field).toBe("challengeMetadata");
      }
    });

    it("should require rankChangeActivity or rankChangeMetadata for rank_change type", () => {
      const effect = ActivityFeed.create({
        tripId: "trip-123",
        activityType: "rank_change",
        title: "Test",
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        const error = exit.cause.error;
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.field).toBe("rankChangeMetadata");
      }
    });

    it("should require userPost or postMetadata for user_post type", () => {
      const effect = ActivityFeed.create({
        tripId: "trip-123",
        activityType: "user_post",
        title: "Test",
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        const error = exit.cause.error;
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.field).toBe("postMetadata");
      }
    });

    it("should create submission activity with metadata", () => {
      const effect = ActivityFeed.create({
        tripId: "trip-123",
        activityType: "submission",
        title: "Submission Activity",
        submissionActivity: {
          submissionId: "sub-123",
          challengeId: "challenge-123",
          groupId: "group-123",
          hasVideo: true,
          isWinner: true,
          ranking: 1,
          pointsAwarded: 100,
          currentGroupRank: 2,
        },
      });

      const activity = Effect.runSync(effect);
      expect(activity.submissionActivity).not.toBeNull();
      expect(activity.submissionActivity?.submissionId).toBe("sub-123");
      expect(activity.submissionActivity?.isWinner).toBe(true);
    });

    it("should create challenge event activity with metadata", () => {
      const effect = ActivityFeed.create({
        tripId: "trip-123",
        activityType: "challenge_event",
        title: "Challenge Started",
        challengeActivity: {
          challengeId: "challenge-123",
          eventType: "challenge_started",
          endTime: new Date("2026-12-31"),
          submissionType: "IMAGE",
          basePoints: 50,
          submissionCount: 10,
        },
      });

      const activity = Effect.runSync(effect);
      expect(activity.challengeActivity).not.toBeNull();
      expect(activity.challengeActivity?.eventType).toBe("challenge_started");
    });

    it("should create user post activity with metadata", () => {
      const effect = ActivityFeed.create({
        tripId: "trip-123",
        activityType: "user_post",
        title: "User Post",
        userPost: {
          authorId: "author-123",
          authorUserId: "user-123",
          authorFirstName: "John",
          authorLastName: "Doe",
          authorHasAvatar: true,
          groupId: "group-123",
          groupName: "Team A",
          additionalImages: ["image1.jpg", "image2.jpg"],
        },
      });

      const activity = Effect.runSync(effect);
      expect(activity.userPost).not.toBeNull();
      expect(activity.userPost?.authorFirstName).toBe("John");
      expect(activity.userPost?.additionalImages).toHaveLength(2);
    });
  });

  describe("[UNIT] ActivityFeed.pin", () => {
    it("should pin an activity", () => {
      const effect = ActivityFeed.create({
        tripId: "trip-123",
        activityType: "custom",
        title: "Test",
      });

      const activity = Effect.runSync(effect);
      const pinned = activity.pin();
      expect(pinned.isPinned).toBe(true);
      expect(pinned.id).toBe(activity.id);
    });
  });

  describe("[UNIT] ActivityFeed.unpin", () => {
    it("should unpin an activity", () => {
      const effect = ActivityFeed.create({
        tripId: "trip-123",
        activityType: "custom",
        title: "Test",
        isPinned: true,
      });

      const activity = Effect.runSync(effect);
      const unpinned = activity.unpin();
      expect(unpinned.isPinned).toBe(false);
    });
  });

  describe("[UNIT] ActivityFeed.hide", () => {
    it("should hide an activity", () => {
      const effect = ActivityFeed.create({
        tripId: "trip-123",
        activityType: "custom",
        title: "Test",
      });

      const activity = Effect.runSync(effect);
      const hidden = activity.hide("admin-123", "Inappropriate content");
      expect(hidden.isHidden).toBe(true);
      expect(hidden.hiddenByAdmin).toBe("admin-123");
      expect(hidden.hiddenReason).toBe("Inappropriate content");
      expect(hidden.hiddenAt).toBeInstanceOf(Date);
    });
  });

  describe("[UNIT] ActivityFeed.unhide", () => {
    it("should unhide an activity", () => {
      const effect = ActivityFeed.create({
        tripId: "trip-123",
        activityType: "custom",
        title: "Test",
        isHidden: true,
        hiddenAt: new Date(),
        hiddenReason: "Test reason",
        hiddenByAdmin: "admin-123",
      });

      const activity = Effect.runSync(effect);
      const unhidden = activity.unhide();
      expect(unhidden.isHidden).toBe(false);
      expect(unhidden.hiddenByAdmin).toBeNull();
      expect(unhidden.hiddenReason).toBeNull();
      expect(unhidden.hiddenAt).toBeNull();
    });
  });

  describe("[UNIT] ActivityFeed.updateContent", () => {
    it("should update title and description", () => {
      const effect = ActivityFeed.create({
        tripId: "trip-123",
        activityType: "custom",
        title: "Original Title",
        description: "Original description",
      });

      const activity = Effect.runSync(effect);
      const updatedEffect = activity.updateContent({
        title: "New Title",
        description: "New description",
      });

      const updated = Effect.runSync(updatedEffect);
      expect(updated.title).toBe("New Title");
      expect(updated.description).toBe("New description");
      expect(updated.id).toBe(activity.id);
    });

    it("should reject empty title update", () => {
      const effect = ActivityFeed.create({
        tripId: "trip-123",
        activityType: "custom",
        title: "Original Title",
      });

      const activity = Effect.runSync(effect);
      const updatedEffect = activity.updateContent({
        title: "",
      });

      const exit = Effect.runSyncExit(updatedEffect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        const error = exit.cause.error;
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.field).toBe("title");
      }
    });

    it("should allow setting description to null", () => {
      const effect = ActivityFeed.create({
        tripId: "trip-123",
        activityType: "custom",
        title: "Title",
        description: "Original description",
      });

      const activity = Effect.runSync(effect);
      const updatedEffect = activity.updateContent({
        description: null,
      });

      const updated = Effect.runSync(updatedEffect);
      expect(updated.description).toBeNull();
    });
  });

  describe("[UNIT] ActivityFeed.isVisible", () => {
    it("should return true for non-hidden activities", () => {
      const effect = ActivityFeed.create({
        tripId: "trip-123",
        activityType: "custom",
        title: "Test",
        isHidden: false,
      });

      const activity = Effect.runSync(effect);
      expect(activity.isVisible()).toBe(true);
    });

    it("should return false for hidden activities", () => {
      const effect = ActivityFeed.create({
        tripId: "trip-123",
        activityType: "custom",
        title: "Test",
        isHidden: true,
      });

      const activity = Effect.runSync(effect);
      expect(activity.isVisible()).toBe(false);
    });
  });

  describe("[UNIT] ActivityFeed.isAdminCreated", () => {
    it("should return true for admin-created activities", () => {
      const effect = ActivityFeed.create({
        tripId: "trip-123",
        activityType: "custom",
        title: "Test",
        createdByAdmin: "admin-123",
      });

      const activity = Effect.runSync(effect);
      expect(activity.isAdminCreated()).toBe(true);
    });

    it("should return false for user-created activities", () => {
      const effect = ActivityFeed.create({
        tripId: "trip-123",
        activityType: "custom",
        title: "Test",
        createdByAdmin: null,
      });

      const activity = Effect.runSync(effect);
      expect(activity.isAdminCreated()).toBe(false);
    });
  });

  describe("[UNIT] ActivityFeed.isUserPost", () => {
    it("should return true for user_post type", () => {
      const effect = ActivityFeed.create({
        tripId: "trip-123",
        activityType: "user_post",
        title: "Test",
        userPost: {
          authorId: "author-123",
          authorUserId: "user-123",
          authorFirstName: "John",
          authorLastName: "Doe",
          authorHasAvatar: false,
          groupId: null,
          groupName: null,
          additionalImages: [],
        },
      });

      const activity = Effect.runSync(effect);
      expect(activity.isUserPost()).toBe(true);
    });

    it("should return false for other types", () => {
      const effect = ActivityFeed.create({
        tripId: "trip-123",
        activityType: "custom",
        title: "Test",
      });

      const activity = Effect.runSync(effect);
      expect(activity.isUserPost()).toBe(false);
    });
  });

  describe("[UNIT] ActivityFeed.compareForSort", () => {
    it("should sort pinned before unpinned", () => {
      const pinnedEffect = ActivityFeed.create({
        tripId: "trip-123",
        activityType: "custom",
        title: "Pinned",
        isPinned: true,
        createdAt: new Date("2026-01-01"),
      });

      const unpinnedEffect = ActivityFeed.create({
        tripId: "trip-123",
        activityType: "custom",
        title: "Unpinned",
        isPinned: false,
        createdAt: new Date("2026-01-02"),
      });

      const pinned = Effect.runSync(pinnedEffect);
      const unpinned = Effect.runSync(unpinnedEffect);

      // Pinned should come before unpinned
      expect(pinned.compareForSort(unpinned)).toBeLessThan(0);
      expect(unpinned.compareForSort(pinned)).toBeGreaterThan(0);
    });

    it("should sort by createdAt descending when same pin status", () => {
      const olderEffect = ActivityFeed.create({
        tripId: "trip-123",
        activityType: "custom",
        title: "Older",
        isPinned: false,
        createdAt: new Date("2026-01-01"),
      });

      const newerEffect = ActivityFeed.create({
        tripId: "trip-123",
        activityType: "custom",
        title: "Newer",
        isPinned: false,
        createdAt: new Date("2026-01-02"),
      });

      const older = Effect.runSync(olderEffect);
      const newer = Effect.runSync(newerEffect);

      // Newer should come before older
      expect(newer.compareForSort(older)).toBeLessThan(0);
      expect(older.compareForSort(newer)).toBeGreaterThan(0);
    });
  });
});

describe("[UNIT] ActivityReaction Entity (in ActivityFeed.test.ts)", () => {
  describe("[UNIT] ActivityReaction.create", () => {
    it("should create reaction with valid data", () => {
      const activityId = ActivityId.generate();
      const effect = ActivityReaction.create({
        activityId,
        userId: "user-123",
        reactionType: "heart",
      });

      const reaction = Effect.runSync(effect);
      expect(reaction.activityId).toBe(activityId);
      expect(reaction.userId).toBe("user-123");
      expect(reaction.reactionType).toBe("heart");
      expect(reaction.createdAt).toBeInstanceOf(Date);
    });

    it("should reject empty activityId", () => {
      const effect = ActivityReaction.create({
        activityId: " " as ActivityId,
        userId: "user-123",
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
      const activityId = ActivityId.generate();
      const effect = ActivityReaction.create({
        activityId,
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

    it("should reject invalid reaction type", () => {
      const activityId = ActivityId.generate();
      const effect = ActivityReaction.create({
        activityId,
        userId: "user-123",
        reactionType: "invalid" as ReactionType,
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        const error = exit.cause.error;
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.field).toBe("reactionType");
      }
    });

    it("should accept all valid reaction types", () => {
      const activityId = ActivityId.generate();

      for (const reactionType of REACTION_TYPES) {
        const effect = ActivityReaction.create({
          activityId,
          userId: "user-123",
          reactionType,
        });

        const reaction = Effect.runSync(effect);
        expect(reaction.reactionType).toBe(reactionType);
      }
    });
  });

  describe("[UNIT] ActivityReaction.getCompositeId", () => {
    it("should generate unique key for reaction", () => {
      const activityId = ActivityId.generate();
      const effect = ActivityReaction.create({
        activityId,
        userId: "user-123",
        reactionType: "heart",
      });

      const reaction = Effect.runSync(effect);
      const key = reaction.getCompositeId();
      expect(key).toContain(activityId);
      expect(key).toContain("user-123");
      expect(key).toContain("heart");
    });
  });

  describe("[UNIT] ActivityReaction.isOfType", () => {
    it("should check if reaction is of specific type", () => {
      const activityId = ActivityId.generate();
      const effect = ActivityReaction.create({
        activityId,
        userId: "user-123",
        reactionType: "fire",
      });

      const reaction = Effect.runSync(effect);
      expect(reaction.isOfType("fire")).toBe(true);
      expect(reaction.isOfType("heart")).toBe(false);
    });
  });
});

describe("[UNIT] emptyReactionCounts", () => {
  it("should return zero counts for all reaction types", () => {
    const counts = emptyReactionCounts();
    expect(counts.heart).toBe(0);
    expect(counts.fire).toBe(0);
    expect(counts.clap).toBe(0);
    expect(counts.star).toBe(0);
  });
});
