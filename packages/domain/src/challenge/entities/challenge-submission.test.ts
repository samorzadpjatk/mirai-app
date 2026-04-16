import { describe, it, expect } from "bun:test";
import { Effect } from "effect";
import { ChallengeSubmission } from "./challenge-submission";
import type { ReviewerInfo } from "./challenge-submission";
import { ValidationError, StateTransitionError } from "../../system/errors";
import { SubmissionId } from "../value-objects/submission-id";
import type {
  GroupInfo,
  ChallengeInfo,
} from "../../activity/entities/activity-feed";

const validChallengeId = "challenge-123";
const validGroupId = "group-456";
const validReviewerId = "reviewer-abc";

const createMinimalProps = () => ({
  challengeId: validChallengeId,
  groupId: validGroupId,
});

const createValidSubmission = async (
  overrides: Partial<Parameters<typeof ChallengeSubmission.create>[0]> = {},
): Promise<ChallengeSubmission> => {
  const props = { ...createMinimalProps(), ...overrides };
  return Effect.runPromise(ChallengeSubmission.create(props));
};

const createMockGroupInfo = (): GroupInfo => ({
  id: "group-123",
  name: "Test Group",
  image: null,
  coins: 100,
});

const createMockChallengeInfo = (): ChallengeInfo => ({
  id: "challenge-123",
  name: "Test Challenge",
  description: "Test description",
  image: null,
  status: "ACTIVE",
  startTime: new Date("2024-01-01"),
  endTime: new Date("2024-12-31"),
  votingStartTime: null,
  votingEndTime: null,
});

const createMockReviewer = (): ReviewerInfo => ({
  id: validReviewerId,
  firstName: "John",
  lastName: "Doe",
  email: "john@example.com",
});

describe("[UNIT] ChallengeSubmission", () => {
  describe("[UNIT] ChallengeSubmission.create", () => {
    describe("creates entity with minimal props", () => {
      it("creates with challengeId and groupId", async () => {
        const submission = await createValidSubmission();
        expect(submission.challengeId).toBe(validChallengeId);
        expect(submission.groupId).toBe(validGroupId);
      });

      it("generates id when not provided", async () => {
        const submission = await createValidSubmission();
        expect(submission.id).toBeDefined();
        expect(submission.id.length).toBeGreaterThan(0);
      });

      it("uses provided id when specified", async () => {
        const customId = SubmissionId.unsafeCreate("submission-789");
        const submission = await createValidSubmission({ id: customId });
        expect(submission.id).toBe(customId);
      });

      it("defaults status to PENDING", async () => {
        const submission = await createValidSubmission();
        expect(submission.status).toBe("PENDING");
      });

      it("defaults imageIds to empty array", async () => {
        const submission = await createValidSubmission();
        expect(submission.imageIds).toEqual([]);
      });

      it("defaults videoId to null", async () => {
        const submission = await createValidSubmission();
        expect(submission.videoId).toBeNull();
      });

      it("defaults textContent to null", async () => {
        const submission = await createValidSubmission();
        expect(submission.textContent).toBeNull();
      });

      it("defaults latitude to null", async () => {
        const submission = await createValidSubmission();
        expect(submission.latitude).toBeNull();
      });

      it("defaults longitude to null", async () => {
        const submission = await createValidSubmission();
        expect(submission.longitude).toBeNull();
      });

      it("defaults reviewedById to null", async () => {
        const submission = await createValidSubmission();
        expect(submission.reviewedById).toBeNull();
      });

      it("defaults reviewedAt to null", async () => {
        const submission = await createValidSubmission();
        expect(submission.reviewedAt).toBeNull();
      });

      it("defaults rejectionReason to null", async () => {
        const submission = await createValidSubmission();
        expect(submission.rejectionReason).toBeNull();
      });

      it("defaults awardedPoints to 0", async () => {
        const submission = await createValidSubmission();
        expect(submission.awardedPoints).toBe(0);
      });

      it("defaults bonusPoints to 0", async () => {
        const submission = await createValidSubmission();
        expect(submission.bonusPoints).toBe(0);
      });

      it("defaults ranking to null", async () => {
        const submission = await createValidSubmission();
        expect(submission.ranking).toBeNull();
      });

      it("defaults voteCount to 0", async () => {
        const submission = await createValidSubmission();
        expect(submission.voteCount).toBe(0);
      });

      it("defaults voteScore to 0", async () => {
        const submission = await createValidSubmission();
        expect(submission.voteScore).toBe(0);
      });

      it("defaults related entities to null", async () => {
        const submission = await createValidSubmission();
        expect(submission.group).toBeNull();
        expect(submission.reviewedBy).toBeNull();
        expect(submission.challenge).toBeNull();
      });
    });

    describe("creates entity with all props", () => {
      it("creates with all optional fields populated", async () => {
        const now = new Date();
        const customId = SubmissionId.unsafeCreate("submission-789");
        const props = {
          id: customId,
          challengeId: validChallengeId,
          groupId: validGroupId,
          imageIds: ["img-1", "img-2"],
          videoId: "video-123",
          textContent: "Test submission content",
          latitude: 52.2297,
          longitude: 21.0122,
          status: "APPROVED" as const,
          reviewedById: validReviewerId,
          reviewedAt: now,
          rejectionReason: null,
          awardedPoints: 100,
          bonusPoints: 50,
          ranking: 1,
          voteCount: 10,
          voteScore: 25,
          createdAt: now,
          updatedAt: now,
          group: createMockGroupInfo(),
          reviewedBy: createMockReviewer(),
          challenge: createMockChallengeInfo(),
        };
        const submission = await Effect.runPromise(
          ChallengeSubmission.create(props),
        );

        expect(submission.id).toBe(props.id);
        expect(submission.imageIds).toEqual(props.imageIds);
        expect(submission.videoId).toBe(props.videoId);
        expect(submission.textContent).toBe(props.textContent);
        expect(submission.latitude).toBe(props.latitude);
        expect(submission.longitude).toBe(props.longitude);
        expect(submission.status).toBe(props.status);
        expect(submission.reviewedById).toBe(props.reviewedById);
        expect(submission.reviewedAt).toBe(props.reviewedAt);
        expect(submission.rejectionReason).toBeNull();
        expect(submission.awardedPoints).toBe(props.awardedPoints);
        expect(submission.bonusPoints).toBe(props.bonusPoints);
        expect(submission.ranking).toBe(props.ranking);
        expect(submission.voteCount).toBe(props.voteCount);
        expect(submission.voteScore).toBe(props.voteScore);
        expect(submission.group).toEqual(props.group);
        expect(submission.reviewedBy).toEqual(props.reviewedBy);
        expect(submission.challenge).toEqual(props.challenge);
      });
    });

    describe("validation errors", () => {
      it("fails with ValidationError for empty challengeId", async () => {
        const result = await Effect.runPromise(
          Effect.either(
            ChallengeSubmission.create({
              ...createMinimalProps(),
              challengeId: "",
            }),
          ),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(ValidationError);
          expect(result.left.field).toBe("challengeId");
        }
      });

      it("fails with ValidationError for empty groupId", async () => {
        const result = await Effect.runPromise(
          Effect.either(
            ChallengeSubmission.create({
              ...createMinimalProps(),
              groupId: "",
            }),
          ),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(ValidationError);
          expect(result.left.field).toBe("groupId");
        }
      });

      it("fails with ValidationError for too many imageIds", async () => {
        const imageIds = Array(11).fill("image-id");
        const result = await Effect.runPromise(
          Effect.either(
            ChallengeSubmission.create({
              ...createMinimalProps(),
              imageIds,
            }),
          ),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(ValidationError);
          expect(result.left.field).toBe("imageIds");
        }
      });

      it("fails with ValidationError for textContent > 10000 chars", async () => {
        const longText = "a".repeat(10001);
        const result = await Effect.runPromise(
          Effect.either(
            ChallengeSubmission.create({
              ...createMinimalProps(),
              textContent: longText,
            }),
          ),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(ValidationError);
          expect(result.left.field).toBe("textContent");
        }
      });

      it("fails with ValidationError for latitude < -90", async () => {
        const result = await Effect.runPromise(
          Effect.either(
            ChallengeSubmission.create({
              ...createMinimalProps(),
              latitude: -91,
            }),
          ),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(ValidationError);
          expect(result.left.field).toBe("latitude");
        }
      });

      it("fails with ValidationError for latitude > 90", async () => {
        const result = await Effect.runPromise(
          Effect.either(
            ChallengeSubmission.create({
              ...createMinimalProps(),
              latitude: 91,
            }),
          ),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(ValidationError);
          expect(result.left.field).toBe("latitude");
        }
      });

      it("fails with ValidationError for longitude < -180", async () => {
        const result = await Effect.runPromise(
          Effect.either(
            ChallengeSubmission.create({
              ...createMinimalProps(),
              longitude: -181,
            }),
          ),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(ValidationError);
          expect(result.left.field).toBe("longitude");
        }
      });

      it("fails with ValidationError for longitude > 180", async () => {
        const result = await Effect.runPromise(
          Effect.either(
            ChallengeSubmission.create({
              ...createMinimalProps(),
              longitude: 181,
            }),
          ),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(ValidationError);
          expect(result.left.field).toBe("longitude");
        }
      });

      it("fails with ValidationError for rejectionReason > 1000 chars", async () => {
        const longReason = "a".repeat(1001);
        const result = await Effect.runPromise(
          Effect.either(
            ChallengeSubmission.create({
              ...createMinimalProps(),
              rejectionReason: longReason,
            }),
          ),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(ValidationError);
          expect(result.left.field).toBe("rejectionReason");
        }
      });

      it("fails with ValidationError for negative awardedPoints", async () => {
        const result = await Effect.runPromise(
          Effect.either(
            ChallengeSubmission.create({
              ...createMinimalProps(),
              awardedPoints: -1,
            }),
          ),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(ValidationError);
          expect(result.left.field).toBe("awardedPoints");
        }
      });

      it("fails with ValidationError for negative bonusPoints", async () => {
        const result = await Effect.runPromise(
          Effect.either(
            ChallengeSubmission.create({
              ...createMinimalProps(),
              bonusPoints: -1,
            }),
          ),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(ValidationError);
          expect(result.left.field).toBe("bonusPoints");
        }
      });

      it("fails with ValidationError for ranking < 1", async () => {
        const result = await Effect.runPromise(
          Effect.either(
            ChallengeSubmission.create({
              ...createMinimalProps(),
              ranking: 0,
            }),
          ),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(ValidationError);
          expect(result.left.field).toBe("ranking");
        }
      });

      it("fails with ValidationError for ranking > 3", async () => {
        const result = await Effect.runPromise(
          Effect.either(
            ChallengeSubmission.create({
              ...createMinimalProps(),
              ranking: 4,
            }),
          ),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(ValidationError);
          expect(result.left.field).toBe("ranking");
        }
      });

      it("fails with ValidationError for non-integer ranking", async () => {
        const result = await Effect.runPromise(
          Effect.either(
            ChallengeSubmission.create({
              ...createMinimalProps(),
              ranking: 1.5,
            }),
          ),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(ValidationError);
          expect(result.left.field).toBe("ranking");
        }
      });
    });
  });

  describe("[UNIT] state machine transitions", () => {
    describe("approve transitions", () => {
      it("PENDING -> APPROVED succeeds", async () => {
        const submission = await createValidSubmission({ status: "PENDING" });
        const approved = await Effect.runPromise(
          submission.approve({ reviewedById: validReviewerId }),
        );
        expect(approved.status).toBe("APPROVED");
        expect(approved.isApproved()).toBe(true);
        expect(approved.isPending()).toBe(false);
      });

      it("APPROVED -> APPROVED fails", async () => {
        const submission = await createValidSubmission({ status: "APPROVED" });
        const result = await Effect.runPromise(
          Effect.either(submission.approve({ reviewedById: validReviewerId })),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(StateTransitionError);
          const error = result.left as StateTransitionError;
          expect(error.from).toBe("APPROVED");
          expect(error.to).toBe("APPROVED");
        }
      });

      it("REJECTED -> APPROVED fails", async () => {
        const submission = await createValidSubmission({ status: "REJECTED" });
        const result = await Effect.runPromise(
          Effect.either(submission.approve({ reviewedById: validReviewerId })),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(StateTransitionError);
          const error = result.left as StateTransitionError;
          expect(error.from).toBe("REJECTED");
          expect(error.to).toBe("APPROVED");
        }
      });
    });

    describe("reject transitions", () => {
      it("PENDING -> REJECTED succeeds", async () => {
        const submission = await createValidSubmission({ status: "PENDING" });
        const rejected = await Effect.runPromise(
          submission.reject({
            reviewedById: validReviewerId,
            reason: "Invalid content",
          }),
        );
        expect(rejected.status).toBe("REJECTED");
        expect(rejected.isRejected()).toBe(true);
        expect(rejected.isPending()).toBe(false);
      });

      it("APPROVED -> REJECTED fails", async () => {
        const submission = await createValidSubmission({ status: "APPROVED" });
        const result = await Effect.runPromise(
          Effect.either(
            submission.reject({
              reviewedById: validReviewerId,
              reason: "Invalid content",
            }),
          ),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(StateTransitionError);
          const error = result.left as StateTransitionError;
          expect(error.from).toBe("APPROVED");
          expect(error.to).toBe("REJECTED");
        }
      });

      it("REJECTED -> REJECTED fails", async () => {
        const submission = await createValidSubmission({ status: "REJECTED" });
        const result = await Effect.runPromise(
          Effect.either(
            submission.reject({
              reviewedById: validReviewerId,
              reason: "Invalid content",
            }),
          ),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(StateTransitionError);
          const error = result.left as StateTransitionError;
          expect(error.from).toBe("REJECTED");
          expect(error.to).toBe("REJECTED");
        }
      });
    });

    describe("StateTransitionError contains correct info", () => {
      it("error includes from, to, and entityType on approve failure", async () => {
        const submission = await createValidSubmission({ status: "APPROVED" });
        const result = await Effect.runPromise(
          Effect.either(submission.approve({ reviewedById: validReviewerId })),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(StateTransitionError);
          const error = result.left as StateTransitionError;
          expect(error.entityType).toBe("ChallengeSubmission");
          expect(error.message).toContain("Cannot approve");
        }
      });

      it("error includes from, to, and entityType on reject failure", async () => {
        const submission = await createValidSubmission({ status: "APPROVED" });
        const result = await Effect.runPromise(
          Effect.either(
            submission.reject({
              reviewedById: validReviewerId,
              reason: "Test",
            }),
          ),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(StateTransitionError);
          const error = result.left as StateTransitionError;
          expect(error.entityType).toBe("ChallengeSubmission");
          expect(error.message).toContain("Cannot reject");
        }
      });
    });
  });

  describe("[UNIT] approve method", () => {
    it("sets reviewedById and reviewedAt on approval", async () => {
      const submission = await createValidSubmission({ status: "PENDING" });
      const approved = await Effect.runPromise(
        submission.approve({ reviewedById: validReviewerId }),
      );
      expect(approved.reviewedById).toBe(validReviewerId);
      expect(approved.reviewedAt).toBeInstanceOf(Date);
    });

    it("clears rejectionReason on approval", async () => {
      const submission = await createValidSubmission({
        status: "PENDING",
        rejectionReason: "Previous reason",
      });
      const approved = await Effect.runPromise(
        submission.approve({ reviewedById: validReviewerId }),
      );
      expect(approved.rejectionReason).toBeNull();
    });

    it("accepts custom awardedPoints", async () => {
      const submission = await createValidSubmission({ status: "PENDING" });
      const approved = await Effect.runPromise(
        submission.approve({
          reviewedById: validReviewerId,
          awardedPoints: 150,
        }),
      );
      expect(approved.awardedPoints).toBe(150);
    });

    it("accepts custom bonusPoints", async () => {
      const submission = await createValidSubmission({ status: "PENDING" });
      const approved = await Effect.runPromise(
        submission.approve({ reviewedById: validReviewerId, bonusPoints: 25 }),
      );
      expect(approved.bonusPoints).toBe(25);
    });

    it("accepts ranking between 1 and 3", async () => {
      const submission = await createValidSubmission({ status: "PENDING" });
      const approved = await Effect.runPromise(
        submission.approve({ reviewedById: validReviewerId, ranking: 2 }),
      );
      expect(approved.ranking).toBe(2);
    });

    it("preserves existing points when not provided", async () => {
      const submission = await createValidSubmission({
        status: "PENDING",
        awardedPoints: 50,
        bonusPoints: 10,
      });
      const approved = await Effect.runPromise(
        submission.approve({ reviewedById: validReviewerId }),
      );
      expect(approved.awardedPoints).toBe(50);
      expect(approved.bonusPoints).toBe(10);
    });

    it("fails with ValidationError for negative awardedPoints", async () => {
      const submission = await createValidSubmission({ status: "PENDING" });
      const result = await Effect.runPromise(
        Effect.either(
          submission.approve({
            reviewedById: validReviewerId,
            awardedPoints: -1,
          }),
        ),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        const error = result.left as ValidationError;
        expect(error.field).toBe("awardedPoints");
      }
    });

    it("fails with ValidationError for negative bonusPoints", async () => {
      const submission = await createValidSubmission({ status: "PENDING" });
      const result = await Effect.runPromise(
        Effect.either(
          submission.approve({
            reviewedById: validReviewerId,
            bonusPoints: -1,
          }),
        ),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        const error = result.left as ValidationError;
        expect(error.field).toBe("bonusPoints");
      }
    });

    it("fails with ValidationError for invalid ranking", async () => {
      const submission = await createValidSubmission({ status: "PENDING" });
      const result = await Effect.runPromise(
        Effect.either(
          submission.approve({ reviewedById: validReviewerId, ranking: 5 }),
        ),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        const error = result.left as ValidationError;
        expect(error.field).toBe("ranking");
      }
    });

    it("preserves existing ranking when ranking is not provided", async () => {
      const submission = await createValidSubmission({
        status: "PENDING",
        ranking: 1,
      });
      const approved = await Effect.runPromise(
        submission.approve({ reviewedById: validReviewerId }),
      );
      expect(approved.ranking).toBe(1);
    });
  });

  describe("[UNIT] reject method", () => {
    it("sets reviewedById and reviewedAt on rejection", async () => {
      const submission = await createValidSubmission({ status: "PENDING" });
      const rejected = await Effect.runPromise(
        submission.reject({
          reviewedById: validReviewerId,
          reason: "Invalid content",
        }),
      );
      expect(rejected.reviewedById).toBe(validReviewerId);
      expect(rejected.reviewedAt).toBeInstanceOf(Date);
    });

    it("sets rejectionReason on rejection", async () => {
      const submission = await createValidSubmission({ status: "PENDING" });
      const rejected = await Effect.runPromise(
        submission.reject({
          reviewedById: validReviewerId,
          reason: "Invalid content",
        }),
      );
      expect(rejected.rejectionReason).toBe("Invalid content");
    });

    it("clears awardedPoints and bonusPoints on rejection", async () => {
      const submission = await createValidSubmission({
        status: "PENDING",
        awardedPoints: 100,
        bonusPoints: 50,
      });
      const rejected = await Effect.runPromise(
        submission.reject({ reviewedById: validReviewerId, reason: "Invalid" }),
      );
      expect(rejected.awardedPoints).toBe(0);
      expect(rejected.bonusPoints).toBe(0);
    });

    it("clears ranking on rejection", async () => {
      const submission = await createValidSubmission({
        status: "PENDING",
        ranking: 1,
      });
      const rejected = await Effect.runPromise(
        submission.reject({ reviewedById: validReviewerId, reason: "Invalid" }),
      );
      expect(rejected.ranking).toBeNull();
    });

    it("fails with ValidationError for empty reason", async () => {
      const submission = await createValidSubmission({ status: "PENDING" });
      const result = await Effect.runPromise(
        Effect.either(
          submission.reject({ reviewedById: validReviewerId, reason: "" }),
        ),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        const error = result.left as ValidationError;
        expect(error.field).toBe("reason");
      }
    });

    it("fails with ValidationError for reason > 1000 chars", async () => {
      const submission = await createValidSubmission({ status: "PENDING" });
      const longReason = "a".repeat(1001);
      const result = await Effect.runPromise(
        Effect.either(
          submission.reject({
            reviewedById: validReviewerId,
            reason: longReason,
          }),
        ),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        const error = result.left as ValidationError;
        expect(error.field).toBe("reason");
      }
    });
  });

  describe("[UNIT] autoApprove method", () => {
    it("transitions to APPROVED status", async () => {
      const submission = await createValidSubmission({ status: "PENDING" });
      const approved = await Effect.runPromise(
        submission.autoApprove({ awardedPoints: 50 }),
      );
      expect(approved.status).toBe("APPROVED");
      expect(approved.isApproved()).toBe(true);
    });

    it("sets awardedPoints", async () => {
      const submission = await createValidSubmission({ status: "PENDING" });
      const approved = await Effect.runPromise(
        submission.autoApprove({ awardedPoints: 75 }),
      );
      expect(approved.awardedPoints).toBe(75);
    });

    it("sets reviewedAt to current date", async () => {
      const submission = await createValidSubmission({ status: "PENDING" });
      const approved = await Effect.runPromise(
        submission.autoApprove({ awardedPoints: 50 }),
      );
      expect(approved.reviewedAt).toBeInstanceOf(Date);
    });

    it("sets reviewedById to null", async () => {
      const submission = await createValidSubmission({ status: "PENDING" });
      const approved = await Effect.runPromise(
        submission.autoApprove({ awardedPoints: 50 }),
      );
      expect(approved.reviewedById).toBeNull();
    });

    it("sets rejectionReason to null", async () => {
      const submission = await createValidSubmission({
        status: "PENDING",
        rejectionReason: "Previous reason",
      });
      const approved = await Effect.runPromise(
        submission.autoApprove({ awardedPoints: 50 }),
      );
      expect(approved.rejectionReason).toBeNull();
    });

    it("sets bonusPoints to 0", async () => {
      const submission = await createValidSubmission({
        status: "PENDING",
        bonusPoints: 25,
      });
      const approved = await Effect.runPromise(
        submission.autoApprove({ awardedPoints: 50 }),
      );
      expect(approved.bonusPoints).toBe(0);
    });

    it("sets ranking to null", async () => {
      const submission = await createValidSubmission({
        status: "PENDING",
        ranking: 1,
      });
      const approved = await Effect.runPromise(
        submission.autoApprove({ awardedPoints: 50 }),
      );
      expect(approved.ranking).toBeNull();
    });

    it("fails with ValidationError for negative awardedPoints", async () => {
      const submission = await createValidSubmission({ status: "PENDING" });
      const result = await Effect.runPromise(
        Effect.either(submission.autoApprove({ awardedPoints: -1 })),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        const error = result.left as ValidationError;
        expect(error.field).toBe("awardedPoints");
      }
    });

    it("allows zero awardedPoints", async () => {
      const submission = await createValidSubmission({ status: "PENDING" });
      const approved = await Effect.runPromise(
        submission.autoApprove({ awardedPoints: 0 }),
      );
      expect(approved.awardedPoints).toBe(0);
    });
  });

  describe("[UNIT] updateContent method", () => {
    it("updates imageIds when status is PENDING", async () => {
      const submission = await createValidSubmission({
        status: "PENDING",
        imageIds: ["old-img"],
      });
      const updated = await Effect.runPromise(
        submission.updateContent({ imageIds: ["new-img-1", "new-img-2"] }),
      );
      expect(updated.imageIds).toEqual(["new-img-1", "new-img-2"]);
    });

    it("updates videoId when status is PENDING", async () => {
      const submission = await createValidSubmission({
        status: "PENDING",
        videoId: null,
      });
      const updated = await Effect.runPromise(
        submission.updateContent({ videoId: "new-video" }),
      );
      expect(updated.videoId).toBe("new-video");
    });

    it("updates textContent when status is PENDING", async () => {
      const submission = await createValidSubmission({
        status: "PENDING",
        textContent: null,
      });
      const updated = await Effect.runPromise(
        submission.updateContent({ textContent: "New content" }),
      );
      expect(updated.textContent).toBe("New content");
    });

    it("updates location when status is PENDING", async () => {
      const submission = await createValidSubmission({
        status: "PENDING",
        latitude: null,
        longitude: null,
      });
      const updated = await Effect.runPromise(
        submission.updateContent({ latitude: 40.7128, longitude: -74.006 }),
      );
      expect(updated.latitude).toBe(40.7128);
      expect(updated.longitude).toBe(-74.006);
    });

    it("resets reviewedById and reviewedAt when updating content", async () => {
      const now = new Date();
      const submission = await createValidSubmission({
        status: "PENDING",
        reviewedById: validReviewerId,
        reviewedAt: now,
        rejectionReason: "Previous reason",
      });
      const updated = await Effect.runPromise(
        submission.updateContent({ textContent: "Updated" }),
      );
      expect(updated.reviewedById).toBeNull();
      expect(updated.reviewedAt).toBeNull();
      expect(updated.rejectionReason).toBeNull();
    });

    it("fails with StateTransitionError when status is APPROVED", async () => {
      const submission = await createValidSubmission({ status: "APPROVED" });
      const result = await Effect.runPromise(
        Effect.either(submission.updateContent({ textContent: "New" })),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(StateTransitionError);
      }
    });

    it("fails with StateTransitionError when status is REJECTED", async () => {
      const submission = await createValidSubmission({ status: "REJECTED" });
      const result = await Effect.runPromise(
        Effect.either(submission.updateContent({ textContent: "New" })),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(StateTransitionError);
      }
    });

    it("fails with ValidationError for too many imageIds", async () => {
      const submission = await createValidSubmission({ status: "PENDING" });
      const imageIds = Array(11).fill("image-id");
      const result = await Effect.runPromise(
        Effect.either(submission.updateContent({ imageIds })),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        const error = result.left as ValidationError;
        expect(error.field).toBe("imageIds");
      }
    });

    it("fails with ValidationError for textContent > 10000 chars", async () => {
      const submission = await createValidSubmission({ status: "PENDING" });
      const longText = "a".repeat(10001);
      const result = await Effect.runPromise(
        Effect.either(submission.updateContent({ textContent: longText })),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        const error = result.left as ValidationError;
        expect(error.field).toBe("textContent");
      }
    });

    it("fails with ValidationError for invalid latitude", async () => {
      const submission = await createValidSubmission({ status: "PENDING" });
      const result = await Effect.runPromise(
        Effect.either(submission.updateContent({ latitude: 91 })),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        const error = result.left as ValidationError;
        expect(error.field).toBe("latitude");
      }
    });

    it("fails with ValidationError for invalid longitude", async () => {
      const submission = await createValidSubmission({ status: "PENDING" });
      const result = await Effect.runPromise(
        Effect.either(submission.updateContent({ longitude: 181 })),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        const error = result.left as ValidationError;
        expect(error.field).toBe("longitude");
      }
    });

    it("preserves unchanged properties", async () => {
      const submission = await createValidSubmission({
        status: "PENDING",
        imageIds: ["img-1"],
        textContent: "Original",
        latitude: 52.0,
      });
      const updated = await Effect.runPromise(
        submission.updateContent({ textContent: "Updated" }),
      );
      expect(updated.textContent).toBe("Updated");
      expect(updated.imageIds).toEqual(["img-1"]);
      expect(updated.latitude).toBe(52.0);
    });
  });

  describe("[UNIT] updateVoteStats method", () => {
    it("updates voteCount and voteScore", async () => {
      const submission = await createValidSubmission({
        voteCount: 0,
        voteScore: 0,
      });
      const updated = submission.updateVoteStats({
        voteCount: 5,
        voteScore: 15,
      });
      expect(updated.voteCount).toBe(5);
      expect(updated.voteScore).toBe(15);
    });

    it("returns new instance (immutable)", async () => {
      const submission = await createValidSubmission();
      const updated = submission.updateVoteStats({
        voteCount: 10,
        voteScore: 25,
      });
      expect(updated).not.toBe(submission);
      expect(submission.voteCount).toBe(0);
      expect(submission.voteScore).toBe(0);
    });
  });

  describe("[UNIT] status check methods", () => {
    describe("isPending", () => {
      it("returns true when status is PENDING", async () => {
        const submission = await createValidSubmission({ status: "PENDING" });
        expect(submission.isPending()).toBe(true);
      });

      it("returns false when status is APPROVED", async () => {
        const submission = await createValidSubmission({ status: "APPROVED" });
        expect(submission.isPending()).toBe(false);
      });

      it("returns false when status is REJECTED", async () => {
        const submission = await createValidSubmission({ status: "REJECTED" });
        expect(submission.isPending()).toBe(false);
      });
    });

    describe("isApproved", () => {
      it("returns true when status is APPROVED", async () => {
        const submission = await createValidSubmission({ status: "APPROVED" });
        expect(submission.isApproved()).toBe(true);
      });

      it("returns false when status is PENDING", async () => {
        const submission = await createValidSubmission({ status: "PENDING" });
        expect(submission.isApproved()).toBe(false);
      });

      it("returns false when status is REJECTED", async () => {
        const submission = await createValidSubmission({ status: "REJECTED" });
        expect(submission.isApproved()).toBe(false);
      });
    });

    describe("isRejected", () => {
      it("returns true when status is REJECTED", async () => {
        const submission = await createValidSubmission({ status: "REJECTED" });
        expect(submission.isRejected()).toBe(true);
      });

      it("returns false when status is PENDING", async () => {
        const submission = await createValidSubmission({ status: "PENDING" });
        expect(submission.isRejected()).toBe(false);
      });

      it("returns false when status is APPROVED", async () => {
        const submission = await createValidSubmission({ status: "APPROVED" });
        expect(submission.isRejected()).toBe(false);
      });
    });

    describe("canEdit", () => {
      it("returns true when status is PENDING", async () => {
        const submission = await createValidSubmission({ status: "PENDING" });
        expect(submission.canEdit()).toBe(true);
      });

      it("returns false when status is APPROVED", async () => {
        const submission = await createValidSubmission({ status: "APPROVED" });
        expect(submission.canEdit()).toBe(false);
      });

      it("returns false when status is REJECTED", async () => {
        const submission = await createValidSubmission({ status: "REJECTED" });
        expect(submission.canEdit()).toBe(false);
      });
    });

    describe("canDelete", () => {
      it("returns true when status is PENDING", async () => {
        const submission = await createValidSubmission({ status: "PENDING" });
        expect(submission.canDelete()).toBe(true);
      });

      it("returns false when status is APPROVED", async () => {
        const submission = await createValidSubmission({ status: "APPROVED" });
        expect(submission.canDelete()).toBe(false);
      });

      it("returns false when status is REJECTED", async () => {
        const submission = await createValidSubmission({ status: "REJECTED" });
        expect(submission.canDelete()).toBe(false);
      });
    });

    describe("isReviewed", () => {
      it("returns true when reviewedAt is set", async () => {
        const submission = await createValidSubmission({
          reviewedAt: new Date(),
        });
        expect(submission.isReviewed()).toBe(true);
      });

      it("returns false when reviewedAt is null", async () => {
        const submission = await createValidSubmission({
          reviewedAt: null,
        });
        expect(submission.isReviewed()).toBe(false);
      });
    });
  });

  describe("[UNIT] media and location checks", () => {
    describe("hasMedia", () => {
      it("returns true when has imageIds", async () => {
        const submission = await createValidSubmission({
          imageIds: ["img-1"],
          videoId: null,
        });
        expect(submission.hasMedia()).toBe(true);
      });

      it("returns true when has videoId", async () => {
        const submission = await createValidSubmission({
          imageIds: [],
          videoId: "video-123",
        });
        expect(submission.hasMedia()).toBe(true);
      });

      it("returns true when has both images and video", async () => {
        const submission = await createValidSubmission({
          imageIds: ["img-1"],
          videoId: "video-123",
        });
        expect(submission.hasMedia()).toBe(true);
      });

      it("returns false when no media", async () => {
        const submission = await createValidSubmission({
          imageIds: [],
          videoId: null,
        });
        expect(submission.hasMedia()).toBe(false);
      });
    });

    describe("hasLocation", () => {
      it("returns true when both latitude and longitude are set", async () => {
        const submission = await createValidSubmission({
          latitude: 52.2297,
          longitude: 21.0122,
        });
        expect(submission.hasLocation()).toBe(true);
      });

      it("returns false when only latitude is set", async () => {
        const submission = await createValidSubmission({
          latitude: 52.2297,
          longitude: null,
        });
        expect(submission.hasLocation()).toBe(false);
      });

      it("returns false when only longitude is set", async () => {
        const submission = await createValidSubmission({
          latitude: null,
          longitude: 21.0122,
        });
        expect(submission.hasLocation()).toBe(false);
      });

      it("returns false when neither is set", async () => {
        const submission = await createValidSubmission({
          latitude: null,
          longitude: null,
        });
        expect(submission.hasLocation()).toBe(false);
      });
    });
  });

  describe("[UNIT] getTotalPoints", () => {
    it("returns sum of awardedPoints and bonusPoints", async () => {
      const submission = await createValidSubmission({
        awardedPoints: 100,
        bonusPoints: 25,
      });
      expect(submission.getTotalPoints()).toBe(125);
    });

    it("returns 0 when both are 0", async () => {
      const submission = await createValidSubmission({
        awardedPoints: 0,
        bonusPoints: 0,
      });
      expect(submission.getTotalPoints()).toBe(0);
    });

    it("returns awardedPoints when bonusPoints is 0", async () => {
      const submission = await createValidSubmission({
        awardedPoints: 50,
        bonusPoints: 0,
      });
      expect(submission.getTotalPoints()).toBe(50);
    });
  });

  describe("[UNIT] withGroup, withReviewer, withChallenge", () => {
    it("withGroup sets group info", async () => {
      const submission = await createValidSubmission();
      const group = createMockGroupInfo();
      const updated = submission.withGroup(group);
      expect(updated.group).toEqual(group);
      expect(updated).not.toBe(submission);
    });

    it("withReviewer sets reviewer info", async () => {
      const submission = await createValidSubmission();
      const reviewer = createMockReviewer();
      const updated = submission.withReviewer(reviewer);
      expect(updated.reviewedBy).toEqual(reviewer);
      expect(updated).not.toBe(submission);
    });

    it("withChallenge sets challenge info", async () => {
      const submission = await createValidSubmission();
      const challenge = createMockChallengeInfo();
      const updated = submission.withChallenge(challenge);
      expect(updated.challenge).toEqual(challenge);
      expect(updated).not.toBe(submission);
    });

    it("preserves other properties when setting related entities", async () => {
      const submission = await createValidSubmission({
        challengeId: validChallengeId,
        groupId: validGroupId,
        textContent: "Test content",
      });
      const updated = submission.withGroup(createMockGroupInfo());
      expect(updated.challengeId).toBe(validChallengeId);
      expect(updated.groupId).toBe(validGroupId);
      expect(updated.textContent).toBe("Test content");
    });
  });

  describe("[UNIT] getSortKey and compareForSort", () => {
    it("getSortKey returns voteScore, createdAt, and id", async () => {
      const createdAt = new Date("2024-01-15");
      const customId = SubmissionId.unsafeCreate("submission-xyz");
      const submission = await createValidSubmission({
        id: customId,
        voteScore: 42,
        createdAt,
      });
      const sortKey = submission.getSortKey();
      expect(sortKey.voteScore).toBe(42);
      expect(sortKey.createdAt).toBe(createdAt);
      expect(sortKey.id).toBe(customId);
    });

    it("compareForSort sorts by voteScore descending", async () => {
      const submission1 = await createValidSubmission({ voteScore: 100 });
      const submission2 = await createValidSubmission({ voteScore: 50 });
      expect(submission1.compareForSort(submission2)).toBe(-50);
      expect(submission2.compareForSort(submission1)).toBe(50);
    });

    it("compareForSort sorts by createdAt ascending when voteScore equal", async () => {
      const earlier = new Date("2024-01-01");
      const later = new Date("2024-01-15");
      const submission1 = await createValidSubmission({
        voteScore: 50,
        createdAt: later,
      });
      const submission2 = await createValidSubmission({
        voteScore: 50,
        createdAt: earlier,
      });
      expect(submission1.compareForSort(submission2)).toBeGreaterThan(0);
      expect(submission2.compareForSort(submission1)).toBeLessThan(0);
    });

    it("compareForSort sorts by id when voteScore and createdAt equal", async () => {
      const createdAt = new Date("2024-01-01");
      const id1 = SubmissionId.unsafeCreate("submission-b");
      const id2 = SubmissionId.unsafeCreate("submission-a");
      const submission1 = await createValidSubmission({
        id: id1,
        voteScore: 50,
        createdAt,
      });
      const submission2 = await createValidSubmission({
        id: id2,
        voteScore: 50,
        createdAt,
      });
      expect(submission1.compareForSort(submission2)).toBeGreaterThan(0);
      expect(submission2.compareForSort(submission1)).toBeLessThan(0);
    });

    it("compareForSort returns 0 for equal submissions", async () => {
      const createdAt = new Date("2024-01-01");
      const id = SubmissionId.unsafeCreate("same-id");
      const submission1 = await createValidSubmission({
        id,
        voteScore: 50,
        createdAt,
      });
      const submission2 = await createValidSubmission({
        id,
        voteScore: 50,
        createdAt,
      });
      expect(submission1.compareForSort(submission2)).toBe(0);
    });
  });

  describe("[UNIT] immutability", () => {
    it("create returns new instances", async () => {
      const id1 = SubmissionId.unsafeCreate("id-1");
      const id2 = SubmissionId.unsafeCreate("id-2");
      const submission1 = await createValidSubmission({ id: id1 });
      const submission2 = await createValidSubmission({ id: id2 });
      expect(submission1).not.toBe(submission2);
    });

    it("approve returns new instance", async () => {
      const submission = await createValidSubmission({ status: "PENDING" });
      const approved = await Effect.runPromise(
        submission.approve({ reviewedById: validReviewerId }),
      );
      expect(approved).not.toBe(submission);
      expect(submission.status).toBe("PENDING");
    });

    it("reject returns new instance", async () => {
      const submission = await createValidSubmission({ status: "PENDING" });
      const rejected = await Effect.runPromise(
        submission.reject({ reviewedById: validReviewerId, reason: "Test" }),
      );
      expect(rejected).not.toBe(submission);
      expect(submission.status).toBe("PENDING");
    });

    it("autoApprove returns new instance", async () => {
      const submission = await createValidSubmission({ status: "PENDING" });
      const approved = await Effect.runPromise(
        submission.autoApprove({ awardedPoints: 50 }),
      );
      expect(approved).not.toBe(submission);
      expect(submission.status).toBe("PENDING");
    });

    it("updateContent returns new instance", async () => {
      const submission = await createValidSubmission({
        status: "PENDING",
        textContent: "Original",
      });
      const updated = await Effect.runPromise(
        submission.updateContent({ textContent: "Updated" }),
      );
      expect(updated).not.toBe(submission);
      expect(submission.textContent).toBe("Original");
    });

    it("updateVoteStats returns new instance", async () => {
      const submission = await createValidSubmission({ voteCount: 0 });
      const updated = submission.updateVoteStats({
        voteCount: 5,
        voteScore: 10,
      });
      expect(updated).not.toBe(submission);
      expect(submission.voteCount).toBe(0);
    });

    it("returns new instance with updated updatedAt", async () => {
      const submission = await createValidSubmission();
      const originalUpdatedAt = submission.updatedAt;
      await new Promise((resolve) => setTimeout(resolve, 10));
      const approved = await Effect.runPromise(
        submission.approve({ reviewedById: validReviewerId }),
      );
      expect(approved.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime(),
      );
    });

    it("preserves createdAt during state transitions", async () => {
      const createdAt = new Date("2024-01-01");
      const submission = await createValidSubmission({
        status: "PENDING",
        createdAt,
      });
      const approved = await Effect.runPromise(
        submission.approve({ reviewedById: validReviewerId }),
      );
      expect(approved.createdAt).toBe(createdAt);
    });
  });

  describe("[UNIT] edge cases", () => {
    it("accepts textContent exactly 10000 characters", async () => {
      const text = "a".repeat(10000);
      const submission = await createValidSubmission({ textContent: text });
      expect(submission.textContent).toBe(text);
    });

    it("accepts rejectionReason exactly 1000 characters", async () => {
      const reason = "a".repeat(1000);
      const submission = await createValidSubmission({
        rejectionReason: reason,
      });
      expect(submission.rejectionReason).toBe(reason);
    });

    it("accepts exactly 10 imageIds", async () => {
      const imageIds = Array(10)
        .fill("image-id")
        .map((_, i) => `img-${i}`);
      const submission = await createValidSubmission({ imageIds });
      expect(submission.imageIds).toHaveLength(10);
    });

    it("accepts latitude at boundary values", async () => {
      const submissionMin = await createValidSubmission({ latitude: -90 });
      expect(submissionMin.latitude).toBe(-90);

      const submissionMax = await createValidSubmission({ latitude: 90 });
      expect(submissionMax.latitude).toBe(90);
    });

    it("accepts longitude at boundary values", async () => {
      const submissionMin = await createValidSubmission({ longitude: -180 });
      expect(submissionMin.longitude).toBe(-180);

      const submissionMax = await createValidSubmission({ longitude: 180 });
      expect(submissionMax.longitude).toBe(180);
    });

    it("accepts ranking at boundary values", async () => {
      const submission1 = await createValidSubmission({ ranking: 1 });
      expect(submission1.ranking).toBe(1);

      const submission3 = await createValidSubmission({ ranking: 3 });
      expect(submission3.ranking).toBe(3);
    });

    it("accepts zero awardedPoints and bonusPoints", async () => {
      const submission = await createValidSubmission({
        awardedPoints: 0,
        bonusPoints: 0,
      });
      expect(submission.awardedPoints).toBe(0);
      expect(submission.bonusPoints).toBe(0);
    });

    it("accepts large positive points", async () => {
      const submission = await createValidSubmission({
        awardedPoints: 10000,
        bonusPoints: 5000,
      });
      expect(submission.getTotalPoints()).toBe(15000);
    });

    it("handles null textContent in updateContent", async () => {
      const submission = await createValidSubmission({
        status: "PENDING",
        textContent: "Original",
      });
      const updated = await Effect.runPromise(
        submission.updateContent({ textContent: null }),
      );
      expect(updated.textContent).toBeNull();
    });

    it("handles null videoId in updateContent", async () => {
      const submission = await createValidSubmission({
        status: "PENDING",
        videoId: "old-video",
      });
      const updated = await Effect.runPromise(
        submission.updateContent({ videoId: null }),
      );
      expect(updated.videoId).toBeNull();
    });

    it("trims challengeId and groupId on creation", async () => {
      const submission = await createValidSubmission({
        challengeId: "  challenge-123  ",
        groupId: "  group-456  ",
      });
      expect(submission.challengeId).toBe("challenge-123");
      expect(submission.groupId).toBe("group-456");
    });

    it("rejects submission with only whitespace challengeId", async () => {
      const result = await Effect.runPromise(
        Effect.either(
          ChallengeSubmission.create({
            challengeId: "   ",
            groupId: validGroupId,
          }),
        ),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
      }
    });

    it("rejects submission with only whitespace groupId", async () => {
      const result = await Effect.runPromise(
        Effect.either(
          ChallengeSubmission.create({
            challengeId: validChallengeId,
            groupId: "   ",
          }),
        ),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
      }
    });
  });
});
