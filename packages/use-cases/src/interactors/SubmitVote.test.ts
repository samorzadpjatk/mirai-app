import { describe, it, expect, beforeEach } from "bun:test";
import {
  submitVoteUseCase,
  type SubmitVoteInput,
  SubmitVoteValidationError,
  VotePositionTakenError,
  AlreadyVotedError,
  VoteRepositoryError,
} from "./SubmitVote";
import { ChallengeVote } from "@mirai-app/domain";
import { Effect, Either } from "effect";
import { ChallengeVoteRepositoryTag } from "../ports/ChallengeVoteRepository";

describe("[UNIT] submitVoteUseCase (Effect)", () => {
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
        submissionId: overrides?.submissionId ?? "submission-123",
        voterId: overrides?.voterId ?? "voter-123",
        position: overrides?.position ?? 1,
        points: overrides?.points ?? 10,
      }).pipe(Effect.orDie),
    );
  };

  const createMockRepo = (overrides?: {
    create?: () => Effect.Effect<ChallengeVote, never, never>;
    hasVoted?: () => Effect.Effect<boolean, never, never>;
    hasVotedForPosition?: () => Effect.Effect<boolean, never, never>;
    getVotedPositions?: () => Effect.Effect<number[], never, never>;
  }) => ({
    create:
      overrides?.create ??
      (() => createMockVote().then((v) => Effect.succeed(v))),
    createMany: () => Effect.succeed([]),
    findById: () => Effect.succeed(null),
    findByChallengeId: () => Effect.succeed([]),
    findByChallengeAndVoter: () => Effect.succeed([]),
    findBySubmissionId: () => Effect.succeed([]),
    hasVoted: overrides?.hasVoted ?? (() => Effect.succeed(false)),
    hasVotedForPosition:
      overrides?.hasVotedForPosition ?? (() => Effect.succeed(false)),
    getVotedPositions:
      overrides?.getVotedPositions ?? (() => Effect.succeed([])),
    delete: () => Effect.succeed(void 0),
    deleteByChallengeId: () => Effect.succeed(void 0),
  });

  describe("execute", () => {
    it("should submit vote successfully", async () => {
      const mockVote = await createMockVote();
      const mockRepo = createMockRepo({
        create: () => Effect.succeed(mockVote),
        hasVoted: () => Effect.succeed(false),
        hasVotedForPosition: () => Effect.succeed(false),
      });

      const input: SubmitVoteInput = {
        challengeId: "challenge-123",
        submissionId: "submission-123",
        voterId: "voter-123",
        position: 1,
        points: 10,
        normalizedWeight: 1.0,
      };

      const result = await Effect.runPromise(
        submitVoteUseCase(input).pipe(
          Effect.provideService(ChallengeVoteRepositoryTag, mockRepo),
        ),
      );

      expect(result.challengeId).toBe("challenge-123");
      expect(result.voterId).toBe("voter-123");
      expect(result.submissionId).toBe("submission-123");
      expect(result.votePosition).toBe(1);
      expect(result.votePoints).toBe(10);
      expect(result.normalizedWeight).toBe(1.0);
      expect(result.votedAt).toBeInstanceOf(Date);
      expect(result.id).toBeDefined();
    });

    it("should return error when challengeId is empty", async () => {
      const mockRepo = createMockRepo();

      const input: SubmitVoteInput = {
        challengeId: "",
        submissionId: "submission-123",
        voterId: "voter-123",
        position: 1,
        points: 10,
        normalizedWeight: 1.0,
      };

      const program = submitVoteUseCase(input).pipe(
        Effect.provideService(ChallengeVoteRepositoryTag, mockRepo),
      );

      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(SubmitVoteValidationError);
        expect(either.left.message).toBe("challengeId is required");
      }
    });

    it("should return error when voter has already voted", async () => {
      const mockRepo = createMockRepo({
        hasVoted: () => Effect.succeed(true),
      });

      const input: SubmitVoteInput = {
        challengeId: "challenge-123",
        submissionId: "submission-456",
        voterId: "voter-123",
        position: 2,
        points: 5,
        normalizedWeight: 1.0,
      };

      const program = submitVoteUseCase(input).pipe(
        Effect.provideService(ChallengeVoteRepositoryTag, mockRepo),
      );

      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(AlreadyVotedError);
      }
    });

    it("should allow partial voting when allowPartial is true", async () => {
      const mockVote = await createMockVote({ position: 1 });
      const mockRepo = createMockRepo({
        create: () => Effect.succeed(mockVote),
        hasVoted: () => Effect.succeed(true),
        hasVotedForPosition: () => Effect.succeed(false),
        getVotedPositions: () => Effect.succeed([2]),
      });

      const input: SubmitVoteInput = {
        challengeId: "challenge-123",
        submissionId: "submission-123",
        voterId: "voter-123",
        position: 1,
        points: 10,
        normalizedWeight: 1.0,
        allowPartial: true,
      };

      const result = await Effect.runPromise(
        submitVoteUseCase(input).pipe(
          Effect.provideService(ChallengeVoteRepositoryTag, mockRepo),
        ),
      );

      expect(result.votePosition).toBe(1);
    });

    it("should return error for invalid position", async () => {
      const mockRepo = createMockRepo();

      const input: SubmitVoteInput = {
        challengeId: "challenge-123",
        submissionId: "submission-123",
        voterId: "voter-123",
        position: 5,
        points: 10,
        normalizedWeight: 1.0,
      };

      const program = submitVoteUseCase(input).pipe(
        Effect.provideService(ChallengeVoteRepositoryTag, mockRepo),
      );

      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(SubmitVoteValidationError);
        expect(either.left.message).toBe("position must be between 1 and 3");
      }
    });

    it("should return error when position is already taken", async () => {
      const mockRepo = createMockRepo({
        hasVoted: () => Effect.succeed(true),
        hasVotedForPosition: () => Effect.succeed(true),
        getVotedPositions: () => Effect.succeed([1]),
      });

      const input: SubmitVoteInput = {
        challengeId: "challenge-123",
        submissionId: "submission-456",
        voterId: "voter-123",
        position: 1,
        points: 10,
        normalizedWeight: 1.0,
        allowPartial: true,
      };

      const program = submitVoteUseCase(input).pipe(
        Effect.provideService(ChallengeVoteRepositoryTag, mockRepo),
      );

      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(VotePositionTakenError);
      }
    });
  });
});
