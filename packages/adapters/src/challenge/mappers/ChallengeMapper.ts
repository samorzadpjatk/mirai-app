import type {
  ChallengeSelect,
  ChallengeInsert,
} from "../../infrastructure/drizzle";
import {
  Challenge,
  ChallengeId,
  TripId,
  type ValidationError,
  type SubmissionType,
  type ScoringCategory,
  type ChallengeStatus,
} from "@mirai-app/domain";
import type { Effect } from "effect";

/**
 * Challenge Mapper
 *
 * Maps between database Challenge records and domain Challenge entities.
 */
export class ChallengeMapper {
  /**
   * Convert database record to domain entity
   */
  toDomain(
    dbChallenge: ChallengeSelect,
  ): Effect.Effect<Challenge, ValidationError, never> {
    return Challenge.create({
      id: ChallengeId.unsafeCreate(dbChallenge.id),
      tripId: TripId.unsafeCreate(dbChallenge.tripId),
      name: dbChallenge.name,
      description: dbChallenge.description ?? null,
      image: dbChallenge.image ?? null,
      submissionType: dbChallenge.submissionType as SubmissionType,
      scoringCategory: dbChallenge.scoringCategory as ScoringCategory,
      isRecurring: dbChallenge.isRecurring,
      dailyStartTime: dbChallenge.dailyStartTime ?? null,
      dailyEndTime: dbChallenge.dailyEndTime ?? null,
      basePoints: dbChallenge.basePoints,
      firstPlacePoints: dbChallenge.firstPlacePoints ?? null,
      secondPlacePoints: dbChallenge.secondPlacePoints ?? null,
      thirdPlacePoints: dbChallenge.thirdPlacePoints ?? null,
      status: dbChallenge.status as ChallengeStatus,
      startTime: dbChallenge.startTime ?? null,
      endTime: dbChallenge.endTime ?? null,
      votingStartTime: dbChallenge.votingStartTime ?? null,
      votingEndTime: dbChallenge.votingEndTime ?? null,
      targetLatitude: dbChallenge.targetLatitude ?? null,
      targetLongitude: dbChallenge.targetLongitude ?? null,
      expectedValue: dbChallenge.expectedValue ?? null,
      autoApprove: dbChallenge.autoApprove,
      createdAt: dbChallenge.createdAt,
      updatedAt: dbChallenge.updatedAt,
    });
  }

  /**
   * Convert domain entity to database insert format
   */
  toInsert(challenge: Challenge): ChallengeInsert {
    return {
      id: ChallengeId.toString(challenge.id),
      tripId: TripId.toString(challenge.tripId),
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
   * Convert domain entity to database update format
   */
  toUpdate(
    challenge: Challenge,
  ): Omit<ChallengeInsert, "id" | "tripId" | "createdAt"> {
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
}

export const challengeMapper = new ChallengeMapper();
