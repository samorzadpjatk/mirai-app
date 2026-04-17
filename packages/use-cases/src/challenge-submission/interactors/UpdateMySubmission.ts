import { Effect, Data } from "effect";
import type { ApplicationError } from "@mirai-app/domain";
import { ChallengePortTag } from "../../challenge/ports/ChallengePort";
import {
  ChallengeSubmissionPort,
  type ChallengeSubmission,
} from "../ports/ChallengeSubmissionPort";
import { TripParticipantPort } from "../../user/ports/TripParticipantPort";
import {
  SubmissionNotFoundError,
  CannotEditApprovedSubmissionError,
  ChallengeNotActiveError,
  SubmissionWindowClosedError,
  NotGroupMemberError,
  MissingRequiredMediaError,
} from "../errors/SubmissionErrors";
import type { SubmissionWithDetailsDTO } from "../dto/ChallengeSubmissionDTOs";

/**
 * Input for UpdateMySubmissionUseCase
 */
export interface UpdateMySubmissionInput {
  submissionId: string;
  tripId: string;
  userId: string;
  imageIds?: string[];
  videoId?: string;
  textContent?: string;
  latitude?: number;
  longitude?: number;
}

/**
 * Update My Submission Use Case
 *
 * Updates the current user's submission if not yet approved.
 */
export class UpdateMySubmissionUseCase {
  execute(
    input: UpdateMySubmissionInput,
  ): Effect.Effect<
    SubmissionWithDetailsDTO,
    | SubmissionNotFoundError
    | CannotEditApprovedSubmissionError
    | ChallengeNotActiveError
    | SubmissionWindowClosedError
    | NotGroupMemberError
    | MissingRequiredMediaError
    | ApplicationError,
    ChallengePortTag | ChallengeSubmissionPort | TripParticipantPort
  > {
    return Effect.gen(function* () {
      const challengePort = yield* ChallengePortTag;
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

      // Get challenge to verify it's still active
      const challenge = yield* challengePort.findById(submission.challengeId);
      if (!challenge || challenge.status !== "ACTIVE") {
        return yield* Effect.fail(
          new ChallengeNotActiveError({
            challengeId: submission.challengeId,
            currentStatus: challenge?.status ?? "UNKNOWN",
          }),
        );
      }

      if (challenge.endTime && challenge.endTime <= new Date()) {
        return yield* Effect.fail(
          new SubmissionWindowClosedError({
            challengeId: challenge.id,
            endTime: challenge.endTime,
          }),
        );
      }

      // Update submission
      const updated: ChallengeSubmission = {
        ...submission,
        imageIds: input.imageIds ?? submission.imageIds,
        videoId: input.videoId ?? submission.videoId,
        textContent: input.textContent ?? submission.textContent,
        latitude: input.latitude ?? submission.latitude,
        longitude: input.longitude ?? submission.longitude,
        status: "PENDING",
        reviewedAt: null,
        reviewedById: null,
        rejectionReason: null,
        updatedAt: new Date(),
      };

      const saved = yield* submissionPort.update(updated);

      return {
        id: saved.id,
        challengeId: saved.challengeId,
        groupId: saved.groupId,
        imageIds: saved.imageIds,
        videoId: saved.videoId,
        textContent: saved.textContent,
        latitude: saved.latitude,
        longitude: saved.longitude,
        status: saved.status,
        reviewedById: saved.reviewedById,
        reviewedAt: saved.reviewedAt,
        rejectionReason: saved.rejectionReason,
        awardedPoints: saved.awardedPoints ?? 0,
        bonusPoints: saved.bonusPoints ?? 0,
        ranking: saved.ranking,
        voteCount: saved.voteCount,
        voteScore: saved.voteScore,
        createdAt: saved.createdAt,
        updatedAt: saved.updatedAt,
        group: null,
        reviewedBy: null,
        challenge: null,
      };
    });
  }
}
