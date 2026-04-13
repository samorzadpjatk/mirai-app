import { Effect } from "effect";
import {
  Challenge,
  ChallengeStatus,
  SubmissionType,
  ScoringCategory,
} from "@mirai-app/domain";
import type { DrizzleEntityMapper } from "../../gateways/base/repository";
import type {
  challenges,
  ChallengeSelect,
  ChallengeInsert,
} from "@mirai-app/frameworks/drizzle";

/**
 * ChallengeDrizzleMapper
 *
 * Maps between Drizzle database records and domain Challenge entities.
 */
export class ChallengeDrizzleMapper implements DrizzleEntityMapper<
  Challenge,
  ChallengeSelect,
  ChallengeInsert
> {
  /**
   * Convert a Drizzle Challenge record to a domain Challenge entity
   */
  toDomain(record: ChallengeSelect): Challenge {
    const submissionType = this.mapSubmissionTypeFromDrizzle(
      record.submissionType,
    );
    const scoringCategory = this.mapScoringCategoryFromDrizzle(
      record.scoringCategory,
    );
    const status = this.mapStatusFromDrizzle(record.status);

    const effect = Challenge.create({
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

    // Run the Effect synchronously
    const exit = Effect.runSyncExit(effect);

    // This should never fail if database has valid data
    if (exit._tag === "Failure") {
      throw new Error(`Failed to map Challenge from Drizzle: ${exit.cause}`);
    }

    return exit.value;
  }

  /**
   * Convert a domain Challenge entity to Drizzle insert input
   */
  toDrizzleInsert(challenge: Challenge): ChallengeInsert {
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
      createdAt: challenge.createdAt,
      updatedAt: challenge.updatedAt,
    };
  }

  /**
   * Convert a domain Challenge entity to Drizzle update input
   */
  toDrizzleUpdate(challenge: Challenge): Partial<ChallengeInsert> {
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
      updatedAt: new Date(),
    };
  }

  private mapSubmissionTypeFromDrizzle(type: string): SubmissionType {
    return (
      SubmissionType[type as keyof typeof SubmissionType] ??
      SubmissionType.IMAGE
    );
  }

  private mapScoringCategoryFromDrizzle(category: string): ScoringCategory {
    return (
      ScoringCategory[category as keyof typeof ScoringCategory] ??
      ScoringCategory.SPEED
    );
  }

  private mapStatusFromDrizzle(status: string): ChallengeStatus {
    return (
      ChallengeStatus[status as keyof typeof ChallengeStatus] ??
      ChallengeStatus.HIDDEN
    );
  }

  /**
   * Singleton instance for reuse
   */
  static readonly instance = new ChallengeDrizzleMapper();
}
