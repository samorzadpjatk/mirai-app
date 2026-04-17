import { Effect, Data } from "effect";
import type { ApplicationError } from "@mirai-app/domain";
import { ChallengeSubmissionPort } from "../ports/ChallengeSubmissionPort";
import { SubmissionNotFoundError } from "../errors/SubmissionErrors";

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
  execute(
    input: AdminDeleteSubmissionInput,
  ): Effect.Effect<
    AdminDeleteSubmissionResult,
    SubmissionNotFoundError | ApplicationError,
    ChallengeSubmissionPort
  > {
    return Effect.gen(function* () {
      const submissionPort = yield* ChallengeSubmissionPort;

      // Check if submission exists
      const submission = yield* submissionPort.findById(input.submissionId);

      if (!submission) {
        return yield* Effect.fail(
          new SubmissionNotFoundError({ submissionId: input.submissionId }),
        );
      }

      // Delete submission
      yield* submissionPort.delete(input.submissionId);

      return { success: true };
    });
  }
}
