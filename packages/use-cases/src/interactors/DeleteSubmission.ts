import type { Result } from "@mirai-app/domain";
import { ok, err, SubmissionId } from "@mirai-app/domain";
import type { ChallengeSubmissionRepository } from "../ports/ChallengeSubmissionRepository";

/**
 * Input for DeleteSubmission use case
 */
export interface DeleteSubmissionInput {
  submissionId: SubmissionId;
}

/**
 * Output DTO for DeleteSubmission use case
 */
export interface DeleteSubmissionOutput {
  success: boolean;
}

/**
 * DeleteSubmission Use Case
 *
 * Deletes a submission by ID.
 * Returns error if submission not found or cannot be deleted (e.g., already approved).
 */
export class DeleteSubmissionUseCase {
  constructor(private submissionRepository: ChallengeSubmissionRepository) {}

  async execute(
    input: DeleteSubmissionInput,
  ): Promise<Result<DeleteSubmissionOutput, string>> {
    // Find existing submission
    const existing = await this.submissionRepository.findById(
      input.submissionId,
    );
    if (!existing) {
      return err("Submission not found");
    }

    // Check if can be deleted
    if (!existing.canDelete()) {
      return err("Cannot delete an approved or rejected submission");
    }

    // Delete submission
    await this.submissionRepository.delete(input.submissionId);

    return ok({ success: true });
  }
}
