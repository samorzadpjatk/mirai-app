import { Effect, Data } from "effect";
import type { ApplicationError } from "@mirai-app/domain";
import { ChallengeSubmissionPort } from "../ports/ChallengeSubmissionPort";
import { TripParticipantPort } from "../../user/ports/TripParticipantPort";
import {
  SubmissionNotFoundError,
  CannotEditApprovedSubmissionError,
  NotGroupMemberError,
} from "../errors/SubmissionErrors";

/**
 * Input for DeleteMySubmissionUseCase
 */
export interface DeleteMySubmissionInput {
  submissionId: string;
  tripId: string;
  userId: string;
}

/**
 * Delete My Submission Result
 */
export interface DeleteMySubmissionResult {
  success: boolean;
}

/**
 * Delete My Submission Use Case
 *
 * Deletes the current user's submission if not yet approved.
 */
export class DeleteMySubmissionUseCase {
  execute(
    input: DeleteMySubmissionInput,
  ): Effect.Effect<
    DeleteMySubmissionResult,
    | SubmissionNotFoundError
    | CannotEditApprovedSubmissionError
    | NotGroupMemberError
    | ApplicationError,
    ChallengeSubmissionPort | TripParticipantPort
  > {
    return Effect.gen(function* () {
      const submissionPort = yield* ChallengeSubmissionPort;
      const participantPort = yield* TripParticipantPort;

      // Get participant info
      const participant = yield* participantPort.findByUserAndTrip(
        input.userId,
        input.tripId,
      );

      if (!participant?.groupId) {
        return yield* Effect.fail(
          new NotGroupMemberError({
            userId: input.userId,
            tripId: input.tripId,
          }),
        );
      }

      // Find submission
      const submission = yield* submissionPort.findById(input.submissionId);

      if (!submission) {
        return yield* Effect.fail(
          new SubmissionNotFoundError({ submissionId: input.submissionId }),
        );
      }

      // Verify ownership
      if (submission.groupId !== participant.groupId) {
        return yield* Effect.fail(
          new SubmissionNotFoundError({ submissionId: input.submissionId }),
        );
      }

      // Check if already approved
      if (submission.status === "APPROVED") {
        return yield* Effect.fail(
          new CannotEditApprovedSubmissionError({
            submissionId: input.submissionId,
          }),
        );
      }

      // Delete submission
      yield* submissionPort.delete(input.submissionId);

      return { success: true };
    });
  }
}
