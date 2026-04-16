import { describe, it, expect } from "bun:test";
import {
  getSubmissionUseCase,
  type GetSubmissionInput,
  SubmissionNotFoundError,
} from "./get";
import { ChallengeSubmission, SubmissionId } from "@mirai-app/domain";
import { Effect, Either } from "effect";
import { ChallengeSubmissionGatewayTag } from "../../ports/submission/gateway";

describe("[UNIT] getSubmissionUseCase (Effect)", () => {
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

  const createMockRepo = (submission: ChallengeSubmission | null) => ({
    create: () => Effect.succeed(submission ?? createMockSubmission()),
    findById: () => Effect.succeed(submission),
    findByChallengeAndGroup: () => Effect.succeed(submission),
    findByChallengeId: () => Effect.succeed(submission ? [submission] : []),
    findByGroupId: () => Effect.succeed([]),
    findByStatus: () => Effect.succeed([]),
    findMany: () => Effect.succeed(submission ? [submission] : []),
    update: () => Effect.succeed(submission ?? createMockSubmission()),
    delete: () => Effect.succeed(void 0),
    existsForChallengeAndGroup: () => Effect.succeed(false),
    countByChallengeId: () => Effect.succeed(0),
    countByChallengeAndStatus: () => Effect.succeed(0),
  });

  describe("[UNIT] execute", () => {
    it("should return submission when found", async () => {
      const mockSubmission = await createMockSubmission({
        id: "submission-456",
        challengeId: "challenge-456",
        groupId: "group-456",
      });
      const mockRepo = createMockRepo(mockSubmission);

      const input: GetSubmissionInput = {
        submissionId: SubmissionId.unsafeCreate("submission-456"),
      };

      const result = await Effect.runPromise(
        getSubmissionUseCase(input).pipe(
          Effect.provideService(ChallengeSubmissionGatewayTag, mockRepo),
        ),
      );

      expect(result.id).toBe("submission-456");
      expect(result.challengeId).toBe("challenge-456");
      expect(result.groupId).toBe("group-456");
      expect(result.status).toBe("PENDING");
      expect(result.awardedPoints).toBe(0);
      expect(result.voteCount).toBe(0);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it("should return error when submission not found", async () => {
      const mockRepo = createMockRepo(null);

      const input: GetSubmissionInput = {
        submissionId: SubmissionId.unsafeCreate("non-existent"),
      };

      const program = getSubmissionUseCase(input).pipe(
        Effect.provideService(ChallengeSubmissionGatewayTag, mockRepo),
      );

      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(SubmissionNotFoundError);
      }
    });
  });
});
