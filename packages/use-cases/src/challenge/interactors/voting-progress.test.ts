import { describe, it, expect, beforeEach } from "bun:test";
import {
  getChallengeVotingProgressUseCase,
  type GetChallengeVotingProgressInput,
  GetVotingProgressValidationError,
} from "./voting-progress";
import { ChallengeVote, ChallengeVoteId } from "@mirai-app/domain";
import { Effect } from "effect";
import { ChallengeVoteGatewayTag } from "../ports/vote/gateway";
import { InMemoryChallengeVoteGateway } from "@mirai-app/adapters";

describe("[UNIT] getChallengeVotingProgressUseCase (Effect)", () => {
  let repo: InMemoryChallengeVoteGateway;

  beforeEach(() => {
    repo = new InMemoryChallengeVoteGateway();
  });

  // Helper to run use case with repository
  const runUseCase = async (input: GetChallengeVotingProgressInput) => {
    const program = getChallengeVotingProgressUseCase(input).pipe(
      Effect.provideService(ChallengeVoteGatewayTag, {
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
    it("should return voting progress with submission stats", async () => {
      // Create votes for different submissions
      const vote1 = await Effect.runPromise(
        ChallengeVote.create({
          id: ChallengeVoteId.unsafeCreate("vote-1"),
          challengeId: "challenge-123",
          submissionId: "submission-a",
          voterId: "voter-1",
          position: 1,
          points: 30,
          weight: 1.0,
        }),
      );
      const vote2 = await Effect.runPromise(
        ChallengeVote.create({
          id: ChallengeVoteId.unsafeCreate("vote-2"),
          challengeId: "challenge-123",
          submissionId: "submission-a",
          voterId: "voter-2",
          position: 2,
          points: 20,
          weight: 1.0,
        }),
      );
      const vote3 = await Effect.runPromise(
        ChallengeVote.create({
          id: ChallengeVoteId.unsafeCreate("vote-3"),
          challengeId: "challenge-123",
          submissionId: "submission-b",
          voterId: "voter-1",
          position: 1,
          points: 30,
          weight: 1.0,
        }),
      );
      const vote4 = await Effect.runPromise(
        ChallengeVote.create({
          id: ChallengeVoteId.unsafeCreate("vote-4"),
          challengeId: "challenge-123",
          submissionId: "submission-c",
          voterId: "voter-3",
          position: 3,
          points: 10,
          weight: 1.0,
        }),
      );

      Effect.runSync(repo.create(vote1));
      Effect.runSync(repo.create(vote2));
      Effect.runSync(repo.create(vote3));
      Effect.runSync(repo.create(vote4));

      const input: GetChallengeVotingProgressInput = {
        challengeId: "challenge-123",
      };

      const result = await runUseCase(input);

      expect(result.challengeId).toBe("challenge-123");
      expect(result.totalVotes).toBe(4);
      expect(result.submissionStats).toHaveLength(3);
      // Stats should be sorted by voteScore descending
      expect(result.submissionStats[0].submissionId).toBe("submission-a");
      expect(result.submissionStats[0].voteCount).toBe(2);
    });

    it("should return validation error when challengeId is empty", async () => {
      const input: GetChallengeVotingProgressInput = {
        challengeId: "",
      };

      const program = getChallengeVotingProgressUseCase(input).pipe(
        Effect.provideService(ChallengeVoteGatewayTag, {
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
        expect(either.left).toBeInstanceOf(GetVotingProgressValidationError);
        expect(either.left.message).toBe("challengeId is required");
      }
    });

    it("should return empty stats when no votes exist", async () => {
      const input: GetChallengeVotingProgressInput = {
        challengeId: "challenge-empty",
      };

      const result = await runUseCase(input);

      expect(result.totalVotes).toBe(0);
      expect(result.submissionStats).toHaveLength(0);
    });
  });
});
