import {
  Challenge,
  ChallengeStatus,
  SubmissionType,
  ScoringCategory,
} from "@mirai-app/domain";

/**
 * ChallengeMapper
 *
 * Maps between Prisma database records and domain Challenge entities.
 */
export class ChallengeMapper {
  /**
   * Convert a Prisma Challenge record to a domain Challenge entity
   */
  static toDomain(record: {
    id: string;
    tripId: string;
    name: string;
    description: string | null;
    image: string | null;
    submissionType: string;
    scoringCategory: string;
    isRecurring: boolean;
    dailyStartTime: string | null;
    dailyEndTime: string | null;
    basePoints: number;
    firstPlacePoints: number | null;
    secondPlacePoints: number | null;
    thirdPlacePoints: number | null;
    status: string;
    startTime: Date | null;
    endTime: Date | null;
    votingStartTime: Date | null;
    votingEndTime: Date | null;
    targetLatitude: number | null;
    targetLongitude: number | null;
    expectedValue: string | null;
    autoApprove: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): Challenge {
    const submissionType = ChallengeMapper.mapSubmissionTypeFromPrisma(
      record.submissionType,
    );
    const scoringCategory = ChallengeMapper.mapScoringCategoryFromPrisma(
      record.scoringCategory,
    );
    const status = ChallengeMapper.mapStatusFromPrisma(record.status);

    const result = Challenge.create({
      id: record.id,
      tripId: record.tripId,
      name: record.name,
      description: record.description,
      image: record.image,
      submissionType,
      scoringCategory,
      isRecurring: record.isRecurring,
      dailyStartTime: record.dailyStartTime,
      dailyEndTime: record.dailyEndTime,
      basePoints: record.basePoints,
      firstPlacePoints: record.firstPlacePoints,
      secondPlacePoints: record.secondPlacePoints,
      thirdPlacePoints: record.thirdPlacePoints,
      status,
      startTime: record.startTime,
      endTime: record.endTime,
      votingStartTime: record.votingStartTime,
      votingEndTime: record.votingEndTime,
      targetLatitude: record.targetLatitude,
      targetLongitude: record.targetLongitude,
      expectedValue: record.expectedValue,
      autoApprove: record.autoApprove,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });

    if (result.kind === "err") {
      throw new Error(`Failed to map Challenge from database: ${result.error}`);
    }

    return result.value;
  }

  /**
   * Convert a domain Challenge entity to Prisma create input
   */
  static toPrismaCreate(challenge: Challenge): {
    id: string;
    tripId: string;
    name: string;
    description: string | null;
    image: string | null;
    submissionType: string;
    scoringCategory: string;
    isRecurring: boolean;
    dailyStartTime: string | null;
    dailyEndTime: string | null;
    basePoints: number;
    firstPlacePoints: number | null;
    secondPlacePoints: number | null;
    thirdPlacePoints: number | null;
    status: string;
    startTime: Date | null;
    endTime: Date | null;
    votingStartTime: Date | null;
    votingEndTime: Date | null;
    targetLatitude: number | null;
    targetLongitude: number | null;
    expectedValue: string | null;
    autoApprove: boolean;
  } {
    return {
      id: challenge.id,
      tripId: challenge.tripId,
      name: challenge.name,
      description: challenge.description,
      image: challenge.image,
      submissionType: challenge.submissionType,
      scoringCategory: challenge.scoringCategory,
      isRecurring: challenge.isRecurring,
      dailyStartTime: challenge.dailyStartTime,
      dailyEndTime: challenge.dailyEndTime,
      basePoints: challenge.basePoints,
      firstPlacePoints: challenge.firstPlacePoints,
      secondPlacePoints: challenge.secondPlacePoints,
      thirdPlacePoints: challenge.thirdPlacePoints,
      status: challenge.status,
      startTime: challenge.startTime,
      endTime: challenge.endTime,
      votingStartTime: challenge.votingStartTime,
      votingEndTime: challenge.votingEndTime,
      targetLatitude: challenge.targetLatitude,
      targetLongitude: challenge.targetLongitude,
      expectedValue: challenge.expectedValue,
      autoApprove: challenge.autoApprove,
    };
  }

  /**
   * Convert a domain Challenge entity to Prisma update input
   */
  static toPrismaUpdate(challenge: Challenge): {
    name: string;
    description: string | null;
    image: string | null;
    submissionType: string;
    scoringCategory: string;
    isRecurring: boolean;
    dailyStartTime: string | null;
    dailyEndTime: string | null;
    basePoints: number;
    firstPlacePoints: number | null;
    secondPlacePoints: number | null;
    thirdPlacePoints: number | null;
    status: string;
    startTime: Date | null;
    endTime: Date | null;
    votingStartTime: Date | null;
    votingEndTime: Date | null;
    targetLatitude: number | null;
    targetLongitude: number | null;
    expectedValue: string | null;
    autoApprove: boolean;
  } {
    return {
      name: challenge.name,
      description: challenge.description,
      image: challenge.image,
      submissionType: challenge.submissionType,
      scoringCategory: challenge.scoringCategory,
      isRecurring: challenge.isRecurring,
      dailyStartTime: challenge.dailyStartTime,
      dailyEndTime: challenge.dailyEndTime,
      basePoints: challenge.basePoints,
      firstPlacePoints: challenge.firstPlacePoints,
      secondPlacePoints: challenge.secondPlacePoints,
      thirdPlacePoints: challenge.thirdPlacePoints,
      status: challenge.status,
      startTime: challenge.startTime,
      endTime: challenge.endTime,
      votingStartTime: challenge.votingStartTime,
      votingEndTime: challenge.votingEndTime,
      targetLatitude: challenge.targetLatitude,
      targetLongitude: challenge.targetLongitude,
      expectedValue: challenge.expectedValue,
      autoApprove: challenge.autoApprove,
    };
  }

  /**
   * Map Prisma submissionType string to SubmissionType enum
   */
  private static mapSubmissionTypeFromPrisma(type: string): SubmissionType {
    switch (type) {
      case "MULTI_IMAGE":
        return SubmissionType.MULTI_IMAGE;
      case "VIDEO":
        return SubmissionType.VIDEO;
      case "TEXT":
        return SubmissionType.TEXT;
      case "IMAGE_LOCATION":
        return SubmissionType.IMAGE_LOCATION;
      case "LOCATION":
        return SubmissionType.LOCATION;
      case "QR_CODE":
        return SubmissionType.QR_CODE;
      case "IMAGE":
      default:
        return SubmissionType.IMAGE;
    }
  }

  /**
   * Map Prisma scoringCategory string to ScoringCategory enum
   */
  private static mapScoringCategoryFromPrisma(
    category: string,
  ): ScoringCategory {
    switch (category) {
      case "SPEED":
        return ScoringCategory.SPEED;
      case "JUDGED_STAFF":
        return ScoringCategory.JUDGED_STAFF;
      case "PEER_VOTING":
        return ScoringCategory.PEER_VOTING;
      case "UNLIMITED":
      default:
        return ScoringCategory.UNLIMITED;
    }
  }

  /**
   * Map Prisma status string to ChallengeStatus enum
   */
  private static mapStatusFromPrisma(status: string): ChallengeStatus {
    switch (status) {
      case "VISIBLE":
        return ChallengeStatus.VISIBLE;
      case "ACTIVE":
        return ChallengeStatus.ACTIVE;
      case "VOTING_PHASE":
        return ChallengeStatus.VOTING_PHASE;
      case "COMPLETED":
        return ChallengeStatus.COMPLETED;
      case "CANCELLED":
        return ChallengeStatus.CANCELLED;
      case "HIDDEN":
      default:
        return ChallengeStatus.HIDDEN;
    }
  }
}
