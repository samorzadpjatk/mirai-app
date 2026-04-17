import { Context, Effect } from "effect";
import type { IPortError } from "@mirai-app/domain";

/**
 * ChallengeVote Port - Repository interface with Context.Tag for Effect DI
 */
export interface IChallengeVotePort {
  findById(id: string): Effect.Effect<ChallengeVote | null, IPortError, never>;
  findByChallengeId(
    challengeId: string,
  ): Effect.Effect<ChallengeVote[], IPortError, never>;
  findByChallengeAndVoter(
    challengeId: string,
    voterId: string,
  ): Effect.Effect<ChallengeVote[], IPortError, never>;
  create(vote: ChallengeVote): Effect.Effect<ChallengeVote, IPortError, never>;
  createMany(
    votes: ChallengeVote[],
  ): Effect.Effect<ChallengeVote[], IPortError, never>;
  delete(id: string): Effect.Effect<void, IPortError, never>;
  deleteByChallengeAndVoter(
    challengeId: string,
    voterId: string,
  ): Effect.Effect<void, IPortError, never>;
  countByChallengeId(
    challengeId: string,
  ): Effect.Effect<number, IPortError, never>;
}

export class ChallengeVotePortTag extends Context.Tag("ChallengeVotePort")<
  ChallengeVotePortTag,
  IChallengeVotePort
>() {}

/**
 * ChallengeVote entity interface for use cases
 */
export interface ChallengeVote {
  id: string;
  challengeId: string;
  submissionId: string;
  voterId: string;
  votePosition: number;
  votePoints: number;
  normalizedWeight: number;
  votedAt: Date;
}
