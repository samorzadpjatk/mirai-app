import type { ChallengeSubmission } from "@mirai-app/domain";
import type { ChallengeSubmissionDTO } from "@mirai-app/use-cases";
import type { DrizzleEntityMapper } from "../../../system/shared/gateways/drizzle-base";
import {
  type ChallengeSubmissionSelect,
  type ChallengeSubmissionInsert,
} from "@mirai-app/frameworks/drizzle/schema";

/**
 * ChallengeSubmissionDrizzleMapper
 *
 * Maps between Drizzle database records and ChallengeSubmission DTOs.
 * Implements the DrizzleEntityMapper interface for standard repository operations.
 */
export class ChallengeSubmissionDrizzleMapper implements DrizzleEntityMapper<
  ChallengeSubmissionDTO,
  ChallengeSubmissionSelect,
  ChallengeSubmissionInsert,
  Partial<ChallengeSubmissionInsert>
> {
  /**
   * Convert a Drizzle ChallengeSubmission record to a DTO
   */
  toDTO(record: ChallengeSubmissionSelect): ChallengeSubmissionDTO {
    return {
      id: record.id,
      challengeId: record.challengeId,
      userId: record.groupId ?? "", // Note: DTO expects userId, schema uses groupId
      groupId: record.groupId,
      content: record.textContent,
      mediaUrls: record.imageIds ?? [],
      status: record.status as "PENDING" | "APPROVED" | "REJECTED",
      score: record.awardedPoints,
      reviewedById: record.reviewedById,
      reviewedAt: record.reviewedAt,
      reviewNotes: record.rejectionReason,
      submittedAt: record.createdAt,
      updatedAt: record.updatedAt,
      voteCount: record.voteCount,
      voteScore: record.voteScore,
    };
  }

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
   * Convert a ChallengeSubmissionDTO to Drizzle insert input
   */
  toDrizzleInsert(dto: ChallengeSubmissionDTO): ChallengeSubmissionInsert {
    return {
      id: dto.id,
      challengeId: dto.challengeId,
      groupId: dto.groupId ?? dto.userId, // Use groupId or fallback to userId
      imageIds: dto.mediaUrls,
      videoId: null,
      textContent: dto.content,
      latitude: null,
      longitude: null,
      status: dto.status,
      reviewedById: dto.reviewedById,
      reviewedAt: dto.reviewedAt,
      rejectionReason: dto.reviewNotes,
      awardedPoints: dto.score,
      bonusPoints: null,
      ranking: null,
      voteCount: 0,
      voteScore: 0,
      createdAt: dto.submittedAt,
      updatedAt: dto.updatedAt,
    };
  }

  /**
   * Convert a ChallengeSubmissionDTO to Drizzle update input
   */
  toDrizzleUpdate(
    dto: ChallengeSubmissionDTO,
  ): Partial<ChallengeSubmissionInsert> {
    return {
      challengeId: dto.challengeId,
      groupId: dto.groupId ?? dto.userId,
      imageIds: dto.mediaUrls,
      videoId: null,
      textContent: dto.content,
      status: dto.status,
      reviewedById: dto.reviewedById,
      reviewedAt: dto.reviewedAt,
      rejectionReason: dto.reviewNotes,
      awardedPoints: dto.score,
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
