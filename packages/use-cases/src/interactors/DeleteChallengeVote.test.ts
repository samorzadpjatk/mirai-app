import { describe, it, expect, beforeEach } from "bun:test";
import {
  deleteChallengeVoteUseCase,
  type DeleteChallengeVoteInput,
  ChallengeVoteNotFoundError,
} from "./DeleteChallengeVote";
import { ChallengeVote } from "@mirai-app/domain";
import { Effect, Either } from "effect";
import { ChallengeVoteRepositoryTag } from "../ports/ChallengeVoteRepository";
import { InMemoryChallengeVoteRepository } from "@mirai-app/adapters/gateways/in-memory";

describe("[UNIT] deleteChallengeVoteUseCase (Effect)", () => {
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
    }>,
  ): Promise<ChallengeVote> => {
    const vote = await Effect.runPromise(
      ChallengeVote.create({
        id: overrides?.id,
        challengeId: overrides?.challengeId ?? "challenge-123",
        submissionId: overrides?.submissionId ?? "submission-456",
        voterId: overrides?.voterId ?? "voter-789",
        position: overrides?.position ?? 1,
      }),
    );
    return repo.create(vote);
  };

  // Helper to run use case with repository
  const runUseCase = async (input: DeleteChallengeVoteInput) => {
    const program = deleteChallengeVoteUseCase(input).pipe(
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
    it("should delete existing vote", async () => {
      // Arrange
      const existingVote = await createTestVote({
        id: "vote-123",
      });

      const input: DeleteChallengeVoteInput = {
        voteId: existingVote.id,
      };

      // Verify vote exists before deletion
      expect(await repo.findById(existingVote.id)).not.toBeNull();

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe("Vote deleted successfully");

      // Verify vote was actually deleted
      const stored = await repo.findById(existingVote.id);
      expect(stored).toBeNull();
    });

    it("should delete multiple votes independently", async () => {
      // Arrange
      const vote1 = await createTestVote({ id: "vote-1" });
      const vote2 = await createTestVote({ id: "vote-2" });
      const vote3 = await createTestVote({ id: "vote-3" });

      // Act - Delete vote2
      const input: DeleteChallengeVoteInput = {
        voteId: vote2.id,
      };
      const result = await runUseCase(input);

      // Assert
      expect(result.success).toBe(true);

      // Verify only vote2 was deleted
      expect(await repo.findById(vote1.id)).not.toBeNull();
      expect(await repo.findById(vote2.id)).toBeNull();
      expect(await repo.findById(vote3.id)).not.toBeNull();
    });

    it("should fail when vote not found", async () => {
      const input: DeleteChallengeVoteInput = {
        voteId: "non-existent-id",
      };

      // Act
      const program = deleteChallengeVoteUseCase(input).pipe(
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

    it("should handle vote deletion for different challenges", async () => {
      // Arrange - Create votes for different challenges
      const vote1 = await createTestVote({
        id: "vote-1",
        challengeId: "challenge-a",
      });
      const vote2 = await createTestVote({
        id: "vote-2",
        challengeId: "challenge-b",
      });

      // Act - Delete vote from challenge-a
      const input: DeleteChallengeVoteInput = {
        voteId: vote1.id,
      };
      const result = await runUseCase(input);

      // Assert
      expect(result.success).toBe(true);

      // Verify vote1 deleted but vote2 remains
      expect(await repo.findById(vote1.id)).toBeNull();
      expect(await repo.findById(vote2.id)).not.toBeNull();

      // Verify counts per challenge
      const votesA = await repo.findByChallengeId("challenge-a");
      const votesB = await repo.findByChallengeId("challenge-b");
      expect(votesA).toHaveLength(0);
      expect(votesB).toHaveLength(1);
    });
  });
});
