import type { Effect } from "effect";
import type { IPortError } from "../../shared/errors/ports";
import type { UserId } from "../../user/value-objects/UserId";
import type { ChallengeId, ChallengeSubmissionId, ChallengeVoteId } from "../value-objects/ChallengeId";
import type { ChallengeVote } from "../entities/ChallengeVote";

/**
 * ChallengeVote Port
 * Defines repository operations for challenge votes
 */
export interface IChallengeVotePort {
  findById(
    id: ChallengeVoteId,
  ): Effect.Effect<ChallengeVote | null, IPortError, never>;
  findByChallengeId(
    challengeId: ChallengeId,
  ): Effect.Effect<ChallengeVote[], IPortError, never>;
  findByChallengeAndVoter(
    challengeId: ChallengeId,
    voterId: UserId,
  ): Effect.Effect<ChallengeVote[], IPortError, never>;
  create(
    vote: ChallengeVote,
  ): Effect.Effect<ChallengeVote, IPortError, never>;
  createMany(
    votes: ChallengeVote[],
  ): Effect.Effect<ChallengeVote[], IPortError, never>;
  delete(id: ChallengeVoteId): Effect.Effect<void, IPortError, never>;
  deleteByChallengeAndVoter(
    challengeId: ChallengeId,
    voterId: UserId,
  ): Effect.Effect<void, IPortError, never>;
  countByChallengeId(
    challengeId: ChallengeId,
  ): Effect.Effect<number, IPortError, never>;
}
