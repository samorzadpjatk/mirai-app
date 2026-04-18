import type { ChallengeSubmissionSelect } from "../../infrastructure/drizzle";
import type { ChallengeSubmission } from "@mirai-app/use-cases/challenge-submission";
import {
  ChallengeSubmissionId,
  ChallengeId,
  GroupId,
} from "@mirai-app/domain";
import type { UserId } from "@mirai-app/domain";

/**
 * ChallengeSubmission Mapper
 *
 * Maps between database ChallengeSubmission records and use-case ChallengeSubmission interface.
 */
export class ChallengeSubmissionMapper {
  /**
   * Convert database record to use-case interface
   */
  static toDomain(
    dbSubmission: ChallengeSubmissionSelect,
  ): ChallengeSubmission {
    return {
      id: ChallengeSubmissionId.create(dbSubmission.id),
      challengeId: ChallengeId.create(dbSubmission.challengeId),
      groupId: GroupId.create(dbSubmission.groupId),
      imageIds: dbSubmission.imageIds ?? [],
      videoId: dbSubmission.videoId ?? null,
      textContent: dbSubmission.textContent ?? null,
      latitude: dbSubmission.latitude ?? null,
      longitude: dbSubmission.longitude ?? null,
      status: dbSubmission.status as "PENDING" | "APPROVED" | "REJECTED",
      reviewedById: (dbSubmission.reviewedById as UserId | null) ?? null,
      reviewedAt: dbSubmission.reviewedAt ?? null,
      rejectionReason: dbSubmission.rejectionReason ?? null,
      awardedPoints: dbSubmission.awardedPoints ?? null,
      bonusPoints: dbSubmission.bonusPoints ?? null,
      ranking: dbSubmission.ranking ?? null,
      voteCount: dbSubmission.voteCount,
      voteScore: dbSubmission.voteScore,
      createdAt: dbSubmission.createdAt,
      updatedAt: dbSubmission.updatedAt,
    };
  }
}
