import { describe, it, expect, beforeEach } from "bun:test";
import {
  getVotesByChallengeUseCase,
  type GetVotesByChallengeInput,
  GetVotesByChallengeValidationError,
} from "./GetVotesByChallenge";
import { ChallengeVote } from "@mirai-app/domain";
import { Effect } from "effect";
import { ChallengeVoteRepositoryTag } from "../ports/ChallengeVoteRepository";
import { InMemoryChallengeVoteRepository } from "@mirai-app/adapters/gateways/in-memory";

describe("[UNIT] getVotesByChallengeUseCase (Effect)", () => {
  let repo: InMemoryChallengeVoteRepository;

  beforeEach(() => {
    repo = new InMemoryChallengeVoteRepository();
  });

  // Helper to run use case with repository
  const runUseCase = async (input: GetVotesByChallengeInput) => {
    const program = getVotesByChallengeUseCase(input).pipe(
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
    it("should return votes for challenge", async () => {
      // Create votes from different voters
      const vote1 = await Effect.runPromise(
        ChallengeVote.create({
          id: "vote-1",
          challengeId: "challenge-123",
          submissionId: "submission-1",
          voterId: "voter-a",
          position: 1,
          points: 30,
          weight: 1.0,
        }),
      );
      const vote2 = await Effect.runPromise(
        ChallengeVote.create({
          id: "vote-2",
          challengeId: "challenge-123",
          submissionId: "submission-2",
          voterId: "voter-a",
          position: 2,
          points: 20,
          weight: 1.0,
        }),
      );
      const vote3 = await Effect.runPromise(
        ChallengeVote.create({
          id: "vote-3",
          challengeId: "challenge-123",
          submissionId: "submission-1",
          voterId: "voter-b",
          position: 1,
          points: 30,
          weight: 1.0,
        }),
      );

      Effect.runSync(repo.create(vote1));
      Effect.runSync(repo.create(vote2));
      Effect.runSync(repo.create(vote3));

      const input: GetVotesByChallengeInput = {
        challengeId: "challenge-123",
      };

      const result = await runUseCase(input);

      expect(result.votes).toHaveLength(3);
      expect(result.totalVotes).toBe(3);
      expect(result.uniqueVoters).toBe(2);
    });

    it("should return validation error when challengeId is empty", async () => {
      const input: GetVotesByChallengeInput = {
        challengeId: "",
      };

      const program = getVotesByChallengeUseCase(input).pipe(
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

      const either = await Effect.runPromise(Effect.either(program));
      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(GetVotesByChallengeValidationError);
        expect(either.left.message).toBe("challengeId is required");
      }
    });

    it("should return empty list when no votes exist", async () => {
      const input: GetVotesByChallengeInput = {
        challengeId: "challenge-empty",
      };

      const result = await runUseCase(input);

      expect(result.votes).toHaveLength(0);
      expect(result.totalVotes).toBe(0);
      expect(result.uniqueVoters).toBe(0);
    });
  });
});
