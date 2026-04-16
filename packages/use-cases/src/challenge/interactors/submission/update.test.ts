import { describe, it, expect, beforeEach } from "bun:test";
import {
  updateSubmissionUseCase,
  type UpdateSubmissionInput,
  SubmissionUpdateNotFoundError,
  SubmissionUpdateValidationError,
  InvalidReviewActionError,
  UpdateSubmissionRepositoryError,
} from "./update";
import { ChallengeSubmission, SubmissionId } from "@mirai-app/domain";
import { Effect, Either } from "effect";
import { ChallengeSubmissionGatewayTag } from "../../ports/submission/gateway";

describe("[UNIT] updateSubmissionUseCase (Effect)", () => {
  const createMockSubmission = async (
    overrides?: Partial<{
      id: string;
      challengeId: string;
      groupId: string;
      status: string;
    }>,
  ): Promise<ChallengeSubmission> => {
    return await Effect.runPromise(
      ChallengeSubmission.create({
        id: overrides?.id ?? "submission-123",
        challengeId: overrides?.challengeId ?? "challenge-123",
        groupId: overrides?.groupId ?? "group-123",
        imageIds: ["image-1"],
        videoId: null,
        textContent: "Test content",
        latitude: 52.52,
        longitude: 13.405,
      }).pipe(Effect.orDie),
    );
  };

  const createMockRepo = (
    existing: ChallengeSubmission | null,
    updated: ChallengeSubmission,
  ) => ({
    create: () => Effect.succeed(existing ?? updated),
    findById: () => Effect.succeed(existing),
    findByChallengeAndGroup: () => Effect.succeed(existing),
    findByChallengeId: () => Effect.succeed(existing ? [existing] : []),
    findByGroupId: () => Effect.succeed([]),
    findByStatus: () => Effect.succeed([]),
    findMany: () => Effect.succeed(existing ? [existing] : []),
    update: () => Effect.succeed(updated),
    delete: () => Effect.succeed(void 0),
    existsForChallengeAndGroup: () => Effect.succeed(false),
    countByChallengeId: () => Effect.succeed(0),
    countByChallengeAndStatus: () => Effect.succeed(0),
  });

  describe("[UNIT] execute", () => {
    it("should update submission content successfully", async () => {
      const existing = await createMockSubmission({
        id: "submission-456",
      });
      const updated = await Effect.runPromise(
        existing
          .updateContent({
            textContent: "Updated content",
            latitude: 48.8566,
            longitude: 2.3522,
          })
          .pipe(Effect.orDie),
      );
      const mockRepo = createMockRepo(existing, updated);

      const input: UpdateSubmissionInput = {
        submissionId: SubmissionId.unsafeCreate("submission-456"),
        textContent: "Updated content",
        latitude: 48.8566,
        longitude: 2.3522,
      };

      const result = await Effect.runPromise(
        updateSubmissionUseCase(input).pipe(
          Effect.provideService(ChallengeSubmissionGatewayTag, mockRepo),
        ),
      );

      expect(result.id).toBe("submission-456");
      expect(result.textContent).toBe("Updated content");
      expect(result.latitude).toBe(48.8566);
      expect(result.longitude).toBe(2.3522);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it("should approve submission successfully", async () => {
      const existing = await createMockSubmission({
        id: "submission-456",
      });
      const approved = await Effect.runPromise(
        existing
          .approve({
            reviewedById: "moderator-123",
            awardedPoints: 100,
            bonusPoints: 50,
            ranking: 1,
          })
          .pipe(Effect.orDie),
      );
      const mockRepo = createMockRepo(existing, approved);

      const input: UpdateSubmissionInput = {
        submissionId: SubmissionId.unsafeCreate("submission-456"),
        reviewAction: "APPROVE",
        reviewedById: "moderator-123",
        awardedPoints: 100,
        bonusPoints: 50,
        ranking: 1,
      };

      const result = await Effect.runPromise(
        updateSubmissionUseCase(input).pipe(
          Effect.provideService(ChallengeSubmissionGatewayTag, mockRepo),
        ),
      );

      expect(result.status).toBe("APPROVED");
      expect(result.awardedPoints).toBe(100);
      expect(result.bonusPoints).toBe(50);
      expect(result.ranking).toBe(1);
      expect(result.reviewedById).toBe("moderator-123");
      expect(result.reviewedAt).toBeInstanceOf(Date);
    });

    it("should reject submission successfully", async () => {
      const existing = await createMockSubmission({
        id: "submission-456",
      });
      const rejected = await Effect.runPromise(
        existing
          .reject({
            reviewedById: "moderator-123",
            reason: "Content does not meet requirements",
          })
          .pipe(Effect.orDie),
      );
      const mockRepo = createMockRepo(existing, rejected);

      const input: UpdateSubmissionInput = {
        submissionId: SubmissionId.unsafeCreate("submission-456"),
        reviewAction: "REJECT",
        reviewedById: "moderator-123",
        rejectionReason: "Content does not meet requirements",
      };

      const result = await Effect.runPromise(
        updateSubmissionUseCase(input).pipe(
          Effect.provideService(ChallengeSubmissionGatewayTag, mockRepo),
        ),
      );

      expect(result.status).toBe("REJECTED");
      expect(result.rejectionReason).toBe("Content does not meet requirements");
      expect(result.reviewedById).toBe("moderator-123");
      expect(result.reviewedAt).toBeInstanceOf(Date);
    });

    it("should return error when submission not found", async () => {
      const mockRepo = createMockRepo(null, await createMockSubmission());

      const input: UpdateSubmissionInput = {
        submissionId: SubmissionId.unsafeCreate("non-existent"),
        textContent: "Updated content",
      };

      const program = updateSubmissionUseCase(input).pipe(
        Effect.provideService(ChallengeSubmissionGatewayTag, mockRepo),
      );

      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(SubmissionUpdateNotFoundError);
      }
    });

    it("should return error for invalid review action", async () => {
      const existing = await createMockSubmission({
        id: "submission-456",
      });
      const mockRepo = createMockRepo(existing, existing);

      const input: UpdateSubmissionInput = {
        submissionId: SubmissionId.unsafeCreate("submission-456"),
        reviewAction: "INVALID" as any,
      };

      const program = updateSubmissionUseCase(input).pipe(
        Effect.provideService(ChallengeSubmissionGatewayTag, mockRepo),
      );

      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(InvalidReviewActionError);
      }
    });
  });
});
