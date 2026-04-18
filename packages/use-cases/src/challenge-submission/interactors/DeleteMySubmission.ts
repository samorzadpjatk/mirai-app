import { Effect, Data } from "effect";
import type { ApplicationError, ChallengeSubmissionId, GroupId, UserId, TripId } from "@mirai-app/domain";
import { ChallengeSubmissionPort } from "../ports/ChallengeSubmissionPort";
import { TripParticipantPort } from "../../user/ports/TripParticipantPort";
import {
  SubmissionNotFoundError,
  CannotEditApprovedSubmissionError,
  NotGroupMemberError,
} from "../errors/SubmissionErrors";
import { ChallengeSubmissionId as ChallengeSubmissionIdFactory, GroupId as GroupIdFactory, UserId as UserIdFactory, TripId as TripIdFactory } from "@mirai-app/domain";

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
  execute(input: DeleteMySubmissionInput) {
    return Effect.gen(function* () {
      const submissionPort = yield* ChallengeSubmissionPort;
      const participantPort = yield* TripParticipantPort;

      // Get participant info
      const participant = yield* participantPort.findByUserAndTrip(
        UserIdFactory.create(input.userId),
        TripIdFactory.create(input.tripId),
      );

      if (!participant?.groupId) {
        return yield* Effect.fail(
          new NotGroupMemberError({
            userId: input.userId,
            tripId: input.tripId,
          }),
        );
      }

      // Convert strings to branded IDs
      const submissionId = ChallengeSubmissionIdFactory.create(input.submissionId);
      const participantGroupId = GroupIdFactory.create(participant.groupId);

      // Find submission
      const submission = yield* submissionPort.findById(submissionId);

      if (!submission) {
        return yield* Effect.fail(
          new SubmissionNotFoundError({ submissionId: input.submissionId }),
        );
      }

      // Verify ownership - convert submission.groupId to string for comparison
      if (GroupIdFactory.toString(submission.groupId) !== GroupIdFactory.toString(participantGroupId)) {
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
      yield* submissionPort.delete(submissionId);

      return { success: true };
    });
  }
}
