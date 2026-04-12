import { describe, it, expect, beforeEach } from "bun:test";
import {
  getChallengeVoteByIdUseCase,
  type GetChallengeVoteByIdInput,
  ChallengeVoteNotFoundError,
} from "./GetChallengeVoteById";
import { ChallengeVote } from "@mirai-app/domain";
import { Effect, Either } from "effect";
import { ChallengeVoteRepositoryTag } from "../ports/ChallengeVoteRepository";
import { InMemoryChallengeVoteRepository } from "@mirai-app/adapters/gateways/in-memory";

describe("[UNIT] getChallengeVoteByIdUseCase (Effect)", () => {
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
  const runUseCase = async (input: GetChallengeVoteByIdInput) => {
    const program = getChallengeVoteByIdUseCase(input).pipe(
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
    it("should retrieve vote by id", async () => {
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

      const input: GetChallengeVoteByIdInput = {
        voteId: existingVote.id,
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.id).toBe("vote-123");
      expect(result.challengeId).toBe("challenge-123");
      expect(result.submissionId).toBe("submission-456");
      expect(result.voterId).toBe("voter-789");
      expect(result.position).toBe(1);
      expect(result.points).toBe(3);
      expect(result.weight).toBe(1.0);
      expect(result.votedAt).toBeInstanceOf(Date);
    });

    it("should retrieve vote with custom points and weight", async () => {
      // Arrange
      const existingVote = await createTestVote({
        id: "vote-456",
        position: 2,
        points: 10,
        weight: 1.5,
      });

      const input: GetChallengeVoteByIdInput = {
        voteId: existingVote.id,
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.position).toBe(2);
      expect(result.points).toBe(10);
      expect(result.weight).toBe(1.5);
    });

    it("should fail when vote not found", async () => {
      const input: GetChallengeVoteByIdInput = {
        voteId: "non-existent-id",
      };

      // Act
      const program = getChallengeVoteByIdUseCase(input).pipe(
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

    it("should retrieve different votes independently", async () => {
      // Arrange
      const vote1 = await createTestVote({
        id: "vote-1",
        challengeId: "challenge-a",
        voterId: "voter-1",
        position: 1,
      });
      const vote2 = await createTestVote({
        id: "vote-2",
        challengeId: "challenge-b",
        voterId: "voter-2",
        position: 2,
      });

      // Act - Retrieve vote1
      const result1 = await runUseCase({ voteId: vote1.id });

      // Act - Retrieve vote2
      const result2 = await runUseCase({ voteId: vote2.id });

      // Assert
      expect(result1.id).toBe("vote-1");
      expect(result1.challengeId).toBe("challenge-a");
      expect(result1.voterId).toBe("voter-1");
      expect(result1.position).toBe(1);

      expect(result2.id).toBe("vote-2");
      expect(result2.challengeId).toBe("challenge-b");
      expect(result2.voterId).toBe("voter-2");
      expect(result2.position).toBe(2);
    });

    it("should retrieve correct vote data after updates", async () => {
      // Arrange - Create and then manually update via repo
      const vote = await createTestVote({
        id: "vote-update-test",
        position: 1,
        points: 3,
      });

      // Create a new vote with updated values (simulating update)
      const updatedVote = await Effect.runPromise(
        ChallengeVote.create({
          id: vote.id,
          challengeId: vote.challengeId,
          submissionId: vote.submissionId,
          voterId: vote.voterId,
          position: 2, // Updated position
          points: 5, // Updated points
          votedAt: vote.votedAt,
        }),
      );
      await repo.create(updatedVote);

      // Act
      const result = await runUseCase({ voteId: vote.id });

      // Assert - Should get the updated values
      expect(result.position).toBe(2);
      expect(result.points).toBe(5);
    });
  });
});
