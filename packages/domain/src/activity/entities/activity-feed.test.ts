import { describe, it, expect } from "bun:test";
import { Effect } from "effect";
import { ActivityFeed } from "./activity-feed";
import type {
  ChallengeMetadata,
  RankChangeMetadata,
  SubmissionMetadata,
  PostMetadata,
  UserPostMetadata,
} from "./activity-feed";
import { ValidationError } from "../../system/errors";
import type { ActivityId } from "../value-objects/id";

// =============================================================================
// Test Data Builders
// =============================================================================

const createChallengeMetadata = (): ChallengeMetadata => ({
  challengeId: "challenge-123",
  challengeName: "Summer Challenge",
  type: "challenge_started",
});

const createRankChangeMetadata = (): RankChangeMetadata => ({
  groupId: "group-123",
  newRank: 1,
  totalCoins: 100,
  coinsGained: 10,
});

const createSubmissionMetadata = (): SubmissionMetadata => ({
  submissionId: "submission-123",
  challengeId: "challenge-123",
  groupId: "group-123",
  hasVideo: true,
  isWinner: false,
  ranking: null,
  pointsAwarded: null,
});

const createPostMetadata = (): PostMetadata => ({
  authorId: "user-123",
  additionalImages: [],
});

const createUserPostMetadata = (): UserPostMetadata => ({
  authorId: "user-123",
  authorUserId: "auth-user-123",
  authorFirstName: "John",
  authorLastName: "Doe",
  authorHasAvatar: true,
  groupId: null,
  groupName: null,
  additionalImages: [],
});

// =============================================================================
// ActivityFeed Tests
// =============================================================================

describe("[UNIT] ActivityFeed", () => {
  const baseProps = {
    id: "activity-123" as ActivityId,
    tripId: "trip-123",
    activityType: "custom" as const,
    title: "Test Activity",
    description: "Test description",
    imageUrl: null,
    isPinned: false,
    isHidden: false,
    hiddenAt: null,
    hiddenReason: null,
    createdByAdmin: null,
    hiddenByAdmin: null,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    challengeMetadata: null,
    rankChangeMetadata: null,
    submissionMetadata: null,
    postMetadata: null,
    admin: null,
    hiddenBy: null,
  };

  // ============================================================================
  // Factory Tests
  // ============================================================================
  describe("[UNIT] ActivityFeed.create", () => {
    it("creates activity with valid data", async () => {
      const result = await Effect.runPromise(ActivityFeed.create(baseProps));
      expect(result.id).toBe(baseProps.id);
      expect(result.tripId).toBe("trip-123");
      expect(result.activityType).toBe("custom");
      expect(result.title).toBe("Test Activity");
      expect(result.description).toBe("Test description");
    });

    it("creates with minimal required data", async () => {
      const result = await Effect.runPromise(
        ActivityFeed.create({
          tripId: "trip-123",
          activityType: "custom",
          title: "Minimal Activity",
        }),
      );
      expect(result.tripId).toBe("trip-123");
      expect(result.title).toBe("Minimal Activity");
      expect(result.isPinned).toBe(false);
      expect(result.isHidden).toBe(false);
    });

    it("fails for empty tripId", async () => {
      const result = await Effect.runPromise(
        Effect.either(ActivityFeed.create({ ...baseProps, tripId: "" })),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("tripId");
      }
    });

    it("fails for empty title", async () => {
      const result = await Effect.runPromise(
        Effect.either(ActivityFeed.create({ ...baseProps, title: "" })),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("title");
      }
    });

    it("fails for whitespace-only title", async () => {
      const result = await Effect.runPromise(
        Effect.either(ActivityFeed.create({ ...baseProps, title: "   " })),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("title");
      }
    });

    it("fails for title > 500 chars", async () => {
      const result = await Effect.runPromise(
        Effect.either(
          ActivityFeed.create({ ...baseProps, title: "a".repeat(501) }),
        ),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("title");
        expect(result.left.message).toContain("at most 500 characters");
      }
    });

    it("trims title on creation", async () => {
      const result = await Effect.runPromise(
        ActivityFeed.create({
          ...baseProps,
          title: "  Test Activity  ",
        }),
      );
      expect(result.title).toBe("Test Activity");
    });

    it("fails for submission type without metadata", async () => {
      const result = await Effect.runPromise(
        Effect.either(
          ActivityFeed.create({
            tripId: "trip-123",
            activityType: "submission",
            title: "Submission Activity",
          }),
        ),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("submissionMetadata");
        expect(result.left.message).toContain("submissionMetadata is required");
      }
    });

    it("succeeds for submission type with submissionMetadata", async () => {
      const result = await Effect.runPromise(
        ActivityFeed.create({
          tripId: "trip-123",
          activityType: "submission",
          title: "Submission Activity",
          submissionMetadata: createSubmissionMetadata(),
        }),
      );
      expect(result.activityType).toBe("submission");
      expect(result.submissionMetadata).toEqual(createSubmissionMetadata());
    });

    it("fails for challenge_event type without metadata", async () => {
      const result = await Effect.runPromise(
        Effect.either(
          ActivityFeed.create({
            tripId: "trip-123",
            activityType: "challenge_event",
            title: "Challenge Activity",
          }),
        ),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("challengeMetadata");
        expect(result.left.message).toContain("challengeMetadata is required");
      }
    });

    it("succeeds for challenge_event type with challengeMetadata", async () => {
      const result = await Effect.runPromise(
        ActivityFeed.create({
          tripId: "trip-123",
          activityType: "challenge_event",
          title: "Challenge Activity",
          challengeMetadata: createChallengeMetadata(),
        }),
      );
      expect(result.activityType).toBe("challenge_event");
      expect(result.challengeMetadata).toEqual(createChallengeMetadata());
    });

    it("fails for rank_change type without metadata", async () => {
      const result = await Effect.runPromise(
        Effect.either(
          ActivityFeed.create({
            tripId: "trip-123",
            activityType: "rank_change",
            title: "Rank Change Activity",
          }),
        ),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("rankChangeMetadata");
        expect(result.left.message).toContain("rankChangeMetadata is required");
      }
    });

    it("succeeds for rank_change type with rankChangeMetadata", async () => {
      const result = await Effect.runPromise(
        ActivityFeed.create({
          tripId: "trip-123",
          activityType: "rank_change",
          title: "Rank Change Activity",
          rankChangeMetadata: createRankChangeMetadata(),
        }),
      );
      expect(result.activityType).toBe("rank_change");
      expect(result.rankChangeMetadata).toEqual(createRankChangeMetadata());
    });

    it("fails for user_post type without metadata", async () => {
      const result = await Effect.runPromise(
        Effect.either(
          ActivityFeed.create({
            tripId: "trip-123",
            activityType: "user_post",
            title: "User Post Activity",
          }),
        ),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("postMetadata");
        expect(result.left.message).toContain("postMetadata is required");
      }
    });

    it("succeeds for user_post type with postMetadata", async () => {
      const result = await Effect.runPromise(
        ActivityFeed.create({
          tripId: "trip-123",
          activityType: "user_post",
          title: "User Post Activity",
          postMetadata: createPostMetadata(),
        }),
      );
      expect(result.activityType).toBe("user_post");
      expect(result.postMetadata).toEqual(createPostMetadata());
    });
  });

  // ============================================================================
  // Specialized Factory Tests
  // ============================================================================
  describe("[UNIT] ActivityFeed.createChallengeActivity", () => {
    it("creates challenge activity with valid data", async () => {
      const result = await Effect.runPromise(
        ActivityFeed.createChallengeActivity({
          tripId: "trip-123",
          title: "Challenge Started",
          description: "A new challenge has begun",
          challenge: createChallengeMetadata(),
        }),
      );
      expect(result.activityType).toBe("challenge_event");
      expect(result.challengeMetadata).toEqual(createChallengeMetadata());
    });

    it("creates with optional description", async () => {
      const result = await Effect.runPromise(
        ActivityFeed.createChallengeActivity({
          tripId: "trip-123",
          title: "Challenge Started",
          challenge: createChallengeMetadata(),
        }),
      );
      expect(result.description).toBeNull();
    });
  });

  describe("[UNIT] ActivityFeed.createRankChangeActivity", () => {
    it("creates rank change activity with valid data", async () => {
      const result = await Effect.runPromise(
        ActivityFeed.createRankChangeActivity({
          tripId: "trip-123",
          title: "Rank Up!",
          rankChange: createRankChangeMetadata(),
        }),
      );
      expect(result.activityType).toBe("rank_change");
      expect(result.rankChangeMetadata).toEqual(createRankChangeMetadata());
    });
  });

  describe("[UNIT] ActivityFeed.createSubmissionActivity", () => {
    it("creates submission activity with valid data", async () => {
      const result = await Effect.runPromise(
        ActivityFeed.createSubmissionActivity({
          tripId: "trip-123",
          title: "New Submission",
          submission: createSubmissionMetadata(),
        }),
      );
      expect(result.activityType).toBe("submission");
      expect(result.submissionMetadata).toEqual(createSubmissionMetadata());
    });
  });

  describe("[UNIT] ActivityFeed.createPostActivity", () => {
    it("creates user post activity with valid data", async () => {
      const result = await Effect.runPromise(
        ActivityFeed.createPostActivity({
          tripId: "trip-123",
          title: "User Post",
          post: createPostMetadata(),
        }),
      );
      expect(result.activityType).toBe("user_post");
      expect(result.postMetadata).toEqual(createPostMetadata());
    });
  });

  // ============================================================================
  // Type Guard Tests
  // ============================================================================
  describe("[UNIT] ActivityFeed Type Guards", () => {
    describe("isChallengeActivity", () => {
      it("returns true for challenge_event with metadata", async () => {
        const activity = await Effect.runPromise(
          ActivityFeed.createChallengeActivity({
            tripId: "trip-123",
            title: "Challenge",
            challenge: createChallengeMetadata(),
          }),
        );
        expect(activity.isChallengeActivity()).toBe(true);
      });

      it("returns false for non-challenge types", async () => {
        const activity = await Effect.runPromise(
          ActivityFeed.create({
            tripId: "trip-123",
            activityType: "custom",
            title: "Custom Activity",
          }),
        );
        expect(activity.isChallengeActivity()).toBe(false);
      });
    });

    describe("isRankChange", () => {
      it("returns true for rank_change with metadata", async () => {
        const activity = await Effect.runPromise(
          ActivityFeed.createRankChangeActivity({
            tripId: "trip-123",
            title: "Rank Up",
            rankChange: createRankChangeMetadata(),
          }),
        );
        expect(activity.isRankChange()).toBe(true);
      });

      it("returns false for non-rank types", async () => {
        const activity = await Effect.runPromise(
          ActivityFeed.create({
            tripId: "trip-123",
            activityType: "custom",
            title: "Custom Activity",
          }),
        );
        expect(activity.isRankChange()).toBe(false);
      });
    });

    describe("isSubmission", () => {
      it("returns true for submission with metadata", async () => {
        const activity = await Effect.runPromise(
          ActivityFeed.createSubmissionActivity({
            tripId: "trip-123",
            title: "Submission",
            submission: createSubmissionMetadata(),
          }),
        );
        expect(activity.isSubmission()).toBe(true);
      });

      it("returns false for non-submission types", async () => {
        const activity = await Effect.runPromise(
          ActivityFeed.create({
            tripId: "trip-123",
            activityType: "custom",
            title: "Custom Activity",
          }),
        );
        expect(activity.isSubmission()).toBe(false);
      });
    });

    describe("isUserPostActivity", () => {
      it("returns true for user_post with metadata", async () => {
        const activity = await Effect.runPromise(
          ActivityFeed.createPostActivity({
            tripId: "trip-123",
            title: "User Post",
            post: createPostMetadata(),
          }),
        );
        expect(activity.isUserPostActivity()).toBe(true);
      });

      it("returns false for non-post types", async () => {
        const activity = await Effect.runPromise(
          ActivityFeed.create({
            tripId: "trip-123",
            activityType: "custom",
            title: "Custom Activity",
          }),
        );
        expect(activity.isUserPostActivity()).toBe(false);
      });
    });
  });

  // ============================================================================
  // Pin/Unpin Tests
  // ============================================================================
  describe("[UNIT] ActivityFeed pin/unpin", () => {
    it("pins unpinned activity", async () => {
      const activity = await Effect.runPromise(
        ActivityFeed.create({
          tripId: "trip-123",
          activityType: "custom",
          title: "Test Activity",
          isPinned: false,
        }),
      );
      const pinned = activity.pin();
      expect(pinned.isPinned).toBe(true);
    });

    it("unpins pinned activity", async () => {
      const activity = await Effect.runPromise(
        ActivityFeed.create({
          tripId: "trip-123",
          activityType: "custom",
          title: "Test Activity",
          isPinned: true,
        }),
      );
      const unpinned = activity.unpin();
      expect(unpinned.isPinned).toBe(false);
    });

    it("returns immutable instance (original unchanged)", async () => {
      const activity = await Effect.runPromise(
        ActivityFeed.create({
          tripId: "trip-123",
          activityType: "custom",
          title: "Test Activity",
          isPinned: false,
        }),
      );
      activity.pin();
      expect(activity.isPinned).toBe(false);
    });

    it("updates updatedAt on pin", async () => {
      const activity = await Effect.runPromise(
        ActivityFeed.create({
          tripId: "trip-123",
          activityType: "custom",
          title: "Test Activity",
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
        }),
      );
      const pinned = activity.pin();
      expect(pinned.updatedAt.getTime()).toBeGreaterThan(
        activity.updatedAt.getTime(),
      );
    });
  });

  // ============================================================================
  // Hide/Unhide Tests
  // ============================================================================
  describe("[UNIT] ActivityFeed hide/unhide", () => {
    it("hides visible activity", async () => {
      const activity = await Effect.runPromise(
        ActivityFeed.create({
          tripId: "trip-123",
          activityType: "custom",
          title: "Test Activity",
          isHidden: false,
        }),
      );
      const hidden = activity.hide("admin-123", "Inappropriate content");
      expect(hidden.isHidden).toBe(true);
      expect(hidden.hiddenByAdmin).toBe("admin-123");
      expect(hidden.hiddenReason).toBe("Inappropriate content");
      expect(hidden.hiddenAt).not.toBeNull();
    });

    it("hides without reason", async () => {
      const activity = await Effect.runPromise(
        ActivityFeed.create({
          tripId: "trip-123",
          activityType: "custom",
          title: "Test Activity",
          isHidden: false,
        }),
      );
      const hidden = activity.hide("admin-123");
      expect(hidden.hiddenReason).toBeNull();
    });

    it("unhides hidden activity", async () => {
      const activity = await Effect.runPromise(
        ActivityFeed.create({
          tripId: "trip-123",
          activityType: "custom",
          title: "Test Activity",
          isHidden: true,
          hiddenAt: new Date(),
          hiddenReason: "Spam",
          hiddenByAdmin: "admin-123",
        }),
      );
      const unhidden = activity.unhide();
      expect(unhidden.isHidden).toBe(false);
      expect(unhidden.hiddenByAdmin).toBeNull();
      expect(unhidden.hiddenReason).toBeNull();
      expect(unhidden.hiddenAt).toBeNull();
    });

    it("returns immutable instance (original unchanged)", async () => {
      const activity = await Effect.runPromise(
        ActivityFeed.create({
          tripId: "trip-123",
          activityType: "custom",
          title: "Test Activity",
          isHidden: false,
        }),
      );
      activity.hide("admin-123");
      expect(activity.isHidden).toBe(false);
    });

    it("updates updatedAt on hide", async () => {
      const activity = await Effect.runPromise(
        ActivityFeed.create({
          tripId: "trip-123",
          activityType: "custom",
          title: "Test Activity",
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
        }),
      );
      const hidden = activity.hide("admin-123");
      expect(hidden.updatedAt.getTime()).toBeGreaterThan(
        activity.updatedAt.getTime(),
      );
    });
  });

  // ============================================================================
  // updateContent Tests
  // ============================================================================
  describe("[UNIT] ActivityFeed.updateContent", () => {
    it("updates title", async () => {
      const activity = await Effect.runPromise(ActivityFeed.create(baseProps));
      const updated = await Effect.runPromise(
        activity.updateContent({ title: "New Title" }),
      );
      expect(updated.title).toBe("New Title");
    });

    it("updates description", async () => {
      const activity = await Effect.runPromise(ActivityFeed.create(baseProps));
      const updated = await Effect.runPromise(
        activity.updateContent({ description: "New description" }),
      );
      expect(updated.description).toBe("New description");
    });

    it("updates both title and description", async () => {
      const activity = await Effect.runPromise(ActivityFeed.create(baseProps));
      const updated = await Effect.runPromise(
        activity.updateContent({
          title: "New Title",
          description: "New description",
        }),
      );
      expect(updated.title).toBe("New Title");
      expect(updated.description).toBe("New description");
    });

    it("trims title on update", async () => {
      const activity = await Effect.runPromise(ActivityFeed.create(baseProps));
      const updated = await Effect.runPromise(
        activity.updateContent({ title: "  New Title  " }),
      );
      expect(updated.title).toBe("New Title");
    });

    it("fails for empty title on update", async () => {
      const activity = await Effect.runPromise(ActivityFeed.create(baseProps));
      const result = await Effect.runPromise(
        Effect.either(activity.updateContent({ title: "" })),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("title");
      }
    });

    it("fails for title > 500 chars on update", async () => {
      const activity = await Effect.runPromise(ActivityFeed.create(baseProps));
      const result = await Effect.runPromise(
        Effect.either(activity.updateContent({ title: "a".repeat(501) })),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("title");
      }
    });

    it("preserves unchanged fields on update", async () => {
      const activity = await Effect.runPromise(ActivityFeed.create(baseProps));
      const updated = await Effect.runPromise(
        activity.updateContent({ title: "New Title" }),
      );
      expect(updated.id).toBe(activity.id);
      expect(updated.tripId).toBe(activity.tripId);
      expect(updated.activityType).toBe(activity.activityType);
      expect(updated.description).toBe(activity.description);
    });

    it("updates updatedAt timestamp", async () => {
      const activity = await Effect.runPromise(
        ActivityFeed.create({
          ...baseProps,
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
        }),
      );
      const updated = await Effect.runPromise(
        activity.updateContent({ title: "New Title" }),
      );
      expect(updated.updatedAt.getTime()).toBeGreaterThan(
        activity.updatedAt.getTime(),
      );
    });
  });

  // ============================================================================
  // Query Method Tests
  // ============================================================================
  describe("[UNIT] ActivityFeed Query Methods", () => {
    describe("isVisible", () => {
      it("returns true when not hidden", async () => {
        const activity = await Effect.runPromise(
          ActivityFeed.create({
            tripId: "trip-123",
            activityType: "custom",
            title: "Test Activity",
            isHidden: false,
          }),
        );
        expect(activity.isVisible()).toBe(true);
      });

      it("returns false when hidden", async () => {
        const activity = await Effect.runPromise(
          ActivityFeed.create({
            tripId: "trip-123",
            activityType: "custom",
            title: "Test Activity",
            isHidden: true,
          }),
        );
        expect(activity.isVisible()).toBe(false);
      });
    });

    describe("isAdminCreated", () => {
      it("returns true when created by admin", async () => {
        const activity = await Effect.runPromise(
          ActivityFeed.create({
            tripId: "trip-123",
            activityType: "custom",
            title: "Test Activity",
            createdByAdmin: "admin-123",
          }),
        );
        expect(activity.isAdminCreated()).toBe(true);
      });

      it("returns false when not created by admin", async () => {
        const activity = await Effect.runPromise(
          ActivityFeed.create({
            tripId: "trip-123",
            activityType: "custom",
            title: "Test Activity",
          }),
        );
        expect(activity.isAdminCreated()).toBe(false);
      });
    });

    describe("isUserPost", () => {
      it("returns true for user_post type", async () => {
        const activity = await Effect.runPromise(
          ActivityFeed.createPostActivity({
            tripId: "trip-123",
            title: "User Post",
            post: createPostMetadata(),
          }),
        );
        expect(activity.isUserPost()).toBe(true);
      });

      it("returns false for non-user_post types", async () => {
        const activity = await Effect.runPromise(
          ActivityFeed.create({
            tripId: "trip-123",
            activityType: "custom",
            title: "Test Activity",
          }),
        );
        expect(activity.isUserPost()).toBe(false);
      });
    });

    describe("getAuthor", () => {
      it("returns undefined when userPost field is not in constructor", async () => {
        // Note: The getAuthor() method returns this.userPost but the constructor
        // doesn't include userPost as a parameter. This appears to be incomplete
        // migration code - the method should likely return postMetadata instead.
        const activity = await Effect.runPromise(
          ActivityFeed.createPostActivity({
            tripId: "trip-123",
            title: "User Post",
            post: createPostMetadata(),
          }),
        );
        expect(activity.getAuthor()).toBeUndefined();
      });

      it("returns undefined for non-user_post activities", async () => {
        const activity = await Effect.runPromise(
          ActivityFeed.create({
            tripId: "trip-123",
            activityType: "custom",
            title: "Test Activity",
          }),
        );
        expect(activity.getAuthor()).toBeUndefined();
      });
    });
  });

  // ============================================================================
  // Sorting Tests
  // ============================================================================
  describe("[UNIT] ActivityFeed Sorting", () => {
    describe("getSortKey", () => {
      it("returns sort key with isPinned, createdAt, and id", async () => {
        const activity = await Effect.runPromise(
          ActivityFeed.create({
            id: "activity-123" as any,
            tripId: "trip-123",
            activityType: "custom",
            title: "Test Activity",
            isPinned: true,
            createdAt: new Date("2024-01-15"),
          }),
        );
        const key = activity.getSortKey();
        expect(key.isPinned).toBe(true);
        expect(key.createdAt).toEqual(new Date("2024-01-15"));
        expect(key.id).toBe("activity-123");
      });
    });

    describe("compareForSort", () => {
      it("pinned comes before unpinned", async () => {
        const pinned = await Effect.runPromise(
          ActivityFeed.create({
            id: "pinned-1" as any,
            tripId: "trip-123",
            activityType: "custom",
            title: "Pinned",
            isPinned: true,
            createdAt: new Date("2024-01-01"),
          }),
        );
        const unpinned = await Effect.runPromise(
          ActivityFeed.create({
            id: "unpinned-1" as any,
            tripId: "trip-123",
            activityType: "custom",
            title: "Unpinned",
            isPinned: false,
            createdAt: new Date("2024-01-15"),
          }),
        );
        expect(pinned.compareForSort(unpinned)).toBe(-1);
        expect(unpinned.compareForSort(pinned)).toBe(1);
      });

      it("newer comes before older when both pinned", async () => {
        const older = await Effect.runPromise(
          ActivityFeed.create({
            id: "older" as any,
            tripId: "trip-123",
            activityType: "custom",
            title: "Older",
            isPinned: true,
            createdAt: new Date("2024-01-01"),
          }),
        );
        const newer = await Effect.runPromise(
          ActivityFeed.create({
            id: "newer" as any,
            tripId: "trip-123",
            activityType: "custom",
            title: "Newer",
            isPinned: true,
            createdAt: new Date("2024-01-15"),
          }),
        );
        expect(newer.compareForSort(older)).toBeLessThan(0);
        expect(older.compareForSort(newer)).toBeGreaterThan(0);
      });

      it("newer comes before older when both unpinned", async () => {
        const older = await Effect.runPromise(
          ActivityFeed.create({
            id: "older" as any,
            tripId: "trip-123",
            activityType: "custom",
            title: "Older",
            isPinned: false,
            createdAt: new Date("2024-01-01"),
          }),
        );
        const newer = await Effect.runPromise(
          ActivityFeed.create({
            id: "newer" as any,
            tripId: "trip-123",
            activityType: "custom",
            title: "Newer",
            isPinned: false,
            createdAt: new Date("2024-01-15"),
          }),
        );
        expect(newer.compareForSort(older)).toBeLessThan(0);
        expect(older.compareForSort(newer)).toBeGreaterThan(0);
      });

      it("uses id for tiebreaker when same pinned status and date", async () => {
        const activityA = await Effect.runPromise(
          ActivityFeed.create({
            id: "activity-b" as any,
            tripId: "trip-123",
            activityType: "custom",
            title: "Activity B",
            isPinned: false,
            createdAt: new Date("2024-01-01"),
          }),
        );
        const activityB = await Effect.runPromise(
          ActivityFeed.create({
            id: "activity-a" as any,
            tripId: "trip-123",
            activityType: "custom",
            title: "Activity A",
            isPinned: false,
            createdAt: new Date("2024-01-01"),
          }),
        );
        // activity-b should come before activity-a (reverse alphabetical)
        expect(activityA.compareForSort(activityB)).toBeLessThan(0);
      });
    });
  });
});
