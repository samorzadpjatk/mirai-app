import { describe, it, expect } from "bun:test";
import {
  validateGetByTripInput,
  validateGetByIdInput,
  validateCreateCustomInput,
  validateCreateUserPostInput,
  validateCreateSubmissionInput,
  validateCreateChallengeEventInput,
  validateCreateRankChangeInput,
  validateUpdateInput,
  validateSetPinnedInput,
  validateHideInput,
  validateUnhideInput,
  validateAddReactionInput,
  validateDeleteInput,
  type GetByTripInput,
  type GetByIdInput,
  type CreateCustomInput,
  type CreateUserPostInput,
  type CreateSubmissionInput,
  type CreateChallengeEventInput,
  type CreateRankChangeInput,
  type UpdateInput,
  type SetPinnedInput,
  type HideInput,
  type UnhideInput,
  type AddReactionInput,
  type DeleteInput,
} from "./schema";

describe("[UNIT] Activity Validators", () => {
  const validActivityId = "activity-123";
  const validTripId = "550e8400-e29b-41d4-a716-446655440001";
  const validUserId = "550e8400-e29b-41d4-a716-446655440002";
  const validGroupId = "550e8400-e29b-41d4-a716-446655440003";
  const validChallengeId = "550e8400-e29b-41d4-a716-446655440004";
  const validSubmissionId = "550e8400-e29b-41d4-a716-446655440005";

  describe("validateGetByTripInput", () => {
    it("should validate minimal valid input", () => {
      const input = { tripId: validTripId };
      const result = validateGetByTripInput(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tripId).toBe(validTripId);
      }
    });

    it("should validate with pageSize", () => {
      const input = {
        tripId: validTripId,
        pageSize: 20,
      };
      const result = validateGetByTripInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with cursor", () => {
      const input = {
        tripId: validTripId,
        cursor: {
          id: validActivityId,
          createdAt: "2024-01-15T10:00:00Z",
          isPinned: false,
        },
      };
      const result = validateGetByTripInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with all fields", () => {
      const input = {
        tripId: validTripId,
        pageSize: 50,
        cursor: {
          id: validActivityId,
          createdAt: "2024-01-15T10:00:00Z",
          isPinned: true,
        },
      };
      const result = validateGetByTripInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with pageSize = 1 (minimum)", () => {
      const input = {
        tripId: validTripId,
        pageSize: 1,
      };
      const result = validateGetByTripInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with pageSize = 100 (maximum)", () => {
      const input = {
        tripId: validTripId,
        pageSize: 100,
      };
      const result = validateGetByTripInput(input);
      expect(result.success).toBe(true);
    });

    it("should reject empty tripId", () => {
      const input = { tripId: "" };
      const result = validateGetByTripInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject pageSize = 0", () => {
      const input = {
        tripId: validTripId,
        pageSize: 0,
      };
      const result = validateGetByTripInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject pageSize > 100", () => {
      const input = {
        tripId: validTripId,
        pageSize: 101,
      };
      const result = validateGetByTripInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing tripId", () => {
      const input = {};
      const result = validateGetByTripInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validateGetByIdInput", () => {
    it("should validate valid activity ID", () => {
      const input = { id: validActivityId };
      const result = validateGetByIdInput(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(validActivityId);
      }
    });

    it("should reject empty activity ID", () => {
      const input = { id: "" };
      const result = validateGetByIdInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing id", () => {
      const input = {};
      const result = validateGetByIdInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validateCreateCustomInput", () => {
    it("should validate minimal valid input", () => {
      const input = {
        tripId: validTripId,
        title: "New Activity",
      };
      const result = validateCreateCustomInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with all optional fields", () => {
      const input = {
        tripId: validTripId,
        title: "Complete Activity",
        description: "Detailed description",
        imageUrl: "https://example.com/image.jpg",
        isPinned: true,
        createdByAdmin: validUserId,
      };
      const result = validateCreateCustomInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with description only", () => {
      const input = {
        tripId: validTripId,
        title: "Activity with Description",
        description: "This is a description",
      };
      const result = validateCreateCustomInput(input);
      expect(result.success).toBe(true);
    });

    it("should reject empty tripId", () => {
      const input = {
        tripId: "",
        title: "Activity",
      };
      const result = validateCreateCustomInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject empty title", () => {
      const input = {
        tripId: validTripId,
        title: "",
      };
      const result = validateCreateCustomInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing tripId", () => {
      const input = { title: "Activity" };
      const result = validateCreateCustomInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing title", () => {
      const input = { tripId: validTripId };
      const result = validateCreateCustomInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validateCreateUserPostInput", () => {
    it("should validate minimal valid input", () => {
      const input = {
        tripId: validTripId,
        title: "User Post",
        userPost: {
          authorId: validUserId,
          authorUserId: validUserId,
          authorFirstName: "John",
          authorLastName: "Doe",
          authorHasAvatar: true,
          groupId: null,
          groupName: null,
          additionalImages: [],
        },
      };
      const result = validateCreateUserPostInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with group info", () => {
      const input = {
        tripId: validTripId,
        title: "Group Post",
        userPost: {
          authorId: validUserId,
          authorUserId: validUserId,
          authorFirstName: "Jane",
          authorLastName: "Smith",
          authorHasAvatar: false,
          groupId: validGroupId,
          groupName: "Team A",
          additionalImages: ["image1.jpg", "image2.jpg"],
        },
      };
      const result = validateCreateUserPostInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with optional fields", () => {
      const input = {
        tripId: validTripId,
        title: "Complete Post",
        description: "Post description",
        imageUrl: "https://example.com/main.jpg",
        userPost: {
          authorId: validUserId,
          authorUserId: validUserId,
          authorFirstName: "Alice",
          authorLastName: "Wonder",
          authorHasAvatar: true,
          groupId: validGroupId,
          groupName: "Wonder Team",
          additionalImages: [],
        },
      };
      const result = validateCreateUserPostInput(input);
      expect(result.success).toBe(true);
    });

    it("should reject missing userPost fields", () => {
      const input = {
        tripId: validTripId,
        title: "Invalid Post",
        userPost: {
          authorId: validUserId,
          authorUserId: validUserId,
          authorFirstName: "John",
          authorLastName: "Doe",
          // Missing authorHasAvatar
          groupId: null,
          groupName: null,
          additionalImages: [],
        },
      };
      const result = validateCreateUserPostInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject empty tripId", () => {
      const input = {
        tripId: "",
        title: "Post",
        userPost: {
          authorId: validUserId,
          authorUserId: validUserId,
          authorFirstName: "John",
          authorLastName: "Doe",
          authorHasAvatar: true,
          groupId: null,
          groupName: null,
          additionalImages: [],
        },
      };
      const result = validateCreateUserPostInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject empty title", () => {
      const input = {
        tripId: validTripId,
        title: "",
        userPost: {
          authorId: validUserId,
          authorUserId: validUserId,
          authorFirstName: "John",
          authorLastName: "Doe",
          authorHasAvatar: true,
          groupId: null,
          groupName: null,
          additionalImages: [],
        },
      };
      const result = validateCreateUserPostInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validateCreateSubmissionInput", () => {
    it("should validate minimal valid input", () => {
      const input = {
        tripId: validTripId,
        title: "Submission Activity",
        submissionActivity: {
          submissionId: validSubmissionId,
          challengeId: validChallengeId,
          groupId: validGroupId,
        },
      };
      const result = validateCreateSubmissionInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with all submission fields", () => {
      const input = {
        tripId: validTripId,
        title: "Complete Submission",
        description: "Submission description",
        imageUrl: "https://example.com/submission.jpg",
        isPinned: false,
        createdByAdmin: validUserId,
        submissionActivity: {
          submissionId: validSubmissionId,
          challengeId: validChallengeId,
          groupId: validGroupId,
          hasVideo: true,
          isWinner: true,
          ranking: 1,
          pointsAwarded: 100,
        },
      };
      const result = validateCreateSubmissionInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with null optional fields", () => {
      const input = {
        tripId: validTripId,
        title: "Submission with Nulls",
        submissionActivity: {
          submissionId: validSubmissionId,
          challengeId: validChallengeId,
          groupId: validGroupId,
          hasVideo: false,
          isWinner: null,
          ranking: null,
          pointsAwarded: null,
        },
      };
      const result = validateCreateSubmissionInput(input);
      expect(result.success).toBe(true);
    });

    it("should reject missing required submission fields", () => {
      const input = {
        tripId: validTripId,
        title: "Invalid",
        submissionActivity: {
          submissionId: validSubmissionId,
          challengeId: validChallengeId,
          // Missing groupId
        },
      };
      const result = validateCreateSubmissionInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject empty tripId", () => {
      const input = {
        tripId: "",
        title: "Submission",
        submissionActivity: {
          submissionId: validSubmissionId,
          challengeId: validChallengeId,
          groupId: validGroupId,
        },
      };
      const result = validateCreateSubmissionInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validateCreateChallengeEventInput", () => {
    it("should validate minimal valid input", () => {
      const input = {
        tripId: validTripId,
        title: "Challenge Started",
        challengeActivity: {
          challengeId: validChallengeId,
          eventType: "challenge_started" as const,
        },
      };
      const result = validateCreateChallengeEventInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with voting_started event", () => {
      const input = {
        tripId: validTripId,
        title: "Voting Started",
        challengeActivity: {
          challengeId: validChallengeId,
          eventType: "voting_started" as const,
          endTime: "2024-12-31T23:59:59Z",
        },
      };
      const result = validateCreateChallengeEventInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with completed event", () => {
      const input = {
        tripId: validTripId,
        title: "Challenge Completed",
        challengeActivity: {
          challengeId: validChallengeId,
          eventType: "completed" as const,
          endTime: null,
          submissionType: "photo",
          basePoints: 50,
          submissionCount: 10,
        },
      };
      const result = validateCreateChallengeEventInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with all optional fields", () => {
      const input = {
        tripId: validTripId,
        title: "Complete Event",
        description: "Event description",
        imageUrl: "https://example.com/event.jpg",
        isPinned: true,
        createdByAdmin: validUserId,
        challengeActivity: {
          challengeId: validChallengeId,
          eventType: "challenge_started" as const,
          endTime: "2024-06-30T12:00:00Z",
          submissionType: "video",
          basePoints: 100,
          submissionCount: 5,
        },
      };
      const result = validateCreateChallengeEventInput(input);
      expect(result.success).toBe(true);
    });

    it("should reject invalid eventType", () => {
      const input = {
        tripId: validTripId,
        title: "Invalid Event",
        challengeActivity: {
          challengeId: validChallengeId,
          eventType: "invalid_type",
        },
      };
      const result = validateCreateChallengeEventInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing challengeId", () => {
      const input = {
        tripId: validTripId,
        title: "Invalid",
        challengeActivity: {
          eventType: "challenge_started" as const,
        },
      };
      const result = validateCreateChallengeEventInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validateCreateRankChangeInput", () => {
    it("should validate minimal valid input", () => {
      const input = {
        tripId: validTripId,
        title: "Rank Changed",
        rankChangeActivity: {
          groupId: validGroupId,
          newRank: 1,
          totalCoins: 1000,
          coinsGained: 50,
        },
      };
      const result = validateCreateRankChangeInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with rank change to lower position", () => {
      const input = {
        tripId: validTripId,
        title: "Dropped in Rank",
        description: "Group dropped in ranking",
        rankChangeActivity: {
          groupId: validGroupId,
          newRank: 5,
          totalCoins: 500,
          coinsGained: -25,
        },
      };
      const result = validateCreateRankChangeInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate rank = 1 (minimum)", () => {
      const input = {
        tripId: validTripId,
        title: "First Place",
        rankChangeActivity: {
          groupId: validGroupId,
          newRank: 1,
          totalCoins: 2000,
          coinsGained: 100,
        },
      };
      const result = validateCreateRankChangeInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate totalCoins = 0 (minimum)", () => {
      const input = {
        tripId: validTripId,
        title: "Starting Out",
        rankChangeActivity: {
          groupId: validGroupId,
          newRank: 10,
          totalCoins: 0,
          coinsGained: 10,
        },
      };
      const result = validateCreateRankChangeInput(input);
      expect(result.success).toBe(true);
    });

    it("should reject rank = 0", () => {
      const input = {
        tripId: validTripId,
        title: "Invalid Rank",
        rankChangeActivity: {
          groupId: validGroupId,
          newRank: 0,
          totalCoins: 100,
          coinsGained: 10,
        },
      };
      const result = validateCreateRankChangeInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject negative rank", () => {
      const input = {
        tripId: validTripId,
        title: "Invalid Rank",
        rankChangeActivity: {
          groupId: validGroupId,
          newRank: -1,
          totalCoins: 100,
          coinsGained: 10,
        },
      };
      const result = validateCreateRankChangeInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject negative totalCoins", () => {
      const input = {
        tripId: validTripId,
        title: "Invalid Coins",
        rankChangeActivity: {
          groupId: validGroupId,
          newRank: 1,
          totalCoins: -10,
          coinsGained: 10,
        },
      };
      const result = validateCreateRankChangeInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject non-integer rank", () => {
      const input = {
        tripId: validTripId,
        title: "Invalid Rank",
        rankChangeActivity: {
          groupId: validGroupId,
          newRank: 1.5,
          totalCoins: 100,
          coinsGained: 10,
        },
      };
      const result = validateCreateRankChangeInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject non-integer totalCoins", () => {
      const input = {
        tripId: validTripId,
        title: "Invalid Coins",
        rankChangeActivity: {
          groupId: validGroupId,
          newRank: 1,
          totalCoins: 100.5,
          coinsGained: 10,
        },
      };
      const result = validateCreateRankChangeInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validateUpdateInput", () => {
    it("should validate with activityId only", () => {
      const input = { activityId: validActivityId };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with title update", () => {
      const input = {
        activityId: validActivityId,
        title: "Updated Title",
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with description update", () => {
      const input = {
        activityId: validActivityId,
        description: "Updated description",
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with null description", () => {
      const input = {
        activityId: validActivityId,
        description: null,
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with isPinned update", () => {
      const input = {
        activityId: validActivityId,
        isPinned: true,
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with all fields updated", () => {
      const input = {
        activityId: validActivityId,
        title: "New Title",
        description: "New description",
        isPinned: false,
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(true);
    });

    it("should reject empty title in update", () => {
      const input = {
        activityId: validActivityId,
        title: "",
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject title exceeding 200 characters", () => {
      const input = {
        activityId: validActivityId,
        title: "A".repeat(201),
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject description exceeding 2000 characters", () => {
      const input = {
        activityId: validActivityId,
        description: "A".repeat(2001),
      };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing activityId", () => {
      const input = { title: "Updated" };
      const result = validateUpdateInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validateSetPinnedInput", () => {
    it("should validate pinning an activity", () => {
      const input = {
        activityId: validActivityId,
        isPinned: true,
      };
      const result = validateSetPinnedInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate unpinning an activity", () => {
      const input = {
        activityId: validActivityId,
        isPinned: false,
      };
      const result = validateSetPinnedInput(input);
      expect(result.success).toBe(true);
    });

    it("should reject empty activityId", () => {
      const input = {
        activityId: "",
        isPinned: true,
      };
      const result = validateSetPinnedInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject non-boolean isPinned", () => {
      const input = {
        activityId: validActivityId,
        isPinned: "true",
      };
      const result = validateSetPinnedInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing activityId", () => {
      const input = { isPinned: true };
      const result = validateSetPinnedInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing isPinned", () => {
      const input = { activityId: validActivityId };
      const result = validateSetPinnedInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validateHideInput", () => {
    it("should validate hiding an activity", () => {
      const input = {
        activityId: validActivityId,
        hiddenByAdmin: validUserId,
      };
      const result = validateHideInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with reason", () => {
      const input = {
        activityId: validActivityId,
        hiddenByAdmin: validUserId,
        reason: "Inappropriate content",
      };
      const result = validateHideInput(input);
      expect(result.success).toBe(true);
    });

    it("should reject empty activityId", () => {
      const input = {
        activityId: "",
        hiddenByAdmin: validUserId,
      };
      const result = validateHideInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject empty hiddenByAdmin", () => {
      const input = {
        activityId: validActivityId,
        hiddenByAdmin: "",
      };
      const result = validateHideInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing activityId", () => {
      const input = { hiddenByAdmin: validUserId };
      const result = validateHideInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing hiddenByAdmin", () => {
      const input = { activityId: validActivityId };
      const result = validateHideInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validateUnhideInput", () => {
    it("should validate unhiding an activity", () => {
      const input = { activityId: validActivityId };
      const result = validateUnhideInput(input);
      expect(result.success).toBe(true);
    });

    it("should reject empty activityId", () => {
      const input = { activityId: "" };
      const result = validateUnhideInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing activityId", () => {
      const input = {};
      const result = validateUnhideInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validateAddReactionInput", () => {
    it("should validate heart reaction", () => {
      const input = {
        activityId: validActivityId,
        userId: validUserId,
        reactionType: "heart" as const,
      };
      const result = validateAddReactionInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate fire reaction", () => {
      const input = {
        activityId: validActivityId,
        userId: validUserId,
        reactionType: "fire" as const,
      };
      const result = validateAddReactionInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate clap reaction", () => {
      const input = {
        activityId: validActivityId,
        userId: validUserId,
        reactionType: "clap" as const,
      };
      const result = validateAddReactionInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate star reaction", () => {
      const input = {
        activityId: validActivityId,
        userId: validUserId,
        reactionType: "star" as const,
      };
      const result = validateAddReactionInput(input);
      expect(result.success).toBe(true);
    });

    it("should reject invalid reaction type", () => {
      const input = {
        activityId: validActivityId,
        userId: validUserId,
        reactionType: "thumbs_up" as const,
      };
      const result = validateAddReactionInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject empty activityId", () => {
      const input = {
        activityId: "",
        userId: validUserId,
        reactionType: "heart" as const,
      };
      const result = validateAddReactionInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject empty userId", () => {
      const input = {
        activityId: validActivityId,
        userId: "",
        reactionType: "heart" as const,
      };
      const result = validateAddReactionInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing activityId", () => {
      const input = {
        userId: validUserId,
        reactionType: "heart" as const,
      };
      const result = validateAddReactionInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing userId", () => {
      const input = {
        activityId: validActivityId,
        reactionType: "heart" as const,
      };
      const result = validateAddReactionInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing reactionType", () => {
      const input = {
        activityId: validActivityId,
        userId: validUserId,
      };
      const result = validateAddReactionInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validateDeleteInput", () => {
    it("should validate deleting an activity", () => {
      const input = { activityId: validActivityId };
      const result = validateDeleteInput(input);
      expect(result.success).toBe(true);
    });

    it("should reject empty activityId", () => {
      const input = { activityId: "" };
      const result = validateDeleteInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing activityId", () => {
      const input = {};
      const result = validateDeleteInput(input);
      expect(result.success).toBe(false);
    });
  });
});

/*
 * Summary
 *
 * Tests cover:
 * - validateGetByTripInput: tripId (string) + optional pageSize (1-100) + optional cursor
 * - validateGetByIdInput: activity ID (string, non-empty)
 * - validateCreateCustomInput: tripId (string) + title (string, non-empty) + optional fields
 * - validateCreateUserPostInput: tripId + title + userPost (complex object with author/group info)
 * - validateCreateSubmissionInput: tripId + title + submissionActivity (submission details)
 * - validateCreateChallengeEventInput: tripId + title + challengeActivity (event details with eventType enum)
 * - validateCreateRankChangeInput: tripId + title + rankChangeActivity (rank, coins with int validation)
 * - validateUpdateInput: activityId + optional title (1-200 chars), description (null or max 2000), isPinned
 * - validateSetPinnedInput: activityId + isPinned (boolean)
 * - validateHideInput: activityId + hiddenByAdmin (string) + optional reason
 * - validateUnhideInput: activityId (string, non-empty)
 * - validateAddReactionInput: activityId + userId + reactionType (heart/fire/clap/star enum)
 * - validateDeleteInput: activityId (string, non-empty)
 *
 * All validators tested with:
 * - Valid inputs (success cases)
 * - Invalid formats (error cases)
 * - Edge cases (boundary values, empty strings)
 * - Enum validation (eventType, reactionType)
 * - Integer validation for rank and coins
 * - Complex nested object validation
 * - Missing required vs optional fields
 */
