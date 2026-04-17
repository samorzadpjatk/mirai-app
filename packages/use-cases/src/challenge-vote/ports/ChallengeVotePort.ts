import { Context, Effect } from "effect";
import type { DatabaseError } from "@mirai-app/domain";

/**
 * ChallengeVote Port - Repository interface with Context.Tag for Effect DI
 */
export interface IChallengeVotePort {
  findById(
    id: string,
  ): Effect.Effect<ChallengeVote | null, DatabaseError, never>;
  findByChallengeId(
    challengeId: string,
  ): Effect.Effect<ChallengeVote[], DatabaseError, never>;
  findByChallengeAndVoter(
    challengeId: string,
    voterId: string,
  ): Effect.Effect<ChallengeVote[], DatabaseError, never>;
  create(
    vote: ChallengeVote,
  ): Effect.Effect<ChallengeVote, DatabaseError, never>;
  createMany(
    votes: ChallengeVote[],
  ): Effect.Effect<ChallengeVote[], DatabaseError, never>;
  delete(id: string): Effect.Effect<void, DatabaseError, never>;
  deleteByChallengeAndVoter(
    challengeId: string,
    voterId: string,
  ): Effect.Effect<void, DatabaseError, never>;
  countByChallengeId(
    challengeId: string,
  ): Effect.Effect<number, DatabaseError, never>;
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
