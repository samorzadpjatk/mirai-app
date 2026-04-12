import { describe, it, expect } from "bun:test";
import { Effect } from "effect";
import {
  ChallengeSubmission,
  SUBMISSION_STATUSES,
} from "./ChallengeSubmission";
import { SubmissionId } from "../value-objects/SubmissionId";
import { ValidationError, StateTransitionError } from "../errors/effect-errors";

describe("[UNIT] ChallengeSubmission", () => {
  describe("create", () => {
    it("should create a submission with minimum required fields", async () => {
      const submission = await Effect.runPromise(
        ChallengeSubmission.create({
          challengeId: "challenge-123",
          groupId: "group-456",
        }),
      );

      expect(submission.challengeId).toBe("challenge-123");
      expect(submission.groupId).toBe("group-456");
      expect(submission.status).toBe("PENDING");
      expect(submission.imageIds).toEqual([]);
      expect(submission.awardedPoints).toBe(0);
      expect(submission.bonusPoints).toBe(0);
      expect(submission.voteCount).toBe(0);
      expect(submission.voteScore).toBe(0);
    });

    it("should create a submission with all fields", async () => {
      const submission = await Effect.runPromise(
        ChallengeSubmission.create({
          challengeId: "challenge-123",
          groupId: "group-456",
          imageIds: ["img1", "img2"],
          videoId: "video-123",
          textContent: "Test submission",
          latitude: 52.2297,
          longitude: 21.0122,
          status: "APPROVED",
          reviewedById: "user-789",
          reviewedAt: new Date("2024-01-01"),
          rejectionReason: null,
          awardedPoints: 100,
          bonusPoints: 10,
          ranking: 1,
          voteCount: 5,
          voteScore: 25.5,
        }),
      );

      expect(submission.imageIds).toEqual(["img1", "img2"]);
      expect(submission.videoId).toBe("video-123");
      expect(submission.textContent).toBe("Test submission");
      expect(submission.latitude).toBe(52.2297);
      expect(submission.longitude).toBe(21.0122);
      expect(submission.status).toBe("APPROVED");
      expect(submission.reviewedById).toBe("user-789");
      expect(submission.awardedPoints).toBe(100);
      expect(submission.bonusPoints).toBe(10);
      expect(submission.ranking).toBe(1);
      expect(submission.voteCount).toBe(5);
      expect(submission.voteScore).toBe(25.5);
    });

    it("should generate an id if not provided", async () => {
      const submission = await Effect.runPromise(
        ChallengeSubmission.create({
          challengeId: "challenge-123",
          groupId: "group-456",
        }),
      );

      expect(submission.id).toBeDefined();
      expect(typeof submission.id).toBe("string");
    });

    it("should use provided id", async () => {
      const id = SubmissionId.generate();
      const submission = await Effect.runPromise(
        ChallengeSubmission.create({
          id,
          challengeId: "challenge-123",
          groupId: "group-456",
        }),
      );

      expect(submission.id).toBe(id);
    });

    it("should error if challengeId is empty", async () => {
      const error = await Effect.runPromise(
        Effect.flip(
          ChallengeSubmission.create({
            challengeId: "",
            groupId: "group-456",
          }),
        ),
      );

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.field).toBe("challengeId");
    });

    it("should error if groupId is empty", async () => {
      const error = await Effect.runPromise(
        Effect.flip(
          ChallengeSubmission.create({
            challengeId: "challenge-123",
            groupId: "",
          }),
        ),
      );

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.field).toBe("groupId");
    });

    it("should error if too many images", async () => {
      const error = await Effect.runPromise(
        Effect.flip(
          ChallengeSubmission.create({
            challengeId: "challenge-123",
            groupId: "group-456",
            imageIds: Array(11).fill("img"),
          }),
        ),
      );

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.field).toBe("imageIds");
    });

    it("should error if textContent is too long", async () => {
      const error = await Effect.runPromise(
        Effect.flip(
          ChallengeSubmission.create({
            challengeId: "challenge-123",
            groupId: "group-456",
            textContent: "a".repeat(10001),
          }),
        ),
      );

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.field).toBe("textContent");
    });

    it("should error if latitude is out of range", async () => {
      const error = await Effect.runPromise(
        Effect.flip(
          ChallengeSubmission.create({
            challengeId: "challenge-123",
            groupId: "group-456",
            latitude: 91,
          }),
        ),
      );

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.field).toBe("latitude");
    });

    it("should error if longitude is out of range", async () => {
      const error = await Effect.runPromise(
        Effect.flip(
          ChallengeSubmission.create({
            challengeId: "challenge-123",
            groupId: "group-456",
            longitude: -181,
          }),
        ),
      );

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.field).toBe("longitude");
    });

    it("should error if awardedPoints is negative", async () => {
      const error = await Effect.runPromise(
        Effect.flip(
          ChallengeSubmission.create({
            challengeId: "challenge-123",
            groupId: "group-456",
            awardedPoints: -1,
          }),
        ),
      );

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.field).toBe("awardedPoints");
    });

    it("should error if bonusPoints is negative", async () => {
      const error = await Effect.runPromise(
        Effect.flip(
          ChallengeSubmission.create({
            challengeId: "challenge-123",
            groupId: "group-456",
            bonusPoints: -5,
          }),
        ),
      );

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.field).toBe("bonusPoints");
    });

    it("should error if ranking is less than 1", async () => {
      const error = await Effect.runPromise(
        Effect.flip(
          ChallengeSubmission.create({
            challengeId: "challenge-123",
            groupId: "group-456",
            ranking: 0,
          }),
        ),
      );

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.field).toBe("ranking");
    });

    it("should error if ranking is greater than 3", async () => {
      const error = await Effect.runPromise(
        Effect.flip(
          ChallengeSubmission.create({
            challengeId: "challenge-123",
            groupId: "group-456",
            ranking: 4,
          }),
        ),
      );

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.field).toBe("ranking");
    });
  });

  describe("updateContent", () => {
    it("should update content when pending", async () => {
      const submission = await Effect.runPromise(
        ChallengeSubmission.create({
          challengeId: "challenge-123",
          groupId: "group-456",
          textContent: "Original",
        }),
      );

      const updated = await Effect.runPromise(
        submission.updateContent({
          textContent: "Updated",
          imageIds: ["new-img"],
        }),
      );

      expect(updated.textContent).toBe("Updated");
      expect(updated.imageIds).toEqual(["new-img"]);
      expect(updated.reviewedById).toBeNull();
      expect(updated.rejectionReason).toBeNull();
    });

    it("should error when trying to update approved submission", async () => {
      const submission = await Effect.runPromise(
        ChallengeSubmission.create({
          challengeId: "challenge-123",
          groupId: "group-456",
          status: "APPROVED",
        }),
      );

      const error = await Effect.runPromise(
        Effect.flip(
          submission.updateContent({
            textContent: "Updated",
          }),
        ),
      );

      expect(error).toBeInstanceOf(StateTransitionError);
    });

    it("should error when trying to update rejected submission", async () => {
      const submission = await Effect.runPromise(
        ChallengeSubmission.create({
          challengeId: "challenge-123",
          groupId: "group-456",
          status: "REJECTED",
        }),
      );

      const error = await Effect.runPromise(
        Effect.flip(
          submission.updateContent({
            textContent: "Updated",
          }),
        ),
      );

      expect(error).toBeInstanceOf(StateTransitionError);
    });
  });

  describe("approve", () => {
    it("should approve a pending submission", async () => {
      const submission = await Effect.runPromise(
        ChallengeSubmission.create({
          challengeId: "challenge-123",
          groupId: "group-456",
        }),
      );

      const approved = await Effect.runPromise(
        submission.approve({
          reviewedById: "admin-123",
          awardedPoints: 100,
          bonusPoints: 10,
          ranking: 1,
        }),
      );

      expect(approved.status).toBe("APPROVED");
      expect(approved.reviewedById).toBe("admin-123");
      expect(approved.reviewedAt).toBeInstanceOf(Date);
      expect(approved.rejectionReason).toBeNull();
      expect(approved.awardedPoints).toBe(100);
      expect(approved.bonusPoints).toBe(10);
      expect(approved.ranking).toBe(1);
    });

    it("should use existing points if not provided", async () => {
      const submission = await Effect.runPromise(
        ChallengeSubmission.create({
          challengeId: "challenge-123",
          groupId: "group-456",
          awardedPoints: 50,
          bonusPoints: 5,
          ranking: 2,
        }),
      );

      const approved = await Effect.runPromise(
        submission.approve({
          reviewedById: "admin-123",
        }),
      );

      expect(approved.awardedPoints).toBe(50);
      expect(approved.bonusPoints).toBe(5);
      expect(approved.ranking).toBe(2);
    });

    it("should error when trying to approve already approved submission", async () => {
      const submission = await Effect.runPromise(
        ChallengeSubmission.create({
          challengeId: "challenge-123",
          groupId: "group-456",
          status: "APPROVED",
        }),
      );

      const error = await Effect.runPromise(
        Effect.flip(
          submission.approve({
            reviewedById: "admin-123",
          }),
        ),
      );

      expect(error).toBeInstanceOf(StateTransitionError);
    });

    it("should error when trying to approve rejected submission", async () => {
      const submission = await Effect.runPromise(
        ChallengeSubmission.create({
          challengeId: "challenge-123",
          groupId: "group-456",
          status: "REJECTED",
        }),
      );

      const error = await Effect.runPromise(
        Effect.flip(
          submission.approve({
            reviewedById: "admin-123",
          }),
        ),
      );

      expect(error).toBeInstanceOf(StateTransitionError);
    });

    it("should error if awardedPoints is negative", async () => {
      const submission = await Effect.runPromise(
        ChallengeSubmission.create({
          challengeId: "challenge-123",
          groupId: "group-456",
        }),
      );

      const error = await Effect.runPromise(
        Effect.flip(
          submission.approve({
            reviewedById: "admin-123",
            awardedPoints: -10,
          }),
        ),
      );

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.field).toBe("awardedPoints");
    });
  });

  describe("reject", () => {
    it("should reject a pending submission", async () => {
      const submission = await Effect.runPromise(
        ChallengeSubmission.create({
          challengeId: "challenge-123",
          groupId: "group-456",
        }),
      );

      const rejected = await Effect.runPromise(
        submission.reject({
          reviewedById: "admin-123",
          reason: "Does not meet requirements",
        }),
      );

      expect(rejected.status).toBe("REJECTED");
      expect(rejected.reviewedById).toBe("admin-123");
      expect(rejected.reviewedAt).toBeInstanceOf(Date);
      expect(rejected.rejectionReason).toBe("Does not meet requirements");
      expect(rejected.awardedPoints).toBe(0);
      expect(rejected.bonusPoints).toBe(0);
      expect(rejected.ranking).toBeNull();
    });

    it("should error when trying to reject already rejected submission", async () => {
      const submission = await Effect.runPromise(
        ChallengeSubmission.create({
          challengeId: "challenge-123",
          groupId: "group-456",
          status: "REJECTED",
        }),
      );

      const error = await Effect.runPromise(
        Effect.flip(
          submission.reject({
            reviewedById: "admin-123",
            reason: "Already rejected",
          }),
        ),
      );

      expect(error).toBeInstanceOf(StateTransitionError);
    });

    it("should error when trying to reject approved submission", async () => {
      const submission = await Effect.runPromise(
        ChallengeSubmission.create({
          challengeId: "challenge-123",
          groupId: "group-456",
          status: "APPROVED",
        }),
      );

      const error = await Effect.runPromise(
        Effect.flip(
          submission.reject({
            reviewedById: "admin-123",
            reason: "Cannot reject approved",
          }),
        ),
      );

      expect(error).toBeInstanceOf(StateTransitionError);
    });

    it("should error if reason is empty", async () => {
      const submission = await Effect.runPromise(
        ChallengeSubmission.create({
          challengeId: "challenge-123",
          groupId: "group-456",
        }),
      );

      const error = await Effect.runPromise(
        Effect.flip(
          submission.reject({
            reviewedById: "admin-123",
            reason: "",
          }),
        ),
      );

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.field).toBe("reason");
    });
  });

  describe("autoApprove", () => {
    it("should auto-approve with awarded points", async () => {
      const submission = await Effect.runPromise(
        ChallengeSubmission.create({
          challengeId: "challenge-123",
          groupId: "group-456",
        }),
      );

      const approved = await Effect.runPromise(
        submission.autoApprove({
          awardedPoints: 50,
        }),
      );

      expect(approved.status).toBe("APPROVED");
      expect(approved.awardedPoints).toBe(50);
      expect(approved.bonusPoints).toBe(0);
      expect(approved.ranking).toBeNull();
      expect(approved.reviewedById).toBeNull();
    });

    it("should error if awardedPoints is negative", async () => {
      const submission = await Effect.runPromise(
        ChallengeSubmission.create({
          challengeId: "challenge-123",
          groupId: "group-456",
        }),
      );

      const error = await Effect.runPromise(
        Effect.flip(
          submission.autoApprove({
            awardedPoints: -10,
          }),
        ),
      );

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.field).toBe("awardedPoints");
    });
  });

  describe("updateVoteStats", () => {
    it("should update vote statistics", async () => {
      const submission = await Effect.runPromise(
        ChallengeSubmission.create({
          challengeId: "challenge-123",
          groupId: "group-456",
        }),
      );

      const updated = submission.updateVoteStats({
        voteCount: 10,
        voteScore: 100.5,
      });

      expect(updated.voteCount).toBe(10);
      expect(updated.voteScore).toBe(100.5);
    });
  });

  describe("status checks", () => {
    it("should correctly check pending status", async () => {
      const pending = await Effect.runPromise(
        ChallengeSubmission.create({
          challengeId: "challenge-123",
          groupId: "group-456",
          status: "PENDING",
        }),
      );

      expect(pending.isPending()).toBe(true);
      expect(pending.isApproved()).toBe(false);
      expect(pending.isRejected()).toBe(false);
    });

    it("should correctly check approved status", async () => {
      const approved = await Effect.runPromise(
        ChallengeSubmission.create({
          challengeId: "challenge-123",
          groupId: "group-456",
          status: "APPROVED",
        }),
      );

      expect(approved.isPending()).toBe(false);
      expect(approved.isApproved()).toBe(true);
      expect(approved.isRejected()).toBe(false);
    });

    it("should correctly check rejected status", async () => {
      const rejected = await Effect.runPromise(
        ChallengeSubmission.create({
          challengeId: "challenge-123",
          groupId: "group-456",
          status: "REJECTED",
        }),
      );

      expect(rejected.isPending()).toBe(false);
      expect(rejected.isApproved()).toBe(false);
      expect(rejected.isRejected()).toBe(true);
    });

    it("should correctly check if editable", async () => {
      const pending = await Effect.runPromise(
        ChallengeSubmission.create({
          challengeId: "challenge-123",
          groupId: "group-456",
          status: "PENDING",
        }),
      );

      expect(pending.canEdit()).toBe(true);

      const approved = await Effect.runPromise(
        ChallengeSubmission.create({
          challengeId: "challenge-123",
          groupId: "group-456",
          status: "APPROVED",
        }),
      );

      expect(approved.canEdit()).toBe(false);
    });

    it("should correctly check if deletable", async () => {
      const pending = await Effect.runPromise(
        ChallengeSubmission.create({
          challengeId: "challenge-123",
          groupId: "group-456",
          status: "PENDING",
        }),
      );

      expect(pending.canDelete()).toBe(true);

      const approved = await Effect.runPromise(
        ChallengeSubmission.create({
          challengeId: "challenge-123",
          groupId: "group-456",
          status: "APPROVED",
        }),
      );

      expect(approved.canDelete()).toBe(false);
    });
  });

  describe("utility methods", () => {
    it("should correctly check if has media", async () => {
      const withImages = await Effect.runPromise(
        ChallengeSubmission.create({
          challengeId: "challenge-123",
          groupId: "group-456",
          imageIds: ["img1"],
        }),
      );

      expect(withImages.hasMedia()).toBe(true);

      const withVideo = await Effect.runPromise(
        ChallengeSubmission.create({
          challengeId: "challenge-123",
          groupId: "group-456",
          videoId: "video-123",
        }),
      );

      expect(withVideo.hasMedia()).toBe(true);

      const withoutMedia = await Effect.runPromise(
        ChallengeSubmission.create({
          challengeId: "challenge-123",
          groupId: "group-456",
        }),
      );

      expect(withoutMedia.hasMedia()).toBe(false);
    });

    it("should correctly check if has location", async () => {
      const withLocation = await Effect.runPromise(
        ChallengeSubmission.create({
          challengeId: "challenge-123",
          groupId: "group-456",
          latitude: 52.2297,
          longitude: 21.0122,
        }),
      );

      expect(withLocation.hasLocation()).toBe(true);

      const withoutLocation = await Effect.runPromise(
        ChallengeSubmission.create({
          challengeId: "challenge-123",
          groupId: "group-456",
        }),
      );

      expect(withoutLocation.hasLocation()).toBe(false);
    });

    it("should calculate total points correctly", async () => {
      const submission = await Effect.runPromise(
        ChallengeSubmission.create({
          challengeId: "challenge-123",
          groupId: "group-456",
          awardedPoints: 100,
          bonusPoints: 25,
        }),
      );

      expect(submission.getTotalPoints()).toBe(125);
    });

    it("should correctly check if reviewed", async () => {
      const reviewed = await Effect.runPromise(
        ChallengeSubmission.create({
          challengeId: "challenge-123",
          groupId: "group-456",
          reviewedAt: new Date(),
        }),
      );

      expect(reviewed.isReviewed()).toBe(true);

      const notReviewed = await Effect.runPromise(
        ChallengeSubmission.create({
          challengeId: "challenge-123",
          groupId: "group-456",
        }),
      );

      expect(notReviewed.isReviewed()).toBe(false);
    });
  });

  describe("comparison methods", () => {
    it("should compare submissions for sorting by voteScore", async () => {
      const submission1 = await Effect.runPromise(
        ChallengeSubmission.create({
          challengeId: "challenge-123",
          groupId: "group-456",
          voteScore: 100,
        }),
      );

      const submission2 = await Effect.runPromise(
        ChallengeSubmission.create({
          challengeId: "challenge-123",
          groupId: "group-789",
          voteScore: 50,
        }),
      );

      // Higher score comes first (negative result means submission1 comes before submission2)
      expect(submission1.compareForSort(submission2)).toBeLessThan(0);
      expect(submission2.compareForSort(submission1)).toBeGreaterThan(0);
    });
  });
});
