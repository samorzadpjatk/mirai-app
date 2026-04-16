import { describe, it, expect, beforeEach } from "bun:test";
import {
  getVotesByChallengeUseCase,
  type GetVotesByChallengeInput,
  GetVotesByChallengeValidationError,
} from "./get-by-challenge";
import { ChallengeVote, ChallengeVoteId } from "@mirai-app/domain";
import { Effect } from "effect";
import { ChallengeVoteGatewayTag } from "../../ports/vote/gateway";
import { InMemoryChallengeVoteGateway } from "@mirai-app/adapters";

describe("[UNIT] getVotesByChallengeUseCase (Effect)", () => {
  let gateway: InMemoryChallengeVoteGateway;

  beforeEach(() => {
    gateway = new InMemoryChallengeVoteGateway();
  });

  // Helper to run use case with gateway
  const runUseCase = async (input: GetVotesByChallengeInput) => {
    const program = getVotesByChallengeUseCase(input).pipe(
      Effect.provideService(ChallengeVoteGatewayTag, {
        create: (vote: ChallengeVote) => gateway.create(vote),
        createMany: (votes: ChallengeVote[]) => gateway.createMany(votes),
        findById: (id: string) => gateway.findById(id),
        findByChallengeId: (challengeId: string) =>
          gateway.findByChallengeId(challengeId),
        findByChallengeAndVoter: (challengeId: string, voterId: string) =>
          gateway.findByChallengeAndVoter(challengeId, voterId),
        findBySubmissionId: (submissionId: string) =>
          gateway.findBySubmissionId(submissionId),
        hasVoted: (challengeId: string, voterId: string) =>
          gateway.hasVoted(challengeId, voterId),
        hasVotedForPosition: (
          challengeId: string,
          voterId: string,
          position: number,
        ) => gateway.hasVotedForPosition(challengeId, voterId, position),
        getVotedPositions: (challengeId: string, voterId: string) =>
          gateway.getVotedPositions(challengeId, voterId),
        delete: (id: string) => gateway.delete(id),
        deleteByChallengeId: (challengeId: string) =>
          gateway.deleteByChallengeId(challengeId),
      }),
    );
    return await Effect.runPromise(program);
  };

  describe("[UNIT] execute", () => {
    it("should return votes for challenge", async () => {
      // Create votes from different voters
      const vote1 = await Effect.runPromise(
        ChallengeVote.create({
          id: ChallengeVoteId.create("vote-1"),
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
          id: ChallengeVoteId.create("vote-2"),
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
          id: ChallengeVoteId.create("vote-3"),
          challengeId: "challenge-123",
          submissionId: "submission-1",
          voterId: "voter-b",
          position: 1,
          points: 30,
          weight: 1.0,
        }),
      );

      Effect.runSync(gateway.create(vote1));
      Effect.runSync(gateway.create(vote2));
      Effect.runSync(gateway.create(vote3));

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
        Effect.provideService(ChallengeVoteGatewayTag, {
          create: (vote: ChallengeVote) => gateway.create(vote),
          createMany: (votes: ChallengeVote[]) => gateway.createMany(votes),
          findById: (id: string) => gateway.findById(id),
          findByChallengeId: (challengeId: string) =>
            gateway.findByChallengeId(challengeId),
          findByChallengeAndVoter: (challengeId: string, voterId: string) =>
            gateway.findByChallengeAndVoter(challengeId, voterId),
          findBySubmissionId: (submissionId: string) =>
            gateway.findBySubmissionId(submissionId),
          hasVoted: (challengeId: string, voterId: string) =>
            gateway.hasVoted(challengeId, voterId),
          hasVotedForPosition: (
            challengeId: string,
            voterId: string,
            position: number,
          ) => gateway.hasVotedForPosition(challengeId, voterId, position),
          getVotedPositions: (challengeId: string, voterId: string) =>
            gateway.getVotedPositions(challengeId, voterId),
          delete: (id: string) => gateway.delete(id),
          deleteByChallengeId: (challengeId: string) =>
            gateway.deleteByChallengeId(challengeId),
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
