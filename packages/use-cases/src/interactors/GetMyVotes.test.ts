import { describe, it, expect, beforeEach } from "bun:test";
import {
  getMyVotesUseCase,
  type GetMyVotesInput,
  GetMyVotesValidationError,
} from "./GetMyVotes";
import { ChallengeVote } from "@mirai-app/domain";
import { Effect } from "effect";
import { ChallengeVoteRepositoryTag } from "../ports/ChallengeVoteRepository";
import { InMemoryChallengeVoteRepository } from "@mirai-app/adapters/gateways/in-memory";

describe("[UNIT] getMyVotesUseCase (Effect)", () => {
  let repo: InMemoryChallengeVoteRepository;

  beforeEach(() => {
    repo = new InMemoryChallengeVoteRepository();
  });

  // Helper to run use case with repository
  const runUseCase = async (input: GetMyVotesInput) => {
    const program = getMyVotesUseCase(input).pipe(
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

  describe("execute", () => {
    it("should return votes for specific voter", async () => {
      // Create votes for voter-456
      const vote1 = await Effect.runPromise(
        ChallengeVote.create({
          id: "vote-1",
          challengeId: "challenge-123",
          submissionId: "submission-1",
          voterId: "voter-456",
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
          voterId: "voter-456",
          position: 2,
          points: 20,
          weight: 1.0,
        }),
      );
      const vote3 = await Effect.runPromise(
        ChallengeVote.create({
          id: "vote-3",
          challengeId: "challenge-123",
          submissionId: "submission-3",
          voterId: "voter-456",
          position: 3,
          points: 10,
          weight: 1.0,
        }),
      );

      Effect.runSync(repo.create(vote1));
      Effect.runSync(repo.create(vote2));
      Effect.runSync(repo.create(vote3));

      const input: GetMyVotesInput = {
        challengeId: "challenge-123",
        voterId: "voter-456",
      };

      const result = await runUseCase(input);

      expect(result.votes).toHaveLength(3);
      expect(result.totalVotes).toBe(3);
      // Votes should be sorted by position
      expect(result.votes[0].votePosition).toBe(1);
      expect(result.votes[1].votePosition).toBe(2);
      expect(result.votes[2].votePosition).toBe(3);
    });

    it("should return validation error when challengeId is empty", async () => {
      const input: GetMyVotesInput = {
        challengeId: "",
        voterId: "voter-123",
      };

      const program = getMyVotesUseCase(input).pipe(
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
        expect(either.left).toBeInstanceOf(GetMyVotesValidationError);
        expect(either.left.message).toBe("challengeId is required");
      }
    });

    it("should return validation error when voterId is empty", async () => {
      const input: GetMyVotesInput = {
        challengeId: "challenge-123",
        voterId: "",
      };

      const program = getMyVotesUseCase(input).pipe(
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
        expect(either.left).toBeInstanceOf(GetMyVotesValidationError);
        expect(either.left.message).toBe("voterId is required");
      }
    });

    it("should return empty list when voter has not voted", async () => {
      const input: GetMyVotesInput = {
        challengeId: "challenge-123",
        voterId: "voter-no-votes",
      };

      const result = await runUseCase(input);

      expect(result.votes).toHaveLength(0);
      expect(result.totalVotes).toBe(0);
    });
  });
});
