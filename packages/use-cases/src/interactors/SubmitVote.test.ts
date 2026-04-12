import { describe, it, expect, beforeEach } from "bun:test";
import {
  submitVoteUseCase,
  type SubmitVoteInput,
  SubmitVoteValidationError,
  VotePositionTakenError,
  AlreadyVotedError,
  VoteRepositoryError,
} from "./SubmitVote";
import { ChallengeVote, ValidationError } from "@mirai-app/domain";
import { Effect, Either } from "effect";
import { ChallengeVoteRepositoryTag } from "../ports/ChallengeVoteRepository";
import { InMemoryChallengeVoteRepository } from "@mirai-app/adapters/gateways/in-memory";

describe("[UNIT] submitVoteUseCase (Effect)", () => {
  let repo: InMemoryChallengeVoteRepository;

  beforeEach(() => {
    repo = new InMemoryChallengeVoteRepository();
  });

  // Helper to create a valid vote input
  const createValidInput = (): SubmitVoteInput => ({
    challengeId: "challenge-123",
    submissionId: "submission-123",
    voterId: "voter-123",
    position: 1,
    points: 10,
    normalizedWeight: 1.0,
  });

  // Helper to run use case with repository
  const runUseCase = async (input: SubmitVoteInput) => {
    const program = submitVoteUseCase(input).pipe(
      Effect.provideService(ChallengeVoteRepositoryTag, {
        create: (vote: ChallengeVote) =>
          Effect.promise(() => repo.create(vote)),
        createMany: (votes: ChallengeVote[]) =>
          Effect.promise(() => repo.createMany(votes)),
        findById: (id: string) => Effect.promise(() => repo.findById(id)),
        findByChallengeId: (challengeId: string) =>
          Effect.promise(() => repo.findByChallengeId(challengeId)),
        findByChallengeAndVoter: (challengeId: string, voterId: string) =>
          Effect.promise(() =>
            repo.findByChallengeAndVoter(challengeId, voterId),
          ),
        findBySubmissionId: (submissionId: string) =>
          Effect.promise(() => repo.findBySubmissionId(submissionId)),
        hasVoted: (challengeId: string, voterId: string) =>
          Effect.promise(() => repo.hasVoted(challengeId, voterId)),
        hasVotedForPosition: (
          challengeId: string,
          voterId: string,
          position: number,
        ) =>
          Effect.promise(() =>
            repo.hasVotedForPosition(challengeId, voterId, position),
          ),
        getVotedPositions: (challengeId: string, voterId: string) =>
          Effect.promise(() => repo.getVotedPositions(challengeId, voterId)),
        delete: (id: string) => Effect.promise(() => repo.delete(id)),
        deleteByChallengeId: (challengeId: string) =>
          Effect.promise(() => repo.deleteByChallengeId(challengeId)),
      }),
    );
    return await Effect.runPromise(program);
  };

  describe("execute", () => {
    it("should submit vote successfully", async () => {
      // Arrange
      const input = createValidInput();

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.challengeId).toBe("challenge-123");
      expect(result.voterId).toBe("voter-123");
      expect(result.submissionId).toBe("submission-123");
      expect(result.votePosition).toBe(1);
      expect(result.votePoints).toBe(10);
      expect(result.normalizedWeight).toBe(1.0);
      expect(result.votedAt).toBeInstanceOf(Date);
      expect(result.id).toBeDefined();

      // Verify vote was actually stored
      const stored = await repo.findByChallengeId("challenge-123");
      expect(stored).toHaveLength(1);
      expect(stored[0]?.voterId).toBe("voter-123");
    });

    it("should return error when challengeId is empty", async () => {
      // Arrange
      const input = { ...createValidInput(), challengeId: "" };

      // Act & Assert
      const program = submitVoteUseCase(input).pipe(
        Effect.provideService(ChallengeVoteRepositoryTag, {
          create: (vote: ChallengeVote) =>
            Effect.promise(() => repo.create(vote)),
          createMany: (votes: ChallengeVote[]) =>
            Effect.promise(() => repo.createMany(votes)),
          findById: (id: string) => Effect.promise(() => repo.findById(id)),
          findByChallengeId: (challengeId: string) =>
            Effect.promise(() => repo.findByChallengeId(challengeId)),
          findByChallengeAndVoter: (challengeId: string, voterId: string) =>
            Effect.promise(() =>
              repo.findByChallengeAndVoter(challengeId, voterId),
            ),
          findBySubmissionId: (submissionId: string) =>
            Effect.promise(() => repo.findBySubmissionId(submissionId)),
          hasVoted: (challengeId: string, voterId: string) =>
            Effect.promise(() => repo.hasVoted(challengeId, voterId)),
          hasVotedForPosition: (
            challengeId: string,
            voterId: string,
            position: number,
          ) =>
            Effect.promise(() =>
              repo.hasVotedForPosition(challengeId, voterId, position),
            ),
          getVotedPositions: (challengeId: string, voterId: string) =>
            Effect.promise(() => repo.getVotedPositions(challengeId, voterId)),
          delete: (id: string) => Effect.promise(() => repo.delete(id)),
          deleteByChallengeId: (challengeId: string) =>
            Effect.promise(() => repo.deleteByChallengeId(challengeId)),
        }),
      );

      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(SubmitVoteValidationError);
        expect(either.left.message).toBe("challengeId is required");
      }
    });

    it("should return error when voter has already voted", async () => {
      // Arrange - create an existing vote
      const existingVote = ChallengeVote.create({
        id: "existing-vote",
        challengeId: "challenge-123",
        submissionId: "submission-456",
        voterId: "voter-123",
        position: 2,
        points: 5,
        weight: 1.0,
      });
      if (existingVote.kind === "err") {
        throw new Error("Failed to create test vote");
      }
      await repo.create(existingVote.value);

      const input = createValidInput();

      // Act & Assert
      const program = submitVoteUseCase(input).pipe(
        Effect.provideService(ChallengeVoteRepositoryTag, {
          create: (vote: ChallengeVote) =>
            Effect.promise(() => repo.create(vote)),
          createMany: (votes: ChallengeVote[]) =>
            Effect.promise(() => repo.createMany(votes)),
          findById: (id: string) => Effect.promise(() => repo.findById(id)),
          findByChallengeId: (challengeId: string) =>
            Effect.promise(() => repo.findByChallengeId(challengeId)),
          findByChallengeAndVoter: (challengeId: string, voterId: string) =>
            Effect.promise(() =>
              repo.findByChallengeAndVoter(challengeId, voterId),
            ),
          findBySubmissionId: (submissionId: string) =>
            Effect.promise(() => repo.findBySubmissionId(submissionId)),
          hasVoted: (challengeId: string, voterId: string) =>
            Effect.promise(() => repo.hasVoted(challengeId, voterId)),
          hasVotedForPosition: (
            challengeId: string,
            voterId: string,
            position: number,
          ) =>
            Effect.promise(() =>
              repo.hasVotedForPosition(challengeId, voterId, position),
            ),
          getVotedPositions: (challengeId: string, voterId: string) =>
            Effect.promise(() => repo.getVotedPositions(challengeId, voterId)),
          delete: (id: string) => Effect.promise(() => repo.delete(id)),
          deleteByChallengeId: (challengeId: string) =>
            Effect.promise(() => repo.deleteByChallengeId(challengeId)),
        }),
      );

      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(AlreadyVotedError);
      }
    });

    it("should allow partial voting when allowPartial is true", async () => {
      // Arrange - create an existing vote for position 2
      const existingVote = ChallengeVote.create({
        id: "existing-vote",
        challengeId: "challenge-123",
        submissionId: "submission-456",
        voterId: "voter-123",
        position: 2,
        points: 5,
        weight: 1.0,
      });
      if (existingVote.kind === "err") {
        throw new Error("Failed to create test vote");
      }
      await repo.create(existingVote.value);

      // Act - vote for position 1 (partial voting)
      const input: SubmitVoteInput = {
        ...createValidInput(),
        position: 1,
        allowPartial: true,
      };

      const result = await runUseCase(input);

      // Assert
      expect(result.votePosition).toBe(1);

      // Verify both votes are stored
      const stored = await repo.findByChallengeAndVoter(
        "challenge-123",
        "voter-123",
      );
      expect(stored).toHaveLength(2);
    });

    it("should return error for invalid position", async () => {
      // Arrange
      const input = { ...createValidInput(), position: 5 };

      // Act & Assert
      const program = submitVoteUseCase(input).pipe(
        Effect.provideService(ChallengeVoteRepositoryTag, {
          create: (vote: ChallengeVote) =>
            Effect.promise(() => repo.create(vote)),
          createMany: (votes: ChallengeVote[]) =>
            Effect.promise(() => repo.createMany(votes)),
          findById: (id: string) => Effect.promise(() => repo.findById(id)),
          findByChallengeId: (challengeId: string) =>
            Effect.promise(() => repo.findByChallengeId(challengeId)),
          findByChallengeAndVoter: (challengeId: string, voterId: string) =>
            Effect.promise(() =>
              repo.findByChallengeAndVoter(challengeId, voterId),
            ),
          findBySubmissionId: (submissionId: string) =>
            Effect.promise(() => repo.findBySubmissionId(submissionId)),
          hasVoted: (challengeId: string, voterId: string) =>
            Effect.promise(() => repo.hasVoted(challengeId, voterId)),
          hasVotedForPosition: (
            challengeId: string,
            voterId: string,
            position: number,
          ) =>
            Effect.promise(() =>
              repo.hasVotedForPosition(challengeId, voterId, position),
            ),
          getVotedPositions: (challengeId: string, voterId: string) =>
            Effect.promise(() => repo.getVotedPositions(challengeId, voterId)),
          delete: (id: string) => Effect.promise(() => repo.delete(id)),
          deleteByChallengeId: (challengeId: string) =>
            Effect.promise(() => repo.deleteByChallengeId(challengeId)),
        }),
      );

      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(SubmitVoteValidationError);
        expect(either.left.message).toBe("position must be between 1 and 3");
      }
    });

    it("should return error when position is already taken", async () => {
      // Arrange - create an existing vote for position 1
      const existingVote = ChallengeVote.create({
        id: "existing-vote",
        challengeId: "challenge-123",
        submissionId: "submission-456",
        voterId: "voter-123",
        position: 1,
        points: 10,
        weight: 1.0,
      });
      if (existingVote.kind === "err") {
        throw new Error("Failed to create test vote");
      }
      await repo.create(existingVote.value);

      const input = { ...createValidInput(), allowPartial: true };

      // Act & Assert
      const program = submitVoteUseCase(input).pipe(
        Effect.provideService(ChallengeVoteRepositoryTag, {
          create: (vote: ChallengeVote) =>
            Effect.promise(() => repo.create(vote)),
          createMany: (votes: ChallengeVote[]) =>
            Effect.promise(() => repo.createMany(votes)),
          findById: (id: string) => Effect.promise(() => repo.findById(id)),
          findByChallengeId: (challengeId: string) =>
            Effect.promise(() => repo.findByChallengeId(challengeId)),
          findByChallengeAndVoter: (challengeId: string, voterId: string) =>
            Effect.promise(() =>
              repo.findByChallengeAndVoter(challengeId, voterId),
            ),
          findBySubmissionId: (submissionId: string) =>
            Effect.promise(() => repo.findBySubmissionId(submissionId)),
          hasVoted: (challengeId: string, voterId: string) =>
            Effect.promise(() => repo.hasVoted(challengeId, voterId)),
          hasVotedForPosition: (
            challengeId: string,
            voterId: string,
            position: number,
          ) =>
            Effect.promise(() =>
              repo.hasVotedForPosition(challengeId, voterId, position),
            ),
          getVotedPositions: (challengeId: string, voterId: string) =>
            Effect.promise(() => repo.getVotedPositions(challengeId, voterId)),
          delete: (id: string) => Effect.promise(() => repo.delete(id)),
          deleteByChallengeId: (challengeId: string) =>
            Effect.promise(() => repo.deleteByChallengeId(challengeId)),
        }),
      );

      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(VotePositionTakenError);
      }
    });
  });
});
