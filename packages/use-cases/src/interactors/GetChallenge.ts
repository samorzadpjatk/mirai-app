import type { Result } from "@repo/domain";
import { ok, err } from "@repo/domain";
import type { ChallengeRepository } from "../ports/ChallengeRepository";
import type { Challenge, ChallengeStatus } from "@repo/domain";
import { inject, injectable } from "inversify";
import { TYPES } from "@repo/frameworks/di";

/**
 * Input for GetChallenge use case
 */
export interface GetChallengeInput {
  challengeId: string;
}

/**
 * Output DTO for GetChallenge use case
 */
export interface GetChallengeOutput {
  id: string;
  tripId: string;
  name: string;
  description: string | null;
  image: string | null;
  submissionType: string;
  scoringCategory: string;
  isRecurring: boolean;
  basePoints: number;
  status: string;
  startTime: Date | null;
  endTime: Date | null;
  targetLatitude: number | null;
  targetLongitude: number | null;
  expectedValue: string | null;
  autoApprove: boolean;
  createdAt: Date;
  isActive: boolean;
  isOpenForSubmission: boolean;
  requiresLocation: boolean;
  requiresQRCode: boolean;
  hasVotingPhase: boolean;
}

/**
 * GetChallenge Use Case
 *
 * Retrieves a challenge by ID.
 * Returns error if challenge not found.
 */
@injectable()
export class GetChallengeUseCase {
  constructor(
    @inject(TYPES.ChallengeRepository)
    private challengeRepository: ChallengeRepository,
  ) {}

  async execute(
    input: GetChallengeInput,
  ): Promise<Result<GetChallengeOutput, string>> {
    const challenge = await this.challengeRepository.findById(
      input.challengeId,
    );

    if (!challenge) {
      return err("Challenge not found");
    }

    return ok(this.toOutput(challenge));
  }

  private toOutput(challenge: Challenge): GetChallengeOutput {
    return {
      id: challenge.id,
      tripId: challenge.tripId,
      name: challenge.name,
      description: challenge.description,
      image: challenge.image,
      submissionType: challenge.submissionType,
      scoringCategory: challenge.scoringCategory,
      isRecurring: challenge.isRecurring,
      basePoints: challenge.basePoints,
      status: challenge.status,
      startTime: challenge.startTime,
      endTime: challenge.endTime,
      targetLatitude: challenge.targetLatitude,
      targetLongitude: challenge.targetLongitude,
      expectedValue: challenge.expectedValue,
      autoApprove: challenge.autoApprove,
      createdAt: challenge.createdAt,
      isActive: challenge.isActive(),
      isOpenForSubmission: challenge.isOpenForSubmission(),
      requiresLocation: challenge.requiresLocation(),
      requiresQRCode: challenge.requiresQRCode(),
      hasVotingPhase: challenge.hasVotingPhase(),
    };
  }
}
