import type { Effect } from "effect";
import type { IPortError } from "../../shared/errors/ports";
import type { GroupId } from "../../group/value-objects/GroupId";
import type { ChallengeId, ChallengeSubmissionId } from "../value-objects/ChallengeId";
import type { ChallengeSubmission } from "../entities/ChallengeSubmission";

/**
 * ChallengeSubmission Port
 * Defines repository operations for challenge submissions
 *
 * Note: Methods may require AuthContextTag and AuthZPortTag in the Effect context
 * for authorization checks. Use Effect.provide() to supply these dependencies.
 */
export interface IChallengeSubmissionPort {
  findById(
    id: ChallengeSubmissionId,
  ): Effect.Effect<ChallengeSubmission | null, IPortError, unknown>;
  findByChallengeId(
    challengeId: ChallengeId,
  ): Effect.Effect<ChallengeSubmission[], IPortError, unknown>;
  findByChallengeAndGroup(
    challengeId: ChallengeId,
    groupId: GroupId,
  ): Effect.Effect<ChallengeSubmission | null, IPortError, unknown>;
  findByGroupId(
    groupId: GroupId,
  ): Effect.Effect<ChallengeSubmission[], IPortError, unknown>;
  create(
    submission: ChallengeSubmission,
  ): Effect.Effect<ChallengeSubmission, IPortError, unknown>;
  update(
    submission: ChallengeSubmission,
  ): Effect.Effect<ChallengeSubmission, IPortError, unknown>;
  delete(id: ChallengeSubmissionId): Effect.Effect<void, IPortError, unknown>;
  countByChallengeId(
    challengeId: ChallengeId,
  ): Effect.Effect<number, IPortError, unknown>;
  countPendingByChallengeId(
    challengeId: ChallengeId,
  ): Effect.Effect<number, IPortError, unknown>;
}
