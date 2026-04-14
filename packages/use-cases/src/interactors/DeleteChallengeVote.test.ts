import { describe, it, expect, beforeEach } from "bun:test";
import {
  deleteChallengeVoteUseCase,
  type DeleteChallengeVoteInput,
  ChallengeVoteNotFoundError,
} from "./DeleteChallengeVote";
import { ChallengeVote, ChallengeVoteId } from "@mirai-app/domain";
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
      id: ChallengeVoteId;
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
    return Effect.runSync(repo.create(vote));
  };

  // Helper to run use case with repository
  const runUseCase = async (input: DeleteChallengeVoteInput) => {
    const program = deleteChallengeVoteUseCase(input).pipe(
      Effect.provideService(ChallengeVoteRepositoryTag, {
        create: (vote: ChallengeVote) => repo.create(vote),
        createMany: (votes: ChallengeVote[]) => repo.createMany(votes),
        findById: (id: string) => repo.findById(id),
        findByChallengeId: (challengeId: string) =>
          repo.findByChallengeId(challengeId),
        findByChallengeAndVoter: (challengeId: string, voterId: string) =>
          repo.findByChallengeAndVoter(challengeId, voterId),
        findBySubmissionId: (submissionId: string) =>
          repo.findBySubmissionId(submissionId),
        hasVoted: (challengeId: string, voterId: string) =>
          repo.hasVoted(challengeId, voterId),
        hasVotedForPosition: (
          challengeId: string,
          voterId: string,
          position: number,
        ) => repo.hasVotedForPosition(challengeId, voterId, position),
        getVotedPositions: (challengeId: string, voterId: string) =>
          repo.getVotedPositions(challengeId, voterId),
        delete: (id: string) => repo.delete(id),
        deleteByChallengeId: (challengeId: string) =>
          repo.deleteByChallengeId(challengeId),
      }),
    );
    return await Effect.runPromise(program);
  };

  describe("[UNIT] execute", () => {
    it("should delete existing vote", async () => {
      // Arrange
      const existingVote = await createTestVote({
        id: ChallengeVoteId.unsafeCreate("vote-123"),
      });

      const input: DeleteChallengeVoteInput = {
        voteId: existingVote.id,
      };

      // Verify vote exists before deletion
      expect(Effect.runSync(repo.findById(existingVote.id))).not.toBeNull();

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe("Vote deleted successfully");

      // Verify vote was actually deleted
      const stored = Effect.runSync(repo.findById(existingVote.id));
      expect(stored).toBeNull();
    });

    it("should delete multiple votes independently", async () => {
      // Arrange
      const vote1 = await createTestVote({
        id: ChallengeVoteId.unsafeCreate("vote-1"),
      });
      const vote2 = await createTestVote({
        id: ChallengeVoteId.unsafeCreate("vote-2"),
      });
      const vote3 = await createTestVote({
        id: ChallengeVoteId.unsafeCreate("vote-3"),
      });

      // Act - Delete vote2
      const input: DeleteChallengeVoteInput = {
        voteId: vote2.id,
      };
      const result = await runUseCase(input);

      // Assert
      expect(result.success).toBe(true);

      // Verify only vote2 was deleted
      expect(Effect.runSync(repo.findById(vote1.id))).not.toBeNull();
      expect(Effect.runSync(repo.findById(vote2.id))).toBeNull();
      expect(Effect.runSync(repo.findById(vote3.id))).not.toBeNull();
    });

    it("should fail when vote not found", async () => {
      const input: DeleteChallengeVoteInput = {
        voteId: "non-existent-id",
      };

      // Act
      const program = deleteChallengeVoteUseCase(input).pipe(
        Effect.provideService(ChallengeVoteRepositoryTag, {
          create: (vote: ChallengeVote) => repo.create(vote),
          createMany: (votes: ChallengeVote[]) => repo.createMany(votes),
          findById: (id: string) => repo.findById(id),
          findByChallengeId: (challengeId: string) =>
            repo.findByChallengeId(challengeId),
          findByChallengeAndVoter: (challengeId: string, voterId: string) =>
            repo.findByChallengeAndVoter(challengeId, voterId),
          findBySubmissionId: (submissionId: string) =>
            repo.findBySubmissionId(submissionId),
          hasVoted: (challengeId: string, voterId: string) =>
            repo.hasVoted(challengeId, voterId),
          hasVotedForPosition: (
            challengeId: string,
            voterId: string,
            position: number,
          ) => repo.hasVotedForPosition(challengeId, voterId, position),
          getVotedPositions: (challengeId: string, voterId: string) =>
            repo.getVotedPositions(challengeId, voterId),
          delete: (id: string) => repo.delete(id),
          deleteByChallengeId: (challengeId: string) =>
            repo.deleteByChallengeId(challengeId),
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
        id: ChallengeVoteId.unsafeCreate("vote-1"),
        challengeId: "challenge-a",
      });
      const vote2 = await createTestVote({
        id: ChallengeVoteId.unsafeCreate("vote-2"),
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
      expect(Effect.runSync(repo.findById(vote1.id))).toBeNull();
      expect(Effect.runSync(repo.findById(vote2.id))).not.toBeNull();

      // Verify counts per challenge
      const votesA = Effect.runSync(repo.findByChallengeId("challenge-a"));
      const votesB = Effect.runSync(repo.findByChallengeId("challenge-b"));
      expect(votesA).toHaveLength(0);
      expect(votesB).toHaveLength(1);
    });
  });
});
