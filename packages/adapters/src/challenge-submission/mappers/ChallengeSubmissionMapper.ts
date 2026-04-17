import type { ChallengeSubmissionSelect } from "@mirai-app/frameworks/drizzle";
import type { ChallengeSubmission } from "@mirai-app/use-cases";

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
      id: dbSubmission.id,
      challengeId: dbSubmission.challengeId,
      groupId: dbSubmission.groupId,
      imageIds: dbSubmission.imageIds ?? [],
      videoId: dbSubmission.videoId ?? null,
      textContent: dbSubmission.textContent ?? null,
      latitude: dbSubmission.latitude ?? null,
      longitude: dbSubmission.longitude ?? null,
      status: dbSubmission.status as "PENDING" | "APPROVED" | "REJECTED",
      reviewedById: dbSubmission.reviewedById ?? null,
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
