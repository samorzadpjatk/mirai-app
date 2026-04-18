import type { Effect } from "effect";
import type { IPortError } from "../../shared/errors/ports";
import type { GroupId } from "../../group/value-objects/GroupId";
import type { ChallengeId, ChallengeSubmissionId } from "../value-objects/ChallengeId";
import type { ChallengeSubmission } from "../entities/ChallengeSubmission";

/**
 * ChallengeSubmission Port
 * Defines repository operations for challenge submissions
 */
export interface IChallengeSubmissionPort {
  findById(
    id: ChallengeSubmissionId,
  ): Effect.Effect<ChallengeSubmission | null, IPortError, never>;
  findByChallengeId(
    challengeId: ChallengeId,
  ): Effect.Effect<ChallengeSubmission[], IPortError, never>;
  findByChallengeAndGroup(
    challengeId: ChallengeId,
    groupId: GroupId,
  ): Effect.Effect<ChallengeSubmission | null, IPortError, never>;
  findByGroupId(
    groupId: GroupId,
  ): Effect.Effect<ChallengeSubmission[], IPortError, never>;
  create(
    submission: ChallengeSubmission,
  ): Effect.Effect<ChallengeSubmission, IPortError, never>;
  update(
    submission: ChallengeSubmission,
  ): Effect.Effect<ChallengeSubmission, IPortError, never>;
  delete(id: ChallengeSubmissionId): Effect.Effect<void, IPortError, never>;
  countByChallengeId(
    challengeId: ChallengeId,
  ): Effect.Effect<number, IPortError, never>;
  countPendingByChallengeId(
    challengeId: ChallengeId,
  ): Effect.Effect<number, IPortError, never>;
}
