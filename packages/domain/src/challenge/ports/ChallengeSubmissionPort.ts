import type { Effect } from "effect";
import type { IPortError } from "../../shared/errors/ports";
import type { GroupId } from "../../group/value-objects/GroupId";
import type { ChallengeId, ChallengeSubmissionId } from "../value-objects/ChallengeId";

/**
 * ChallengeSubmission Port
 * Defines repository operations for challenge submissions
 */
export interface IChallengeSubmissionPort {
  findById(
    id: ChallengeSubmissionId,
  ): Effect.Effect<import("../entities/ChallengeSubmission").ChallengeSubmission | null, IPortError, never>;
  findByChallengeId(
    challengeId: ChallengeId,
  ): Effect.Effect<import("../entities/ChallengeSubmission").ChallengeSubmission[], IPortError, never>;
  findByChallengeAndGroup(
    challengeId: ChallengeId,
    groupId: GroupId,
  ): Effect.Effect<import("../entities/ChallengeSubmission").ChallengeSubmission | null, IPortError, never>;
  findByGroupId(
    groupId: GroupId,
  ): Effect.Effect<import("../entities/ChallengeSubmission").ChallengeSubmission[], IPortError, never>;
  create(
    submission: import("../entities/ChallengeSubmission").ChallengeSubmission,
  ): Effect.Effect<import("../entities/ChallengeSubmission").ChallengeSubmission, IPortError, never>;
  update(
    submission: import("../entities/ChallengeSubmission").ChallengeSubmission,
  ): Effect.Effect<import("../entities/ChallengeSubmission").ChallengeSubmission, IPortError, never>;
  delete(id: ChallengeSubmissionId): Effect.Effect<void, IPortError, never>;
  countByChallengeId(
    challengeId: ChallengeId,
  ): Effect.Effect<number, IPortError, never>;
  countPendingByChallengeId(
    challengeId: ChallengeId,
  ): Effect.Effect<number, IPortError, never>;
}
