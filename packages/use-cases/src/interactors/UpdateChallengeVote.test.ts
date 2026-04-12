import { describe, it, expect, beforeEach } from "bun:test";
import {
  updateChallengeVoteUseCase,
  type UpdateChallengeVoteInput,
  ChallengeVoteNotFoundError,
  ChallengeVoteValidationError,
} from "./UpdateChallengeVote";
import { ChallengeVote } from "@mirai-app/domain";
import { Effect, Either } from "effect";
import { ChallengeVoteRepositoryTag } from "../ports/ChallengeVoteRepository";
import { InMemoryChallengeVoteRepository } from "@mirai-app/adapters/gateways/in-memory";

describe("[UNIT] updateChallengeVoteUseCase (Effect)", () => {
  let repo: InMemoryChallengeVoteRepository;

  beforeEach(() => {
    repo = new InMemoryChallengeVoteRepository();
  });

  // Helper to create a test vote
  const createTestVote = async (
    overrides?: Partial<{
      id: string;
      challengeId: string;
      submissionId: string;
      voterId: string;
      position: number;
      points: number;
      weight: number;
    }>,
  ): Promise<ChallengeVote> => {
    const vote = await Effect.runPromise(
      ChallengeVote.create({
        id: overrides?.id,
        challengeId: overrides?.challengeId ?? "challenge-123",
        submissionId: overrides?.submissionId ?? "submission-456",
        voterId: overrides?.voterId ?? "voter-789",
        position: overrides?.position ?? 1,
        points: overrides?.points ?? 3,
        weight: overrides?.weight ?? 1.0,
      }),
    );
    return repo.create(vote);
  };

  // Helper to run use case with repository
  const runUseCase = async (input: UpdateChallengeVoteInput) => {
    const program = updateChallengeVoteUseCase(input).pipe(
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
    it("should update vote position", async () => {
      // Arrange
      const existingVote = await createTestVote({
        id: "vote-123",
        position: 1,
      });

      const input: UpdateChallengeVoteInput = {
        voteId: existingVote.id,
        position: 2,
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.id).toBe(existingVote.id);
      expect(result.position).toBe(2);
      expect(result.challengeId).toBe("challenge-123");
      expect(result.voterId).toBe("voter-789");
    });

    it("should update vote points", async () => {
      // Arrange
      const existingVote = await createTestVote({
        id: "vote-123",
        points: 3,
      });

      const input: UpdateChallengeVoteInput = {
        voteId: existingVote.id,
        points: 10,
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.points).toBe(10);
    });

    it("should update vote weight", async () => {
      // Arrange
      const existingVote = await createTestVote({
        id: "vote-123",
        weight: 1.0,
      });

      const input: UpdateChallengeVoteInput = {
        voteId: existingVote.id,
        weight: 1.5,
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.weight).toBe(1.5);
    });

    it("should update multiple fields at once", async () => {
      // Arrange
      const existingVote = await createTestVote({
        id: "vote-123",
        position: 1,
        points: 3,
        weight: 1.0,
      });

      const input: UpdateChallengeVoteInput = {
        voteId: existingVote.id,
        position: 3,
        points: 15,
        weight: 2.0,
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.position).toBe(3);
      expect(result.points).toBe(15);
      expect(result.weight).toBe(2.0);
    });

    it("should fail when vote not found", async () => {
      const input: UpdateChallengeVoteInput = {
        voteId: "non-existent-id",
        position: 2,
      };

      // Act
      const program = updateChallengeVoteUseCase(input).pipe(
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
        expect(either.left).toBeInstanceOf(ChallengeVoteNotFoundError);
        expect(either.left.message).toBe("Vote not found");
      }
    });

    it("should fail when position is invalid", async () => {
      // Arrange
      const existingVote = await createTestVote({
        id: "vote-123",
        position: 1,
      });

      const input: UpdateChallengeVoteInput = {
        voteId: existingVote.id,
        position: 5, // Invalid position
      };

      // Act
      const program = updateChallengeVoteUseCase(input).pipe(
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
        expect(either.left).toBeInstanceOf(ChallengeVoteValidationError);
        expect(either.left.message).toContain("position");
      }
    });

    it("should fail when points is negative", async () => {
      // Arrange
      const existingVote = await createTestVote({
        id: "vote-123",
        points: 3,
      });

      const input: UpdateChallengeVoteInput = {
        voteId: existingVote.id,
        points: -5, // Invalid negative points
      };

      // Act
      const program = updateChallengeVoteUseCase(input).pipe(
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
        expect(either.left).toBeInstanceOf(ChallengeVoteValidationError);
        expect(either.left.message).toContain("points");
      }
    });

    it("should preserve unchanged fields", async () => {
      // Arrange
      const existingVote = await createTestVote({
        id: "vote-123",
        challengeId: "challenge-123",
        submissionId: "submission-456",
        voterId: "voter-789",
        position: 1,
        points: 3,
        weight: 1.0,
      });

      const input: UpdateChallengeVoteInput = {
        voteId: existingVote.id,
        points: 10, // Only update points
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.id).toBe(existingVote.id);
      expect(result.challengeId).toBe("challenge-123");
      expect(result.submissionId).toBe("submission-456");
      expect(result.voterId).toBe("voter-789");
      expect(result.position).toBe(1); // Unchanged
      expect(result.points).toBe(10); // Updated
      expect(result.weight).toBe(1.0); // Unchanged
    });
  });
});
