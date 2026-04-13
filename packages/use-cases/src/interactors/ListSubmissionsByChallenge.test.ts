import { describe, it, expect, beforeEach } from "bun:test";
import {
  listSubmissionsByChallengeUseCase,
  type ListSubmissionsByChallengeInput,
  ListSubmissionsRepositoryError,
} from "./ListSubmissionsByChallenge";
import { ChallengeSubmission, SubmissionId } from "@mirai-app/domain";
import { Effect, Either } from "effect";
import { ChallengeSubmissionRepositoryTag } from "../ports/ChallengeSubmissionRepository";

describe("[UNIT] listSubmissionsByChallengeUseCase (Effect)", () => {
  const createMockSubmission = async (
    overrides?: Partial<{
      id: string;
      challengeId: string;
      groupId: string;
      voteScore: number;
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
    submissions: ChallengeSubmission[],
    findManyResult: ChallengeSubmission[] = submissions,
  ) => ({
    create: () => Effect.succeed(submissions[0] ?? createMockSubmission()),
    findById: () => Effect.succeed(null),
    findByChallengeAndGroup: () => Effect.succeed(null),
    findByChallengeId: () => Effect.succeed(submissions),
    findByGroupId: () => Effect.succeed([]),
    findByStatus: () => Effect.succeed([]),
    findMany: () => Effect.succeed(findManyResult),
    update: () => Effect.succeed(submissions[0] ?? createMockSubmission()),
    delete: () => Effect.succeed(void 0),
    existsForChallengeAndGroup: () => Effect.succeed(false),
    countByChallengeId: () => Effect.succeed(submissions.length),
    countByChallengeAndStatus: () => Effect.succeed(submissions.length),
  });

  describe("execute", () => {
    it("should list submissions for a challenge", async () => {
      const mockSubmissions = await Promise.all([
        createMockSubmission({
          id: "submission-1",
          challengeId: "challenge-123",
        }),
        createMockSubmission({
          id: "submission-2",
          challengeId: "challenge-123",
          groupId: "group-456",
        }),
      ]);
      const mockRepo = createMockRepo(mockSubmissions);

      const input: ListSubmissionsByChallengeInput = {
        challengeId: "challenge-123",
      };

      const result = await Effect.runPromise(
        listSubmissionsByChallengeUseCase(input).pipe(
          Effect.provideService(ChallengeSubmissionRepositoryTag, mockRepo),
        ),
      );

      expect(result.submissions).toHaveLength(2);
      expect(result.totalCount).toBe(2);
      expect(result.submissions[0].challengeId).toBe("challenge-123");
    });

    it("should use default sorting options", async () => {
      const mockSubmissions = await Promise.all([
        createMockSubmission({ id: "submission-1" }),
        createMockSubmission({ id: "submission-2", groupId: "group-456" }),
      ]);
      const mockRepo = createMockRepo(mockSubmissions);

      const input: ListSubmissionsByChallengeInput = {
        challengeId: "challenge-123",
      };

      const result = await Effect.runPromise(
        listSubmissionsByChallengeUseCase(input).pipe(
          Effect.provideService(ChallengeSubmissionRepositoryTag, mockRepo),
        ),
      );

      expect(result.submissions).toHaveLength(2);
      expect(result.submissions[0].voteScore).toBe(0);
      expect(result.submissions[1].voteScore).toBe(0);
    });

    it("should sort by createdAt when specified", async () => {
      const mockRepo = createMockRepo([]);

      const input: ListSubmissionsByChallengeInput = {
        challengeId: "challenge-123",
        orderBy: "createdAt",
        orderDirection: "asc",
      };

      const result = await Effect.runPromise(
        listSubmissionsByChallengeUseCase(input).pipe(
          Effect.provideService(ChallengeSubmissionRepositoryTag, mockRepo),
        ),
      );

      expect(result.submissions).toHaveLength(0);
      expect(result.totalCount).toBe(0);
    });

    it("should apply pagination options", async () => {
      const mockSubmissions = await Promise.all([
        createMockSubmission({
          id: "submission-1",
          challengeId: "challenge-123",
        }),
        createMockSubmission({
          id: "submission-2",
          challengeId: "challenge-123",
        }),
        createMockSubmission({
          id: "submission-3",
          challengeId: "challenge-123",
        }),
      ]);
      const paginatedResults = mockSubmissions.slice(1, 3);
      const mockRepo = createMockRepo(mockSubmissions, paginatedResults);

      const input: ListSubmissionsByChallengeInput = {
        challengeId: "challenge-123",
        limit: 2,
        offset: 1,
      };

      const result = await Effect.runPromise(
        listSubmissionsByChallengeUseCase(input).pipe(
          Effect.provideService(ChallengeSubmissionRepositoryTag, mockRepo),
        ),
      );

      expect(result.submissions).toHaveLength(2);
      expect(result.totalCount).toBe(3);
    });

    it("should return empty list when no submissions exist", async () => {
      const mockRepo = createMockRepo([]);

      const input: ListSubmissionsByChallengeInput = {
        challengeId: "challenge-empty",
      };

      const result = await Effect.runPromise(
        listSubmissionsByChallengeUseCase(input).pipe(
          Effect.provideService(ChallengeSubmissionRepositoryTag, mockRepo),
        ),
      );

      expect(result.submissions).toHaveLength(0);
      expect(result.totalCount).toBe(0);
    });
  });
});
