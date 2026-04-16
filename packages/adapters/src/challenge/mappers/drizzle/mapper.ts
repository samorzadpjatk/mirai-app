import { Effect } from "effect";
import {
  Challenge,
  ChallengeStatus,
  SubmissionType,
  ScoringCategory,
} from "@mirai-app/domain";
import type { ChallengeDTO } from "@mirai-app/use-cases";
import type { DrizzleEntityMapper } from "../../../system/shared/gateways/drizzle-base";
import type {
  challenges,
  ChallengeSelect,
  ChallengeInsert,
} from "@mirai-app/frameworks/drizzle";

/**
 * ChallengeDrizzleMapper
 *
 * Maps between Drizzle database records and ChallengeDTOs.
 * Follows the UserGateway pattern for DTO-based gateway implementations.
 */
export class ChallengeDrizzleMapper implements DrizzleEntityMapper<
  ChallengeDTO,
  ChallengeSelect,
  ChallengeInsert
> {
  /**
   * Convert a Drizzle Challenge record to a ChallengeDTO
   */
  toDTO(record: ChallengeSelect): ChallengeDTO {
    return {
      id: record.id,
      tripId: record.tripId,
      title: record.name,
      description: record.description,
      status: this.mapStatusFromDrizzle(record.status),
      scoringCategory: this.mapScoringCategoryFromDrizzle(
        record.scoringCategory,
      ),
      points: record.basePoints,
      maxPoints: null,
      startDate: record.startTime,
      endDate: record.endTime,
      createdById: "",
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  /**
   * Convert a Drizzle Challenge record to a domain Challenge entity
   * (kept for backward compatibility and when domain entity is needed)
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
   * Convert a ChallengeDTO to Drizzle insert input
   */
  toDrizzleInsert(dto: ChallengeDTO): ChallengeInsert {
    return {
      id: dto.id,
      tripId: dto.tripId,
      name: dto.title,
      description: dto.description,
      image: null,
      submissionType: "IMAGE",
      scoringCategory: dto.scoringCategory,
      isRecurring: false,
      dailyStartTime: null,
      dailyEndTime: null,
      basePoints: dto.points,
      firstPlacePoints: null,
      secondPlacePoints: null,
      thirdPlacePoints: null,
      status: dto.status,
      startTime: dto.startDate,
      endTime: dto.endDate,
      votingStartTime: null,
      votingEndTime: null,
      targetLatitude: null,
      targetLongitude: null,
      expectedValue: null,
      autoApprove: false,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    };
  }

  /**
   * Convert a ChallengeDTO to Drizzle update input
   */
  toDrizzleUpdate(dto: ChallengeDTO): Partial<ChallengeInsert> {
    return {
      name: dto.title,
      description: dto.description,
      scoringCategory: dto.scoringCategory,
      basePoints: dto.points,
      status: dto.status,
      startTime: dto.startDate,
      endTime: dto.endDate,
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
