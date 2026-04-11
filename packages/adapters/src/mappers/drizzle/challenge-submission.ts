import type { ChallengeSubmission } from "@mirai-app/domain";
import type { DrizzleEntityMapper } from "../../gateways/base/repository";
import {
  type ChallengeSubmissionSelect,
  type ChallengeSubmissionInsert,
} from "@mirai-app/frameworks/drizzle/schema/challenge";

/**
 * ChallengeSubmissionDrizzleMapper
 *
 * Maps between Drizzle database records and domain ChallengeSubmission entities.
 * Implements the DrizzleEntityMapper interface for standard repository operations.
 */
export class ChallengeSubmissionDrizzleMapper implements DrizzleEntityMapper<
  ChallengeSubmission,
  ChallengeSubmissionSelect,
  ChallengeSubmissionInsert,
  Partial<ChallengeSubmissionInsert>
> {
  /**
   * Convert a Drizzle ChallengeSubmission record to a domain entity
   */
  toDomain(record: ChallengeSubmissionSelect): ChallengeSubmission {
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
  toDrizzleInsert(entity: ChallengeSubmission): ChallengeSubmissionInsert {
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
  ): Partial<ChallengeSubmissionInsert> {
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
    record: Partial<ChallengeSubmissionSelect>,
  ): Partial<ChallengeSubmission> {
    const partial: Record<string, unknown> = {};
    if (record.id) partial.id = record.id;
    if (record.challengeId) partial.challengeId = record.challengeId;
    if (record.groupId) partial.groupId = record.groupId;
    if (record.imageIds) partial.imageIds = record.imageIds;
    if (record.videoId !== undefined) partial.videoId = record.videoId;
    if (record.textContent !== undefined)
      partial.textContent = record.textContent;
    if (record.latitude !== undefined) partial.latitude = record.latitude;
    if (record.longitude !== undefined) partial.longitude = record.longitude;
    if (record.status) partial.status = record.status;
    if (record.reviewedById !== undefined)
      partial.reviewedById = record.reviewedById;
    if (record.reviewedAt !== undefined) partial.reviewedAt = record.reviewedAt;
    if (record.rejectionReason !== undefined)
      partial.rejectionReason = record.rejectionReason;
    if (record.awardedPoints !== undefined)
      partial.awardedPoints = record.awardedPoints;
    if (record.bonusPoints !== undefined)
      partial.bonusPoints = record.bonusPoints;
    if (record.ranking !== undefined) partial.ranking = record.ranking;
    if (record.voteCount !== undefined) partial.voteCount = record.voteCount;
    if (record.voteScore !== undefined) partial.voteScore = record.voteScore;
    return partial as Partial<ChallengeSubmission>;
  }

  static readonly instance = new ChallengeSubmissionDrizzleMapper();
}
