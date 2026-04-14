import { describe, it, expect, beforeEach } from "bun:test";
import {
  submitVotesUseCase,
  type SubmitVotesInput,
  SubmitVotesValidationError,
  BatchAlreadyVotedError,
  InvalidVoteSetError,
  BatchVoteRepositoryError,
} from "./SubmitVotes";
import { ChallengeVote } from "@mirai-app/domain";
import { Effect, Either } from "effect";
import { ChallengeVoteRepositoryTag } from "../ports/ChallengeVoteRepository";

describe("[UNIT] submitVotesUseCase (Effect)", () => {
  const createMockVote = async (
    overrides?: Partial<{
      id: string;
      challengeId: string;
      submissionId: string;
      voterId: string;
      position: number;
      points: number;
    }>,
  ): Promise<ChallengeVote> => {
    return await Effect.runPromise(
      ChallengeVote.create({
        id: overrides?.id as any,
        challengeId: overrides?.challengeId ?? "challenge-123",
        submissionId: overrides?.submissionId ?? "submission-1",
        voterId: overrides?.voterId ?? "voter-123",
        position: overrides?.position ?? 1,
        points: overrides?.points ?? 30,
      }).pipe(Effect.orDie),
    );
  };

  const createMockRepo = (votes: ChallengeVote[]) => ({
    create: () => Effect.succeed(votes[0]),
    createMany: () => Effect.succeed(votes),
    findById: () => Effect.succeed(null),
    findByChallengeId: () => Effect.succeed([]),
    findByChallengeAndVoter: () => Effect.succeed([]),
    findBySubmissionId: () => Effect.succeed([]),
    hasVoted: () => Effect.succeed(false),
    hasVotedForPosition: () => Effect.succeed(false),
    getVotedPositions: () => Effect.succeed([]),
    delete: () => Effect.succeed(void 0),
    deleteByChallengeId: () => Effect.succeed(void 0),
  });

  describe("[UNIT] execute", () => {
    it("should submit multiple votes successfully", async () => {
      const mockVotes = await Promise.all([
        createMockVote({
          position: 1,
          submissionId: "submission-1",
          points: 30,
        }),
        createMockVote({
          position: 2,
          submissionId: "submission-2",
          points: 20,
        }),
        createMockVote({
          position: 3,
          submissionId: "submission-3",
          points: 10,
        }),
      ]);
      const mockRepo = createMockRepo(mockVotes);

      const input: SubmitVotesInput = {
        challengeId: "challenge-123",
        voterId: "voter-123",
        votes: [
          { submissionId: "submission-1", position: 1, points: 30 },
          { submissionId: "submission-2", position: 2, points: 20 },
          { submissionId: "submission-3", position: 3, points: 10 },
        ],
        requiredPositions: 3,
      };

      const result = await Effect.runPromise(
        submitVotesUseCase(input).pipe(
          Effect.provideService(ChallengeVoteRepositoryTag, mockRepo),
        ),
      );

      expect(result.totalVotesCast).toBe(3);
      expect(result.votes).toHaveLength(3);
      expect(result.votes[0]?.votePosition).toBe(1);
      expect(result.votes[1]?.votePosition).toBe(2);
      expect(result.votes[2]?.votePosition).toBe(3);
    });

    it("should return error when challengeId is empty", async () => {
      const mockRepo = createMockRepo([]);

      const input: SubmitVotesInput = {
        challengeId: "",
        voterId: "voter-123",
        votes: [
          { submissionId: "submission-1", position: 1, points: 30 },
          { submissionId: "submission-2", position: 2, points: 20 },
          { submissionId: "submission-3", position: 3, points: 10 },
        ],
        requiredPositions: 3,
      };

      const program = submitVotesUseCase(input).pipe(
        Effect.provideService(ChallengeVoteRepositoryTag, mockRepo),
      );

      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(SubmitVotesValidationError);
        expect(either.left.message).toBe("Challenge ID is required");
      }
    });

    it("should return error when voter has already voted", async () => {
      const mockRepo = {
        ...createMockRepo([]),
        hasVoted: () => Effect.succeed(true),
      };

      const input: SubmitVotesInput = {
        challengeId: "challenge-123",
        voterId: "voter-123",
        votes: [
          { submissionId: "submission-1", position: 1, points: 30 },
          { submissionId: "submission-2", position: 2, points: 20 },
          { submissionId: "submission-3", position: 3, points: 10 },
        ],
        requiredPositions: 3,
      };

      const program = submitVotesUseCase(input).pipe(
        Effect.provideService(ChallengeVoteRepositoryTag, mockRepo),
      );

      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(BatchAlreadyVotedError);
      }
    });

    it("should return error for duplicate positions", async () => {
      const mockRepo = createMockRepo([]);

      const input: SubmitVotesInput = {
        challengeId: "challenge-123",
        voterId: "voter-123",
        votes: [
          { submissionId: "submission-1", position: 1, points: 30 },
          { submissionId: "submission-2", position: 1, points: 20 },
        ],
        requiredPositions: 2,
      };

      const program = submitVotesUseCase(input).pipe(
        Effect.provideService(ChallengeVoteRepositoryTag, mockRepo),
      );

      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(InvalidVoteSetError);
      }
    });

    it("should return error for duplicate submissionIds", async () => {
      const mockRepo = createMockRepo([]);

      const input: SubmitVotesInput = {
        challengeId: "challenge-123",
        voterId: "voter-123",
        votes: [
          { submissionId: "submission-1", position: 1, points: 30 },
          { submissionId: "submission-1", position: 2, points: 20 },
        ],
        requiredPositions: 2,
      };

      const program = submitVotesUseCase(input).pipe(
        Effect.provideService(ChallengeVoteRepositoryTag, mockRepo),
      );

      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(InvalidVoteSetError);
      }
    });

    it("should return error for missing required positions", async () => {
      const mockRepo = createMockRepo([]);

      const input: SubmitVotesInput = {
        challengeId: "challenge-123",
        voterId: "voter-123",
        votes: [{ submissionId: "submission-1", position: 1, points: 30 }],
        requiredPositions: 3,
      };

      const program = submitVotesUseCase(input).pipe(
        Effect.provideService(ChallengeVoteRepositoryTag, mockRepo),
      );

      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(InvalidVoteSetError);
      }
    });

    it("should submit single vote with only required fields", async () => {
      const mockVote = await createMockVote({
        position: 1,
        submissionId: "submission-1",
        points: 30,
      });
      const mockRepo = createMockRepo([mockVote]);

      const input: SubmitVotesInput = {
        challengeId: "challenge-123",
        voterId: "voter-123",
        votes: [{ submissionId: "submission-1", position: 1, points: 30 }],
        requiredPositions: 1,
      };

      const result = await Effect.runPromise(
        submitVotesUseCase(input).pipe(
          Effect.provideService(ChallengeVoteRepositoryTag, mockRepo),
        ),
      );

      expect(result.totalVotesCast).toBe(1);
      expect(result.votes[0]?.votePosition).toBe(1);
    });
  });
});
