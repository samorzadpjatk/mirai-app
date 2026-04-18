import type { Effect } from "effect";
import type { IPortError } from "../../shared/errors/ports";
import type { UserId } from "../../user/value-objects/UserId";
import type { ChallengeId, ChallengeSubmissionId, ChallengeVoteId } from "../value-objects/ChallengeId";
import type { ChallengeVote } from "../entities/ChallengeVote";

/**
 * ChallengeVote Port
 * Defines repository operations for challenge votes
 *
 * Note: Methods may require AuthContextTag and AuthZPortTag in the Effect context
 * for authorization checks. Use Effect.provide() to supply these dependencies.
 */
export interface IChallengeVotePort {
  findById(
    id: ChallengeVoteId,
  ): Effect.Effect<ChallengeVote | null, IPortError, unknown>;
  findByChallengeId(
    challengeId: ChallengeId,
  ): Effect.Effect<ChallengeVote[], IPortError, unknown>;
  findByChallengeAndVoter(
    challengeId: ChallengeId,
    voterId: UserId,
  ): Effect.Effect<ChallengeVote[], IPortError, unknown>;
  create(
    vote: ChallengeVote,
  ): Effect.Effect<ChallengeVote, IPortError, unknown>;
  createMany(
    votes: ChallengeVote[],
  ): Effect.Effect<ChallengeVote[], IPortError, unknown>;
  delete(id: ChallengeVoteId): Effect.Effect<void, IPortError, unknown>;
  deleteByChallengeAndVoter(
    challengeId: ChallengeId,
    voterId: UserId,
  ): Effect.Effect<void, IPortError, unknown>;
  countByChallengeId(
    challengeId: ChallengeId,
  ): Effect.Effect<number, IPortError, unknown>;
}
