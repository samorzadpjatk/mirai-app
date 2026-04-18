import { Effect, Data } from "effect";
import type { ApplicationError, ChallengeSubmissionId } from "@mirai-app/domain";
import { ChallengeSubmissionPort } from "../ports/ChallengeSubmissionPort";
import { SubmissionNotFoundError } from "../errors/SubmissionErrors";
import { ChallengeSubmissionId as ChallengeSubmissionIdFactory } from "@mirai-app/domain";

/**
 * Input for AdminDeleteSubmissionUseCase
 */
export interface AdminDeleteSubmissionInput {
  submissionId: string;
}

/**
 * Admin Delete Submission Result
 */
export interface AdminDeleteSubmissionResult {
  success: boolean;
}

/**
 * Admin Delete Submission Use Case
 *
 * Admin can delete any submission regardless of status.
 */
export class AdminDeleteSubmissionUseCase {
  execute(input: AdminDeleteSubmissionInput) {
    return Effect.gen(function* () {
      const submissionPort = yield* ChallengeSubmissionPort;

      // Convert string to branded ID
      const submissionId = ChallengeSubmissionIdFactory.create(input.submissionId);

      // Check if submission exists
      const submission = yield* submissionPort.findById(submissionId);

      if (!submission) {
        return yield* Effect.fail(
          new SubmissionNotFoundError({ submissionId: input.submissionId }),
        );
      }

      // Delete submission
      yield* submissionPort.delete(submissionId);

      return { success: true };
    });
  }
}
