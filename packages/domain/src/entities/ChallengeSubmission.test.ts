import { describe, it, expect } from "bun:test";
import {
  ChallengeSubmission,
  SUBMISSION_STATUSES,
} from "./ChallengeSubmission";
import { SubmissionId } from "../value-objects/SubmissionId";
import { ValidationError, StateTransitionError } from "../errors/domain-errors";

describe("[UNIT] ChallengeSubmission", () => {
  describe("create", () => {
    it("should create a submission with minimum required fields", () => {
      const result = ChallengeSubmission.create({
        challengeId: "challenge-123",
        groupId: "group-456",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.challengeId).toBe("challenge-123");
        expect(result.value.groupId).toBe("group-456");
        expect(result.value.status).toBe("PENDING");
        expect(result.value.imageIds).toEqual([]);
        expect(result.value.awardedPoints).toBe(0);
        expect(result.value.bonusPoints).toBe(0);
        expect(result.value.voteCount).toBe(0);
        expect(result.value.voteScore).toBe(0);
      }
    });

    it("should create a submission with all fields", () => {
      const result = ChallengeSubmission.create({
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
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.imageIds).toEqual(["img1", "img2"]);
        expect(result.value.videoId).toBe("video-123");
        expect(result.value.textContent).toBe("Test submission");
        expect(result.value.latitude).toBe(52.2297);
        expect(result.value.longitude).toBe(21.0122);
        expect(result.value.status).toBe("APPROVED");
        expect(result.value.reviewedById).toBe("user-789");
        expect(result.value.awardedPoints).toBe(100);
        expect(result.value.bonusPoints).toBe(10);
        expect(result.value.ranking).toBe(1);
        expect(result.value.voteCount).toBe(5);
        expect(result.value.voteScore).toBe(25.5);
      }
    });

    it("should generate an id if not provided", () => {
      const result = ChallengeSubmission.create({
        challengeId: "challenge-123",
        groupId: "group-456",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.id).toBeDefined();
        expect(typeof result.value.id).toBe("string");
      }
    });

    it("should use provided id", () => {
      const id = SubmissionId.generate();
      const result = ChallengeSubmission.create({
        id,
        challengeId: "challenge-123",
        groupId: "group-456",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.id).toBe(id);
      }
    });

    it("should error if challengeId is empty", () => {
      const result = ChallengeSubmission.create({
        challengeId: "",
        groupId: "group-456",
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.field).toBe("challengeId");
      }
    });

    it("should error if groupId is empty", () => {
      const result = ChallengeSubmission.create({
        challengeId: "challenge-123",
        groupId: "",
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.field).toBe("groupId");
      }
    });

    it("should error if too many images", () => {
      const result = ChallengeSubmission.create({
        challengeId: "challenge-123",
        groupId: "group-456",
        imageIds: Array(11).fill("img"),
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.field).toBe("imageIds");
      }
    });

    it("should error if textContent is too long", () => {
      const result = ChallengeSubmission.create({
        challengeId: "challenge-123",
        groupId: "group-456",
        textContent: "a".repeat(10001),
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.field).toBe("textContent");
      }
    });

    it("should error if latitude is out of range", () => {
      const result = ChallengeSubmission.create({
        challengeId: "challenge-123",
        groupId: "group-456",
        latitude: 91,
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.field).toBe("latitude");
      }
    });

    it("should error if longitude is out of range", () => {
      const result = ChallengeSubmission.create({
        challengeId: "challenge-123",
        groupId: "group-456",
        longitude: -181,
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.field).toBe("longitude");
      }
    });

    it("should error if awardedPoints is negative", () => {
      const result = ChallengeSubmission.create({
        challengeId: "challenge-123",
        groupId: "group-456",
        awardedPoints: -1,
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.field).toBe("awardedPoints");
      }
    });

    it("should error if bonusPoints is negative", () => {
      const result = ChallengeSubmission.create({
        challengeId: "challenge-123",
        groupId: "group-456",
        bonusPoints: -5,
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.field).toBe("bonusPoints");
      }
    });

    it("should error if ranking is less than 1", () => {
      const result = ChallengeSubmission.create({
        challengeId: "challenge-123",
        groupId: "group-456",
        ranking: 0,
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.field).toBe("ranking");
      }
    });

    it("should error if ranking is greater than 3", () => {
      const result = ChallengeSubmission.create({
        challengeId: "challenge-123",
        groupId: "group-456",
        ranking: 4,
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.field).toBe("ranking");
      }
    });
  });

  describe("updateContent", () => {
    it("should update content when pending", () => {
      const submission = ChallengeSubmission.create({
        challengeId: "challenge-123",
        groupId: "group-456",
        textContent: "Original",
      }).value as ChallengeSubmission;

      const result = submission.updateContent({
        textContent: "Updated",
        imageIds: ["new-img"],
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.textContent).toBe("Updated");
        expect(result.value.imageIds).toEqual(["new-img"]);
        expect(result.value.reviewedById).toBeNull();
        expect(result.value.rejectionReason).toBeNull();
      }
    });

    it("should error when trying to update approved submission", () => {
      const submission = ChallengeSubmission.create({
        challengeId: "challenge-123",
        groupId: "group-456",
        status: "APPROVED",
      }).value as ChallengeSubmission;

      const result = submission.updateContent({
        textContent: "Updated",
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBeInstanceOf(StateTransitionError);
      }
    });

    it("should error when trying to update rejected submission", () => {
      const submission = ChallengeSubmission.create({
        challengeId: "challenge-123",
        groupId: "group-456",
        status: "REJECTED",
      }).value as ChallengeSubmission;

      const result = submission.updateContent({
        textContent: "Updated",
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBeInstanceOf(StateTransitionError);
      }
    });
  });

  describe("approve", () => {
    it("should approve a pending submission", () => {
      const submission = ChallengeSubmission.create({
        challengeId: "challenge-123",
        groupId: "group-456",
      }).value as ChallengeSubmission;

      const result = submission.approve({
        reviewedById: "admin-123",
        awardedPoints: 100,
        bonusPoints: 10,
        ranking: 1,
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.status).toBe("APPROVED");
        expect(result.value.reviewedById).toBe("admin-123");
        expect(result.value.reviewedAt).toBeInstanceOf(Date);
        expect(result.value.rejectionReason).toBeNull();
        expect(result.value.awardedPoints).toBe(100);
        expect(result.value.bonusPoints).toBe(10);
        expect(result.value.ranking).toBe(1);
      }
    });

    it("should use existing points if not provided", () => {
      const submission = ChallengeSubmission.create({
        challengeId: "challenge-123",
        groupId: "group-456",
        awardedPoints: 50,
        bonusPoints: 5,
        ranking: 2,
      }).value as ChallengeSubmission;

      const result = submission.approve({
        reviewedById: "admin-123",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.awardedPoints).toBe(50);
        expect(result.value.bonusPoints).toBe(5);
        expect(result.value.ranking).toBe(2);
      }
    });

    it("should error when trying to approve a rejected submission", () => {
      const submission = ChallengeSubmission.create({
        challengeId: "challenge-123",
        groupId: "group-456",
        status: "REJECTED",
      }).value as ChallengeSubmission;

      const result = submission.approve({
        reviewedById: "admin-123",
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBeInstanceOf(StateTransitionError);
      }
    });

    it("should error if awardedPoints is negative", () => {
      const submission = ChallengeSubmission.create({
        challengeId: "challenge-123",
        groupId: "group-456",
      }).value as ChallengeSubmission;

      const result = submission.approve({
        reviewedById: "admin-123",
        awardedPoints: -10,
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.field).toBe("awardedPoints");
      }
    });

    it("should error if bonusPoints is negative", () => {
      const submission = ChallengeSubmission.create({
        challengeId: "challenge-123",
        groupId: "group-456",
      }).value as ChallengeSubmission;

      const result = submission.approve({
        reviewedById: "admin-123",
        bonusPoints: -5,
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.field).toBe("bonusPoints");
      }
    });

    it("should error if ranking is out of range", () => {
      const submission = ChallengeSubmission.create({
        challengeId: "challenge-123",
        groupId: "group-456",
      }).value as ChallengeSubmission;

      const result = submission.approve({
        reviewedById: "admin-123",
        ranking: 4,
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.field).toBe("ranking");
      }
    });
  });

  describe("reject", () => {
    it("should reject a pending submission", () => {
      const submission = ChallengeSubmission.create({
        challengeId: "challenge-123",
        groupId: "group-456",
        awardedPoints: 100,
        bonusPoints: 10,
        ranking: 1,
      }).value as ChallengeSubmission;

      const result = submission.reject({
        reviewedById: "admin-123",
        reason: "Inappropriate content",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.status).toBe("REJECTED");
        expect(result.value.reviewedById).toBe("admin-123");
        expect(result.value.rejectionReason).toBe("Inappropriate content");
        expect(result.value.awardedPoints).toBe(0);
        expect(result.value.bonusPoints).toBe(0);
        expect(result.value.ranking).toBeNull();
      }
    });

    it("should error when rejecting without a reason", () => {
      const submission = ChallengeSubmission.create({
        challengeId: "challenge-123",
        groupId: "group-456",
      }).value as ChallengeSubmission;

      const result = submission.reject({
        reviewedById: "admin-123",
        reason: "",
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.field).toBe("reason");
      }
    });

    it("should error when trying to reject an approved submission", () => {
      const submission = ChallengeSubmission.create({
        challengeId: "challenge-123",
        groupId: "group-456",
        status: "APPROVED",
      }).value as ChallengeSubmission;

      const result = submission.reject({
        reviewedById: "admin-123",
        reason: "Violation",
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBeInstanceOf(StateTransitionError);
      }
    });
  });

  describe("autoApprove", () => {
    it("should auto-approve with points", () => {
      const submission = ChallengeSubmission.create({
        challengeId: "challenge-123",
        groupId: "group-456",
      }).value as ChallengeSubmission;

      const result = submission.autoApprove({ awardedPoints: 50 });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.status).toBe("APPROVED");
        expect(result.value.awardedPoints).toBe(50);
        expect(result.value.bonusPoints).toBe(0);
        expect(result.value.reviewedById).toBeNull();
        expect(result.value.rejectionReason).toBeNull();
      }
    });

    it("should error if awardedPoints is negative", () => {
      const submission = ChallengeSubmission.create({
        challengeId: "challenge-123",
        groupId: "group-456",
      }).value as ChallengeSubmission;

      const result = submission.autoApprove({ awardedPoints: -10 });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.field).toBe("awardedPoints");
      }
    });
  });

  describe("updateVoteStats", () => {
    it("should update vote count and score", async () => {
      const submission = ChallengeSubmission.create({
        challengeId: "challenge-123",
        groupId: "group-456",
        voteCount: 0,
        voteScore: 0,
      }).value as ChallengeSubmission;

      // Small delay to ensure updatedAt is different
      await new Promise((resolve) => setTimeout(resolve, 2));

      const updated = submission.updateVoteStats({
        voteCount: 10,
        voteScore: 50.5,
      });

      expect(updated.voteCount).toBe(10);
      expect(updated.voteScore).toBe(50.5);
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(
        submission.updatedAt.getTime(),
      );
    });
  });

  describe("status checks", () => {
    it("isPending should return true for pending submissions", () => {
      const submission = ChallengeSubmission.create({
        challengeId: "challenge-123",
        groupId: "group-456",
        status: "PENDING",
      }).value as ChallengeSubmission;

      expect(submission.isPending()).toBe(true);
      expect(submission.isApproved()).toBe(false);
      expect(submission.isRejected()).toBe(false);
    });

    it("isApproved should return true for approved submissions", () => {
      const submission = ChallengeSubmission.create({
        challengeId: "challenge-123",
        groupId: "group-456",
        status: "APPROVED",
      }).value as ChallengeSubmission;

      expect(submission.isPending()).toBe(false);
      expect(submission.isApproved()).toBe(true);
      expect(submission.isRejected()).toBe(false);
    });

    it("isRejected should return true for rejected submissions", () => {
      const submission = ChallengeSubmission.create({
        challengeId: "challenge-123",
        groupId: "group-456",
        status: "REJECTED",
      }).value as ChallengeSubmission;

      expect(submission.isPending()).toBe(false);
      expect(submission.isApproved()).toBe(false);
      expect(submission.isRejected()).toBe(true);
    });
  });

  describe("canEdit and canDelete", () => {
    it("should allow editing and deleting pending submissions", () => {
      const submission = ChallengeSubmission.create({
        challengeId: "challenge-123",
        groupId: "group-456",
        status: "PENDING",
      }).value as ChallengeSubmission;

      expect(submission.canEdit()).toBe(true);
      expect(submission.canDelete()).toBe(true);
    });

    it("should not allow editing or deleting approved submissions", () => {
      const submission = ChallengeSubmission.create({
        challengeId: "challenge-123",
        groupId: "group-456",
        status: "APPROVED",
      }).value as ChallengeSubmission;

      expect(submission.canEdit()).toBe(false);
      expect(submission.canDelete()).toBe(false);
    });

    it("should not allow editing or deleting rejected submissions", () => {
      const submission = ChallengeSubmission.create({
        challengeId: "challenge-123",
        groupId: "group-456",
        status: "REJECTED",
      }).value as ChallengeSubmission;

      expect(submission.canEdit()).toBe(false);
      expect(submission.canDelete()).toBe(false);
    });
  });

  describe("hasMedia", () => {
    it("should return true when has images", () => {
      const submission = ChallengeSubmission.create({
        challengeId: "challenge-123",
        groupId: "group-456",
        imageIds: ["img1"],
      }).value as ChallengeSubmission;

      expect(submission.hasMedia()).toBe(true);
    });

    it("should return true when has video", () => {
      const submission = ChallengeSubmission.create({
        challengeId: "challenge-123",
        groupId: "group-456",
        videoId: "video-123",
      }).value as ChallengeSubmission;

      expect(submission.hasMedia()).toBe(true);
    });

    it("should return false when has no media", () => {
      const submission = ChallengeSubmission.create({
        challengeId: "challenge-123",
        groupId: "group-456",
      }).value as ChallengeSubmission;

      expect(submission.hasMedia()).toBe(false);
    });
  });

  describe("hasLocation", () => {
    it("should return true when has both latitude and longitude", () => {
      const submission = ChallengeSubmission.create({
        challengeId: "challenge-123",
        groupId: "group-456",
        latitude: 52.2297,
        longitude: 21.0122,
      }).value as ChallengeSubmission;

      expect(submission.hasLocation()).toBe(true);
    });

    it("should return false when missing latitude", () => {
      const submission = ChallengeSubmission.create({
        challengeId: "challenge-123",
        groupId: "group-456",
        longitude: 21.0122,
      }).value as ChallengeSubmission;

      expect(submission.hasLocation()).toBe(false);
    });

    it("should return false when missing longitude", () => {
      const submission = ChallengeSubmission.create({
        challengeId: "challenge-123",
        groupId: "group-456",
        latitude: 52.2297,
      }).value as ChallengeSubmission;

      expect(submission.hasLocation()).toBe(false);
    });
  });

  describe("getTotalPoints", () => {
    it("should return sum of awarded and bonus points", () => {
      const submission = ChallengeSubmission.create({
        challengeId: "challenge-123",
        groupId: "group-456",
        awardedPoints: 100,
        bonusPoints: 25,
      }).value as ChallengeSubmission;

      expect(submission.getTotalPoints()).toBe(125);
    });
  });

  describe("isReviewed", () => {
    it("should return true when reviewedAt is set", () => {
      const submission = ChallengeSubmission.create({
        challengeId: "challenge-123",
        groupId: "group-456",
        reviewedAt: new Date(),
      }).value as ChallengeSubmission;

      expect(submission.isReviewed()).toBe(true);
    });

    it("should return false when reviewedAt is null", () => {
      const submission = ChallengeSubmission.create({
        challengeId: "challenge-123",
        groupId: "group-456",
      }).value as ChallengeSubmission;

      expect(submission.isReviewed()).toBe(false);
    });
  });

  describe("withGroup", () => {
    it("should set group info", () => {
      const submission = ChallengeSubmission.create({
        challengeId: "challenge-123",
        groupId: "group-456",
      }).value as ChallengeSubmission;

      const withGroup = submission.withGroup({
        id: "group-456",
        name: "Test Group",
        description: "A test group",
        image: "group-image.jpg",
      });

      expect(withGroup.group).toEqual({
        id: "group-456",
        name: "Test Group",
        description: "A test group",
        image: "group-image.jpg",
      });
    });
  });

  describe("withReviewer", () => {
    it("should set reviewer info", () => {
      const submission = ChallengeSubmission.create({
        challengeId: "challenge-123",
        groupId: "group-456",
      }).value as ChallengeSubmission;

      const withReviewer = submission.withReviewer({
        id: "user-789",
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
      });

      expect(withReviewer.reviewedBy).toEqual({
        id: "user-789",
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
      });
    });
  });

  describe("withChallenge", () => {
    it("should set challenge info", () => {
      const submission = ChallengeSubmission.create({
        challengeId: "challenge-123",
        groupId: "group-456",
      }).value as ChallengeSubmission;

      const withChallenge = submission.withChallenge({
        id: "challenge-123",
        name: "Test Challenge",
        tripId: "trip-789",
      });

      expect(withChallenge.challenge).toEqual({
        id: "challenge-123",
        name: "Test Challenge",
        tripId: "trip-789",
      });
    });
  });

  describe("compareForSort", () => {
    it("should sort by voteScore descending", () => {
      const submission1 = ChallengeSubmission.create({
        challengeId: "c1",
        groupId: "g1",
        voteScore: 100,
        createdAt: new Date("2024-01-01"),
      }).value as ChallengeSubmission;

      const submission2 = ChallengeSubmission.create({
        challengeId: "c1",
        groupId: "g2",
        voteScore: 50,
        createdAt: new Date("2024-01-01"),
      }).value as ChallengeSubmission;

      expect(submission1.compareForSort(submission2)).toBeLessThan(0);
      expect(submission2.compareForSort(submission1)).toBeGreaterThan(0);
    });

    it("should sort by createdAt ascending when voteScore is equal", () => {
      const submission1 = ChallengeSubmission.create({
        challengeId: "c1",
        groupId: "g1",
        voteScore: 50,
        createdAt: new Date("2024-01-01"),
      }).value as ChallengeSubmission;

      const submission2 = ChallengeSubmission.create({
        challengeId: "c1",
        groupId: "g2",
        voteScore: 50,
        createdAt: new Date("2024-01-02"),
      }).value as ChallengeSubmission;

      expect(submission1.compareForSort(submission2)).toBeLessThan(0);
      expect(submission2.compareForSort(submission1)).toBeGreaterThan(0);
    });
  });
});

describe("SUBMISSION_STATUSES", () => {
  it("should contain all valid statuses", () => {
    expect(SUBMISSION_STATUSES).toEqual(["PENDING", "APPROVED", "REJECTED"]);
  });
});
