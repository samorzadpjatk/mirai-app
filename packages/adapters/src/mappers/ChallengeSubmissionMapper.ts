import {
  ChallengeSubmission,
  SubmissionId,
  type GroupInfo,
  type ReviewerInfo,
  type ChallengeInfo,
} from "@repo/domain";

/**
 * Prisma ChallengeSubmission record type
 */
interface PrismaChallengeSubmission {
  id: string;
  challengeId: string;
  groupId: string;
  imageIds: string[];
  videoId: string | null;
  textContent: string | null;
  latitude: number | null;
  longitude: number | null;
  status: string;
  reviewedById: string | null;
  reviewedAt: Date | null;
  rejectionReason: string | null;
  awardedPoints: number;
  bonusPoints: number;
  ranking: number | null;
  voteCount: number;
  voteScore: number;
  createdAt: Date;
  updatedAt: Date;
  // Related entities (optional, included via Prisma select)
  group?: {
    id: string;
    name: string;
    description: string | null;
    image: string | null;
  } | null;
  reviewedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    authUserId: string | null;
  } | null;
  challenge?: {
    id: string;
    name: string;
    tripId: string;
  } | null;
}

/**
 * ChallengeSubmissionMapper
 *
 * Maps between Prisma database records and domain ChallengeSubmission entities.
 * This is a pure function with no side effects.
 */
export class ChallengeSubmissionMapper {
  /**
   * Convert a Prisma ChallengeSubmission record to a domain entity
   */
  static toDomain(record: PrismaChallengeSubmission): ChallengeSubmission {
    const group: GroupInfo | null = record.group
      ? {
          id: record.group.id,
          name: record.group.name,
          description: record.group.description,
          image: record.group.image,
        }
      : null;

    const reviewedBy: ReviewerInfo | null = record.reviewedBy
      ? {
          id: record.reviewedBy.id,
          firstName: record.reviewedBy.firstName,
          lastName: record.reviewedBy.lastName,
          email: null, // Will be populated separately via auth lookup
        }
      : null;

    const challenge: ChallengeInfo | null = record.challenge
      ? {
          id: record.challenge.id,
          name: record.challenge.name,
          tripId: record.challenge.tripId,
        }
      : null;

    const result = ChallengeSubmission.create({
      id: SubmissionId.unsafeCreate(record.id),
      challengeId: record.challengeId,
      groupId: record.groupId,
      imageIds: record.imageIds,
      videoId: record.videoId,
      textContent: record.textContent,
      latitude: record.latitude,
      longitude: record.longitude,
      status: this.mapStatusFromPrisma(record.status),
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
      group,
      reviewedBy,
      challenge,
    });

    // This should never fail if database has valid data
    if (result.kind === "err") {
      throw new Error(
        `Failed to map ChallengeSubmission from database: ${result.error}`,
      );
    }

    return result.value;
  }

  /**
   * Convert a domain ChallengeSubmission entity to Prisma create input
   */
  static toPrismaCreate(submission: ChallengeSubmission): {
    id: string;
    challengeId: string;
    groupId: string;
    imageIds: string[];
    videoId: string | null;
    textContent: string | null;
    latitude: number | null;
    longitude: number | null;
    status: string;
    reviewedById: string | null;
    reviewedAt: Date | null;
    rejectionReason: string | null;
    awardedPoints: number;
    bonusPoints: number;
    ranking: number | null;
    voteCount: number;
    voteScore: number;
  } {
    return {
      id: submission.id,
      challengeId: submission.challengeId,
      groupId: submission.groupId,
      imageIds: submission.imageIds,
      videoId: submission.videoId,
      textContent: submission.textContent,
      latitude: submission.latitude,
      longitude: submission.longitude,
      status: submission.status,
      reviewedById: submission.reviewedById,
      reviewedAt: submission.reviewedAt,
      rejectionReason: submission.rejectionReason,
      awardedPoints: submission.awardedPoints,
      bonusPoints: submission.bonusPoints,
      ranking: submission.ranking,
      voteCount: submission.voteCount,
      voteScore: submission.voteScore,
    };
  }

  /**
   * Convert a domain ChallengeSubmission entity to Prisma update input
   */
  static toPrismaUpdate(submission: ChallengeSubmission): {
    challengeId: string;
    groupId: string;
    imageIds: string[];
    videoId: string | null;
    textContent: string | null;
    latitude: number | null;
    longitude: number | null;
    status: string;
    reviewedById: string | null;
    reviewedAt: Date | null;
    rejectionReason: string | null;
    awardedPoints: number;
    bonusPoints: number;
    ranking: number | null;
    voteCount: number;
    voteScore: number;
  } {
    return {
      challengeId: submission.challengeId,
      groupId: submission.groupId,
      imageIds: submission.imageIds,
      videoId: submission.videoId,
      textContent: submission.textContent,
      latitude: submission.latitude,
      longitude: submission.longitude,
      status: submission.status,
      reviewedById: submission.reviewedById,
      reviewedAt: submission.reviewedAt,
      rejectionReason: submission.rejectionReason,
      awardedPoints: submission.awardedPoints,
      bonusPoints: submission.bonusPoints,
      ranking: submission.ranking,
      voteCount: submission.voteCount,
      voteScore: submission.voteScore,
    };
  }

  /**
   * Map Prisma status string to SubmissionStatus
   */
  private static mapStatusFromPrisma(
    status: string,
  ): "PENDING" | "APPROVED" | "REJECTED" {
    switch (status) {
      case "PENDING":
        return "PENDING";
      case "APPROVED":
        return "APPROVED";
      case "REJECTED":
        return "REJECTED";
      default:
        return "PENDING";
    }
  }
}
