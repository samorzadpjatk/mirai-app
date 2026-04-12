import { describe, it, expect, beforeEach } from "bun:test";
import {
  createChallengeVoteUseCase,
  type CreateChallengeVoteInput,
  ChallengeVoteCreationError,
  ChallengeVoteAlreadyExistsError,
} from "./CreateChallengeVote";
import { ChallengeVote } from "@mirai-app/domain";
import { Effect, Either } from "effect";
import { ChallengeVoteRepositoryTag } from "../ports/ChallengeVoteRepository";
import { InMemoryChallengeVoteRepository } from "@mirai-app/adapters/gateways/in-memory";

describe("[UNIT] createChallengeVoteUseCase (Effect)", () => {
  let repo: InMemoryChallengeVoteRepository;

  beforeEach(() => {
    repo = new InMemoryChallengeVoteRepository();
  });

  // Helper to create a valid vote input
  const createValidInput = (): CreateChallengeVoteInput => ({
    challengeId: "challenge-123",
    submissionId: "submission-456",
    voterId: "voter-789",
    position: 1,
  });

  // Helper to run use case with repository
  const runUseCase = async (input: CreateChallengeVoteInput) => {
    const program = createChallengeVoteUseCase(input).pipe(
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
    it("should create vote with valid input", async () => {
      // Arrange
      const input = createValidInput();

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.challengeId).toBe("challenge-123");
      expect(result.submissionId).toBe("submission-456");
      expect(result.voterId).toBe("voter-789");
      expect(result.position).toBe(1);
      expect(result.points).toBe(3); // 4 - position
      expect(result.weight).toBe(1.0);
      expect(result.votedAt).toBeInstanceOf(Date);

      // Verify vote was actually stored
      const stored = await repo.findByChallengeId("challenge-123");
      expect(stored).toHaveLength(1);
      expect(stored[0]?.submissionId).toBe("submission-456");
    });

    it("should create vote with custom points and weight", async () => {
      // Arrange
      const input: CreateChallengeVoteInput = {
        challengeId: "challenge-123",
        submissionId: "submission-456",
        voterId: "voter-789",
        position: 2,
        points: 10,
        weight: 1.5,
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.points).toBe(10);
      expect(result.weight).toBe(1.5);

      // Verify stored vote
      const stored = await repo.findByChallengeId("challenge-123");
      expect(stored).toHaveLength(1);
      expect(stored[0]?.points).toBe(10);
      expect(stored[0]?.weight.value).toBe(1.5);
    });

    it("should fail when voter already voted for this position", async () => {
      // Arrange - Create an existing vote
      const existingVote = await Effect.runPromise(
        ChallengeVote.create({
          challengeId: "challenge-123",
          submissionId: "submission-111",
          voterId: "voter-789",
          position: 1, // Same position
        }),
      );
      await repo.create(existingVote);

      // Try to create another vote for same position
      const input: CreateChallengeVoteInput = {
        challengeId: "challenge-123",
        submissionId: "submission-456",
        voterId: "voter-789",
        position: 1, // Same position as existing
      };

      // Act
      const program = createChallengeVoteUseCase(input).pipe(
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

      // Act & Assert
      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(ChallengeVoteAlreadyExistsError);
      }
    });

    it("should allow different positions for same voter", async () => {
      // Arrange - Create an existing vote for position 1
      const existingVote = await Effect.runPromise(
        ChallengeVote.create({
          challengeId: "challenge-123",
          submissionId: "submission-111",
          voterId: "voter-789",
          position: 1,
        }),
      );
      await repo.create(existingVote);

      // Try to create vote for position 2
      const input: CreateChallengeVoteInput = {
        challengeId: "challenge-123",
        submissionId: "submission-456",
        voterId: "voter-789",
        position: 2, // Different position
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.position).toBe(2);

      // Verify both votes stored
      const stored = await repo.findByChallengeAndVoter(
        "challenge-123",
        "voter-789",
      );
      expect(stored).toHaveLength(2);
    });

    it("should fail when challengeId is empty", async () => {
      const input: CreateChallengeVoteInput = {
        challengeId: "",
        submissionId: "submission-456",
        voterId: "voter-789",
        position: 1,
      };

      // Act
      const program = createChallengeVoteUseCase(input).pipe(
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

      // Act & Assert
      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(ChallengeVoteCreationError);
        expect(either.left.message).toContain("challengeId");
      }

      // Verify no vote was stored
      const stored = await repo.findByChallengeId("challenge-123");
      expect(stored).toHaveLength(0);
    });

    it("should fail when submissionId is empty", async () => {
      const input: CreateChallengeVoteInput = {
        challengeId: "challenge-123",
        submissionId: "",
        voterId: "voter-789",
        position: 1,
      };

      // Act
      const program = createChallengeVoteUseCase(input).pipe(
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

      // Act & Assert
      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(ChallengeVoteCreationError);
        expect(either.left.message).toContain("submissionId");
      }
    });

    it("should fail when voterId is empty", async () => {
      const input: CreateChallengeVoteInput = {
        challengeId: "challenge-123",
        submissionId: "submission-456",
        voterId: "",
        position: 1,
      };

      // Act
      const program = createChallengeVoteUseCase(input).pipe(
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

      // Act & Assert
      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(ChallengeVoteCreationError);
        expect(either.left.message).toContain("voterId");
      }
    });

    it("should fail when position is invalid", async () => {
      const input: CreateChallengeVoteInput = {
        challengeId: "challenge-123",
        submissionId: "submission-456",
        voterId: "voter-789",
        position: 5, // Invalid position (only 1-3 allowed)
      };

      // Act
      const program = createChallengeVoteUseCase(input).pipe(
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

      // Act & Assert
      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(ChallengeVoteCreationError);
        expect(either.left.message).toContain("position");
      }
    });

    it("should fail when points is negative", async () => {
      const input: CreateChallengeVoteInput = {
        challengeId: "challenge-123",
        submissionId: "submission-456",
        voterId: "voter-789",
        position: 1,
        points: -10, // Invalid negative points
      };

      // Act
      const program = createChallengeVoteUseCase(input).pipe(
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

      // Act & Assert
      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(ChallengeVoteCreationError);
        expect(either.left.message).toContain("points");
      }
    });
  });
});
