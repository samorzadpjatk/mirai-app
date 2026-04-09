import { describe, it, expect } from "bun:test";
import {
  ActivityFeed,
  REACTION_TYPES,
  emptyReactionCounts,
  type ActivityType,
  type ReactionType,
} from "./ActivityFeed";
import { ActivityReaction } from "./ActivityReaction";
import { ActivityId } from "../value-objects/ActivityId";

describe("[UNIT] ActivityFeed Entity", () => {
  describe("ActivityFeed.create", () => {
    it("should create activity with valid data", () => {
      const result = ActivityFeed.create({
        tripId: "trip-123",
        activityType: "custom",
        title: "Test Activity",
        description: "Test description",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.tripId).toBe("trip-123");
        expect(result.value.activityType).toBe("custom");
        expect(result.value.title).toBe("Test Activity");
        expect(result.value.description).toBe("Test description");
        expect(result.value.isPinned).toBe(false);
        expect(result.value.isHidden).toBe(false);
        expect(result.value.createdAt).toBeInstanceOf(Date);
      }
    });

    it("should create activity with minimum required fields", () => {
      const result = ActivityFeed.create({
        tripId: "trip-123",
        activityType: "custom",
        title: "Test",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.description).toBeNull();
        expect(result.value.imageUrl).toBeNull();
      }
    });

    it("should reject empty tripId", () => {
      const result = ActivityFeed.create({
        tripId: "",
        activityType: "custom",
        title: "Test",
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("tripId");
      }
    });

    it("should reject empty title", () => {
      const result = ActivityFeed.create({
        tripId: "trip-123",
        activityType: "custom",
        title: "",
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("title");
      }
    });

    it("should require submissionActivity for submission type", () => {
      const result = ActivityFeed.create({
        tripId: "trip-123",
        activityType: "submission",
        title: "Test",
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("submissionActivity");
      }
    });

    it("should require challengeActivity for challenge_event type", () => {
      const result = ActivityFeed.create({
        tripId: "trip-123",
        activityType: "challenge_event",
        title: "Test",
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("challengeActivity");
      }
    });

    it("should require rankChangeActivity for rank_change type", () => {
      const result = ActivityFeed.create({
        tripId: "trip-123",
        activityType: "rank_change",
        title: "Test",
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("rankChangeActivity");
      }
    });

    it("should require userPost for user_post type", () => {
      const result = ActivityFeed.create({
        tripId: "trip-123",
        activityType: "user_post",
        title: "Test",
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("userPost");
      }
    });

    it("should create submission activity with metadata", () => {
      const result = ActivityFeed.create({
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

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.submissionActivity).not.toBeNull();
        expect(result.value.submissionActivity?.submissionId).toBe("sub-123");
        expect(result.value.submissionActivity?.isWinner).toBe(true);
      }
    });

    it("should create challenge event activity with metadata", () => {
      const result = ActivityFeed.create({
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

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.challengeActivity).not.toBeNull();
        expect(result.value.challengeActivity?.eventType).toBe(
          "challenge_started",
        );
      }
    });

    it("should create user post activity with metadata", () => {
      const result = ActivityFeed.create({
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

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.userPost).not.toBeNull();
        expect(result.value.userPost?.authorFirstName).toBe("John");
        expect(result.value.userPost?.additionalImages).toHaveLength(2);
      }
    });
  });

  describe("ActivityFeed.pin", () => {
    it("should pin an activity", () => {
      const activityResult = ActivityFeed.create({
        tripId: "trip-123",
        activityType: "custom",
        title: "Test",
      });

      expect(activityResult.kind).toBe("ok");
      if (activityResult.kind !== "ok") return;

      const pinned = activityResult.value.pin();
      expect(pinned.isPinned).toBe(true);
      expect(pinned.id).toBe(activityResult.value.id); // Same ID
    });
  });

  describe("ActivityFeed.unpin", () => {
    it("should unpin an activity", () => {
      const activityResult = ActivityFeed.create({
        tripId: "trip-123",
        activityType: "custom",
        title: "Test",
        isPinned: true,
      });

      expect(activityResult.kind).toBe("ok");
      if (activityResult.kind !== "ok") return;

      const unpinned = activityResult.value.unpin();
      expect(unpinned.isPinned).toBe(false);
    });
  });

  describe("ActivityFeed.hide", () => {
    it("should hide an activity", () => {
      const activityResult = ActivityFeed.create({
        tripId: "trip-123",
        activityType: "custom",
        title: "Test",
      });

      expect(activityResult.kind).toBe("ok");
      if (activityResult.kind !== "ok") return;

      const hidden = activityResult.value.hide(
        "admin-123",
        "Inappropriate content",
      );
      expect(hidden.isHidden).toBe(true);
      expect(hidden.hiddenByAdmin).toBe("admin-123");
      expect(hidden.hiddenReason).toBe("Inappropriate content");
      expect(hidden.hiddenAt).toBeInstanceOf(Date);
    });
  });

  describe("ActivityFeed.unhide", () => {
    it("should unhide an activity", () => {
      const activityResult = ActivityFeed.create({
        tripId: "trip-123",
        activityType: "custom",
        title: "Test",
        isHidden: true,
        hiddenAt: new Date(),
        hiddenReason: "Test reason",
        hiddenByAdmin: "admin-123",
      });

      expect(activityResult.kind).toBe("ok");
      if (activityResult.kind !== "ok") return;

      const unhidden = activityResult.value.unhide();
      expect(unhidden.isHidden).toBe(false);
      expect(unhidden.hiddenByAdmin).toBeNull();
      expect(unhidden.hiddenReason).toBeNull();
      expect(unhidden.hiddenAt).toBeNull();
    });
  });

  describe("ActivityFeed.updateContent", () => {
    it("should update title and description", () => {
      const activityResult = ActivityFeed.create({
        tripId: "trip-123",
        activityType: "custom",
        title: "Original Title",
        description: "Original description",
      });

      expect(activityResult.kind).toBe("ok");
      if (activityResult.kind !== "ok") return;

      const updated = activityResult.value.updateContent({
        title: "New Title",
        description: "New description",
      });

      expect(updated.kind).toBe("ok");
      if (updated.kind === "ok") {
        expect(updated.value.title).toBe("New Title");
        expect(updated.value.description).toBe("New description");
        expect(updated.value.id).toBe(activityResult.value.id);
      }
    });

    it("should reject empty title update", () => {
      const activityResult = ActivityFeed.create({
        tripId: "trip-123",
        activityType: "custom",
        title: "Original Title",
      });

      expect(activityResult.kind).toBe("ok");
      if (activityResult.kind !== "ok") return;

      const updated = activityResult.value.updateContent({
        title: "",
      });

      expect(updated.kind).toBe("err");
    });

    it("should allow setting description to null", () => {
      const activityResult = ActivityFeed.create({
        tripId: "trip-123",
        activityType: "custom",
        title: "Title",
        description: "Original description",
      });

      expect(activityResult.kind).toBe("ok");
      if (activityResult.kind !== "ok") return;

      const updated = activityResult.value.updateContent({
        description: null,
      });

      expect(updated.kind).toBe("ok");
      if (updated.kind === "ok") {
        expect(updated.value.description).toBeNull();
      }
    });
  });

  describe("ActivityFeed.isVisible", () => {
    it("should return true for non-hidden activities", () => {
      const result = ActivityFeed.create({
        tripId: "trip-123",
        activityType: "custom",
        title: "Test",
        isHidden: false,
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.isVisible()).toBe(true);
      }
    });

    it("should return false for hidden activities", () => {
      const result = ActivityFeed.create({
        tripId: "trip-123",
        activityType: "custom",
        title: "Test",
        isHidden: true,
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.isVisible()).toBe(false);
      }
    });
  });

  describe("ActivityFeed.isAdminCreated", () => {
    it("should return true for admin-created activities", () => {
      const result = ActivityFeed.create({
        tripId: "trip-123",
        activityType: "custom",
        title: "Test",
        createdByAdmin: "admin-123",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.isAdminCreated()).toBe(true);
      }
    });

    it("should return false for user-created activities", () => {
      const result = ActivityFeed.create({
        tripId: "trip-123",
        activityType: "custom",
        title: "Test",
        createdByAdmin: null,
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.isAdminCreated()).toBe(false);
      }
    });
  });

  describe("ActivityFeed.isUserPost", () => {
    it("should return true for user_post type", () => {
      const result = ActivityFeed.create({
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

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.isUserPost()).toBe(true);
      }
    });

    it("should return false for other types", () => {
      const result = ActivityFeed.create({
        tripId: "trip-123",
        activityType: "custom",
        title: "Test",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.isUserPost()).toBe(false);
      }
    });
  });

  describe("ActivityFeed.compareForSort", () => {
    it("should sort pinned before unpinned", () => {
      const pinnedResult = ActivityFeed.create({
        tripId: "trip-123",
        activityType: "custom",
        title: "Pinned",
        isPinned: true,
        createdAt: new Date("2026-01-01"),
      });

      const unpinnedResult = ActivityFeed.create({
        tripId: "trip-123",
        activityType: "custom",
        title: "Unpinned",
        isPinned: false,
        createdAt: new Date("2026-01-02"),
      });

      expect(pinnedResult.kind).toBe("ok");
      expect(unpinnedResult.kind).toBe("ok");

      if (pinnedResult.kind === "ok" && unpinnedResult.kind === "ok") {
        // Pinned should come before unpinned
        expect(
          pinnedResult.value.compareForSort(unpinnedResult.value),
        ).toBeLessThan(0);
        expect(
          unpinnedResult.value.compareForSort(pinnedResult.value),
        ).toBeGreaterThan(0);
      }
    });

    it("should sort by createdAt descending when same pin status", () => {
      const olderResult = ActivityFeed.create({
        tripId: "trip-123",
        activityType: "custom",
        title: "Older",
        isPinned: false,
        createdAt: new Date("2026-01-01"),
      });

      const newerResult = ActivityFeed.create({
        tripId: "trip-123",
        activityType: "custom",
        title: "Newer",
        isPinned: false,
        createdAt: new Date("2026-01-02"),
      });

      expect(olderResult.kind).toBe("ok");
      expect(newerResult.kind).toBe("ok");

      if (olderResult.kind === "ok" && newerResult.kind === "ok") {
        // Newer should come before older
        expect(
          newerResult.value.compareForSort(olderResult.value),
        ).toBeLessThan(0);
        expect(
          olderResult.value.compareForSort(newerResult.value),
        ).toBeGreaterThan(0);
      }
    });
  });
});

describe("ActivityReaction Entity", () => {
  describe("ActivityReaction.create", () => {
    it("should create reaction with valid data", () => {
      const activityId = ActivityId.generate();
      const result = ActivityReaction.create({
        activityId,
        userId: "user-123",
        reactionType: "heart",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.activityId).toBe(activityId);
        expect(result.value.userId).toBe("user-123");
        expect(result.value.reactionType).toBe("heart");
        expect(result.value.createdAt).toBeInstanceOf(Date);
      }
    });

    it("should reject empty activityId", () => {
      const result = ActivityReaction.create({
        activityId: " " as ActivityId,
        userId: "user-123",
        reactionType: "heart",
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("activityId");
      }
    });

    it("should reject empty userId", () => {
      const activityId = ActivityId.generate();
      const result = ActivityReaction.create({
        activityId,
        userId: "",
        reactionType: "heart",
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("userId");
      }
    });

    it("should reject invalid reaction type", () => {
      const activityId = ActivityId.generate();
      const result = ActivityReaction.create({
        activityId,
        userId: "user-123",
        reactionType: "invalid" as ReactionType,
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("Invalid reaction type");
      }
    });

    it("should accept all valid reaction types", () => {
      const activityId = ActivityId.generate();

      for (const reactionType of REACTION_TYPES) {
        const result = ActivityReaction.create({
          activityId,
          userId: "user-123",
          reactionType,
        });

        expect(result.kind).toBe("ok");
        if (result.kind === "ok") {
          expect(result.value.reactionType).toBe(reactionType);
        }
      }
    });
  });

  describe("ActivityReaction.getCompositeId", () => {
    it("should generate unique key for reaction", () => {
      const activityId = ActivityId.generate();
      const result = ActivityReaction.create({
        activityId,
        userId: "user-123",
        reactionType: "heart",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        const key = result.value.getCompositeId();
        expect(key).toContain(activityId);
        expect(key).toContain("user-123");
        expect(key).toContain("heart");
      }
    });
  });

  describe("ActivityReaction.isOfType", () => {
    it("should check if reaction is of specific type", () => {
      const activityId = ActivityId.generate();
      const result = ActivityReaction.create({
        activityId,
        userId: "user-123",
        reactionType: "fire",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.isOfType("fire")).toBe(true);
        expect(result.value.isOfType("heart")).toBe(false);
      }
    });
  });
});

describe("emptyReactionCounts", () => {
  it("should return zero counts for all reaction types", () => {
    const counts = emptyReactionCounts();
    expect(counts.heart).toBe(0);
    expect(counts.fire).toBe(0);
    expect(counts.clap).toBe(0);
    expect(counts.star).toBe(0);
  });
});
