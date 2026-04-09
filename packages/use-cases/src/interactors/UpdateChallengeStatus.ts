import type { Result } from "@mirai-app/domain";
import { ok, err, ChallengeStatus } from "@mirai-app/domain";
import type { ChallengeRepository } from "../ports/ChallengeRepository";
import type { Challenge } from "@mirai-app/domain";

/**
 * Input for UpdateChallengeStatus use case
 */
export interface UpdateChallengeStatusInput {
  challengeId: string;
  newStatus: ChallengeStatus;
}

/**
 * Output DTO for UpdateChallengeStatus use case
 */
export interface UpdateChallengeStatusOutput {
  id: string;
  tripId: string;
  name: string;
  previousStatus: string;
  newStatus: string;
  updatedAt: Date;
}

/**
 * UpdateChallengeStatus Use Case
 *
 * Updates a challenge's status with workflow validation.
 * Returns error if challenge not found or transition is invalid.
 */
export class UpdateChallengeStatusUseCase {
  constructor(private challengeRepository: ChallengeRepository) {}

  async execute(
    input: UpdateChallengeStatusInput,
  ): Promise<Result<UpdateChallengeStatusOutput, string>> {
    // Find existing challenge
    const challenge = await this.challengeRepository.findById(
      input.challengeId,
    );
    if (!challenge) {
      return err("Challenge not found");
    }

    const previousStatus = challenge.status;

    // Check if transition is valid
    if (!challenge.canTransitionTo(input.newStatus)) {
      return err(
        `Invalid status transition from ${previousStatus} to ${input.newStatus}`,
      );
    }

    // Apply status update
    try {
      const updatedChallenge = challenge.updateStatus(input.newStatus);

      // Persist changes
      const saved = await this.challengeRepository.update(updatedChallenge);

      return ok({
        id: saved.id,
        tripId: saved.tripId,
        name: saved.name,
        previousStatus,
        newStatus: saved.status,
        updatedAt: saved.updatedAt,
      });
    } catch (error) {
      return err(`Failed to update status: ${error}`);
    }
  }
}
