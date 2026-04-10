import type { ChallengeSubmission } from "@mirai-app/domain";
import type { DrizzleEntityMapper } from "../gateways/base/repository";
import type { challengeSubmissions } from "@mirai-app/frameworks/drizzle/schema/challenge";

/**
 * ChallengeSubmissionDrizzleMapper
 *
 * Maps between Drizzle database records and domain ChallengeSubmission entities.
 * Implements the DrizzleEntityMapper interface for standard repository operations.
 */
export class ChallengeSubmissionDrizzleMapper implements DrizzleEntityMapper<
  ChallengeSubmission,
  typeof challengeSubmissions.$inferSelect,
  Partial<typeof challengeSubmissions.$inferInsert>,
  Partial<typeof challengeSubmissions.$inferInsert>
> {
  /**
   * Convert a Drizzle ChallengeSubmission record to a domain entity
   */
  toDomain(
    record: typeof challengeSubmissions.$inferSelect,
  ): ChallengeSubmission {
    // Build the result manually since ChallengeSubmission.create may not match exactly
    return {
      id: record.id,
      challengeId: record.challengeId,
      groupId: record.groupId,
      imageIds: record.imageIds ?? [],
      videoId: record.videoId,
      textContent: record.textContent,
      latitude: record.latitude,
      longitude: record.longitude,
      status: record.status as "PENDING" | "APPROVED" | "REJECTED",
      reviewedById: record.reviewedById,
      reviewedAt: record.reviewedAt,
      rejectionReason: record.rejectionReason,
      awardedPoints: record.awardedPoints,
      bonusPoints: record.bonusPoints,
      ranking: record.ranking,
      voteCount: record.voteCount,
      voteScore: record.voteScore,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    } as unknown as ChallengeSubmission;
  }

  /**
   * Convert a domain ChallengeSubmission entity to Drizzle insert input
   */
  toDrizzleCreate(
    entity: ChallengeSubmission,
  ): Partial<typeof challengeSubmissions.$inferInsert> {
    return {
      id: entity.id,
      challengeId: entity.challengeId,
      groupId: entity.groupId,
      imageIds: entity.imageIds,
      videoId: entity.videoId,
      textContent: entity.textContent,
      latitude: entity.latitude,
      longitude: entity.longitude,
      status: entity.status,
      reviewedById: entity.reviewedById,
      reviewedAt: entity.reviewedAt,
      rejectionReason: entity.rejectionReason,
      awardedPoints: entity.awardedPoints,
      bonusPoints: entity.bonusPoints,
      ranking: entity.ranking,
      voteCount: entity.voteCount,
      voteScore: entity.voteScore,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  /**
   * Convert a domain ChallengeSubmission entity to Drizzle update input
   */
  toDrizzleUpdate(
    entity: ChallengeSubmission,
  ): Partial<typeof challengeSubmissions.$inferInsert> {
    return {
      challengeId: entity.challengeId,
      groupId: entity.groupId,
      imageIds: entity.imageIds,
      videoId: entity.videoId,
      textContent: entity.textContent,
      latitude: entity.latitude,
      longitude: entity.longitude,
      status: entity.status,
      reviewedById: entity.reviewedById,
      reviewedAt: entity.reviewedAt,
      rejectionReason: entity.rejectionReason,
      awardedPoints: entity.awardedPoints,
      bonusPoints: entity.bonusPoints,
      ranking: entity.ranking,
      voteCount: entity.voteCount,
      voteScore: entity.voteScore,
      updatedAt: new Date(),
    };
  }

  /**
   * Create a partial entity from Drizzle record (for updates)
   */
  fromPartial(
    record: Partial<typeof challengeSubmissions.$inferSelect>,
  ): Partial<ChallengeSubmission> {
    return {
      ...(record.id && { id: record.id }),
      ...(record.challengeId && { challengeId: record.challengeId }),
      ...(record.groupId && { groupId: record.groupId }),
      ...(record.imageIds && { imageIds: record.imageIds }),
      ...(record.videoId !== undefined && { videoId: record.videoId }),
      ...(record.textContent !== undefined && {
        textContent: record.textContent,
      }),
      ...(record.latitude !== undefined && { latitude: record.latitude }),
      ...(record.longitude !== undefined && { longitude: record.longitude }),
      ...(record.status && {
        status: record.status as "PENDING" | "APPROVED" | "REJECTED",
      }),
      ...(record.reviewedById !== undefined && {
        reviewedById: record.reviewedById,
      }),
      ...(record.reviewedAt !== undefined && { reviewedAt: record.reviewedAt }),
      ...(record.rejectionReason !== undefined && {
        rejectionReason: record.rejectionReason,
      }),
      ...(record.awardedPoints !== undefined && {
        awardedPoints: record.awardedPoints,
      }),
      ...(record.bonusPoints !== undefined && {
        bonusPoints: record.bonusPoints,
      }),
      ...(record.ranking !== undefined && { ranking: record.ranking }),
      ...(record.voteCount !== undefined && { voteCount: record.voteCount }),
      ...(record.voteScore !== undefined && { voteScore: record.voteScore }),
    };
  }

  static readonly instance = new ChallengeSubmissionDrizzleMapper();
}
