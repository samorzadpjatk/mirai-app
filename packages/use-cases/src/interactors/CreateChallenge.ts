import type { Result } from "@repo/domain";
import {
  ok,
  err,
  Challenge,
  ChallengeStatus,
  SubmissionType,
  ScoringCategory,
} from "@repo/domain";
import type { ChallengeRepository } from "../ports/ChallengeRepository";
import { inject, injectable } from "inversify";
import { TYPES } from "@repo/frameworks/di";

/**
 * Input for CreateChallenge use case
 */
export interface CreateChallengeInput {
  tripId: string;
  name: string;
  description?: string | null;
  image?: string | null;
  submissionType: SubmissionType;
  scoringCategory: ScoringCategory;
  isRecurring?: boolean;
  dailyStartTime?: string | null;
  dailyEndTime?: string | null;
  basePoints?: number;
  firstPlacePoints?: number | null;
  secondPlacePoints?: number | null;
  thirdPlacePoints?: number | null;
  status?: ChallengeStatus;
  startTime?: Date | null;
  endTime?: Date | null;
  targetLatitude?: number | null;
  targetLongitude?: number | null;
  expectedValue?: string | null;
  autoApprove?: boolean;
}

/**
 * Output DTO for CreateChallenge use case
 */
export interface CreateChallengeOutput {
  id: string;
  tripId: string;
  name: string;
  description: string | null;
  submissionType: string;
  scoringCategory: string;
  status: string;
  basePoints: number;
  createdAt: Date;
}

/**
 * CreateChallenge Use Case
 *
 * Creates a new challenge.
 * Returns error if validation fails.
 */
@injectable()
export class CreateChallengeUseCase {
  constructor(
    @inject(TYPES.ChallengeRepository)
    private challengeRepository: ChallengeRepository,
  ) {}

  async execute(
    input: CreateChallengeInput,
  ): Promise<Result<CreateChallengeOutput, string>> {
    // Create domain entity
    const challengeResult = Challenge.create({
      tripId: input.tripId,
      name: input.name,
      ...(input.description !== undefined && {
        description: input.description,
      }),
      ...(input.image !== undefined && { image: input.image }),
      submissionType: input.submissionType,
      scoringCategory: input.scoringCategory,
      ...(input.isRecurring !== undefined && {
        isRecurring: input.isRecurring,
      }),
      ...(input.dailyStartTime !== undefined && {
        dailyStartTime: input.dailyStartTime,
      }),
      ...(input.dailyEndTime !== undefined && {
        dailyEndTime: input.dailyEndTime,
      }),
      ...(input.basePoints !== undefined && { basePoints: input.basePoints }),
      ...(input.firstPlacePoints !== undefined && {
        firstPlacePoints: input.firstPlacePoints,
      }),
      ...(input.secondPlacePoints !== undefined && {
        secondPlacePoints: input.secondPlacePoints,
      }),
      ...(input.thirdPlacePoints !== undefined && {
        thirdPlacePoints: input.thirdPlacePoints,
      }),
      status: input.status ?? ChallengeStatus.HIDDEN,
      ...(input.startTime !== undefined && { startTime: input.startTime }),
      ...(input.endTime !== undefined && { endTime: input.endTime }),
      ...(input.targetLatitude !== undefined && {
        targetLatitude: input.targetLatitude,
      }),
      ...(input.targetLongitude !== undefined && {
        targetLongitude: input.targetLongitude,
      }),
      ...(input.expectedValue !== undefined && {
        expectedValue: input.expectedValue,
      }),
      ...(input.autoApprove !== undefined && {
        autoApprove: input.autoApprove,
      }),
    });

    if (challengeResult.kind === "err") {
      return err(challengeResult.error);
    }

    // Persist challenge
    const saved = await this.challengeRepository.create(challengeResult.value);

    return ok(this.toOutput(saved));
  }

  private toOutput(challenge: Challenge): CreateChallengeOutput {
    return {
      id: challenge.id,
      tripId: challenge.tripId,
      name: challenge.name,
      description: challenge.description,
      submissionType: challenge.submissionType,
      scoringCategory: challenge.scoringCategory,
      status: challenge.status,
      basePoints: challenge.basePoints,
      createdAt: challenge.createdAt,
    };
  }
}
