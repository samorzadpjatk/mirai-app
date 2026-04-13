import { describe, it, expect, beforeEach } from "bun:test";
import {
  deleteSubmissionUseCase,
  type DeleteSubmissionInput,
  SubmissionDeleteNotFoundError,
  SubmissionDeleteNotAllowedError,
  DeleteSubmissionRepositoryError,
} from "./DeleteSubmission";
import { ChallengeSubmission, SubmissionId } from "@mirai-app/domain";
import { Effect, Either } from "effect";
import { ChallengeSubmissionRepositoryTag } from "../ports/ChallengeSubmissionRepository";

describe("[UNIT] deleteSubmissionUseCase (Effect)", () => {
  const createMockSubmission = async (
    overrides?: Partial<{
      id: SubmissionId;
      status: string;
    }>,
  ): Promise<ChallengeSubmission> => {
    return await Effect.runPromise(
      ChallengeSubmission.create({
        id: overrides?.id ?? ("submission-123" as SubmissionId),
        challengeId: "challenge-123",
        groupId: "group-123",
        imageIds: [],
        videoId: null,
        textContent: "Test content",
        latitude: null,
        longitude: null,
      }).pipe(Effect.orDie),
    );
  };

  const createMockRepo = (
    existing: ChallengeSubmission | null,
    deleted: boolean = false,
  ) => ({
    create: () =>
      Effect.promise(async () => existing ?? (await createMockSubmission())),
    findById: () => Effect.succeed(existing),
    findByChallengeAndGroup: () => Effect.succeed(existing),
    findByChallengeId: () => Effect.succeed(existing ? [existing] : []),
    findByGroupId: () => Effect.succeed([]),
    findByStatus: () => Effect.succeed([]),
    findMany: () => Effect.succeed(existing ? [existing] : []),
    update: () =>
      Effect.promise(async () => existing ?? (await createMockSubmission())),
    delete: () => Effect.succeed(deleted ? void 0 : undefined),
    existsForChallengeAndGroup: () => Effect.succeed(false),
    countByChallengeId: () => Effect.succeed(0),
    countByChallengeAndStatus: () => Effect.succeed(0),
  });

  describe("execute", () => {
    it("should delete submission successfully when pending", async () => {
      const existing = await createMockSubmission({
        id: "submission-456" as SubmissionId,
        status: "PENDING",
      });
      const mockRepo = createMockRepo(existing, true);

      const input: DeleteSubmissionInput = {
        submissionId: SubmissionId.unsafeCreate("submission-456"),
      };

      const result = await Effect.runPromise(
        deleteSubmissionUseCase(input).pipe(
          Effect.provideService(ChallengeSubmissionRepositoryTag, mockRepo),
        ),
      );

      expect(result.success).toBe(true);
    });

    it("should return error when submission not found", async () => {
      const mockRepo = createMockRepo(null);

      const input: DeleteSubmissionInput = {
        submissionId: SubmissionId.unsafeCreate("non-existent"),
      };

      const program = deleteSubmissionUseCase(input).pipe(
        Effect.provideService(ChallengeSubmissionRepositoryTag, mockRepo),
      );

      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(SubmissionDeleteNotFoundError);
      }
    });

    it("should return error when submission is already approved", async () => {
      const approved = await Effect.runPromise(
        ChallengeSubmission.create({
          id: "submission-approved" as SubmissionId,
          challengeId: "challenge-123",
          groupId: "group-123",
          imageIds: [],
          videoId: null,
          textContent: "Test content",
          latitude: null,
          longitude: null,
        })
          .pipe(
            Effect.flatMap((s) =>
              s.approve({ reviewedById: "moderator-123", awardedPoints: 100 }),
            ),
          )
          .pipe(Effect.orDie),
      );
      const mockRepo = createMockRepo(approved);

      const input: DeleteSubmissionInput = {
        submissionId: SubmissionId.unsafeCreate("submission-approved"),
      };

      const program = deleteSubmissionUseCase(input).pipe(
        Effect.provideService(ChallengeSubmissionRepositoryTag, mockRepo),
      );

      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(SubmissionDeleteNotAllowedError);
        expect(either.left.message).toBe(
          "Cannot delete an approved or rejected submission",
        );
      }
    });
  });
});
