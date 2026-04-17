import { Effect, Data } from "effect";
import type { ChallengeSubmissionId } from "@mirai-app/domain";
import {
  ChallengeSubmissionId as ChallengeSubmissionIdType,
  TripId,
} from "@mirai-app/domain";
import { SubmissionReportPortTag } from "../ports/SubmissionReportPort";
import { ChallengeSubmissionPortTag } from "../../challenge-submission/ports/ChallengeSubmissionPort";
import { TripPortTag } from "../../trip/ports/TripPort";
import { TripParticipantPortTag } from "../../user/ports/TripParticipantPort";
import {
  SubmissionNotFoundError,
  TripNotFoundError,
  TripHasEndedError,
  NotTripParticipantError,
  AlreadyReportedError,
  InvalidReportReasonError,
} from "../errors/SubmissionReportErrors";
import type {
  CreateSubmissionReportInputDTO,
  CreateSubmissionReportResultDTO,
} from "../dto/SubmissionReportDTOs";
import type { SubmissionReportId } from "@mirai-app/domain";

/**
 * Create Submission Report Use Case
 *
 * Creates a new report on a submission after validating:
 * - Trip exists and has not ended
 * - User is a participant in the trip
 * - Submission exists and belongs to the trip
 * - User has not already reported this submission
 */
export class CreateSubmissionReportUseCase {
  execute(input: CreateSubmissionReportInputDTO) {
    return Effect.gen(function* () {
      const reportPort = yield* SubmissionReportPortTag;
      const submissionPort = yield* ChallengeSubmissionPortTag;
      const tripPort = yield* TripPortTag;
      const participantPort = yield* TripParticipantPortTag;

      // Validate trip exists and has not ended
      const tripId = TripId.create(input.tripId);
      const trip = yield* tripPort.findById(tripId);

      if (!trip) {
        return yield* Effect.fail(
          new TripNotFoundError({ tripId: input.tripId }),
        );
      }

      if (trip.hasEnded()) {
        return yield* Effect.fail(
          new TripHasEndedError({ tripId: input.tripId }),
        );
      }

      // Validate user is a participant in the trip
      const isParticipant = yield* participantPort.isParticipant(
        input.reporterId,
        input.tripId,
      );

      if (!isParticipant) {
        return yield* Effect.fail(
          new NotTripParticipantError({
            userId: input.reporterId,
            tripId: input.tripId,
          }),
        );
      }

      // Validate submission exists
      const submission = yield* submissionPort.findById(input.submissionId);

      if (!submission) {
        return yield* Effect.fail(
          new SubmissionNotFoundError({ submissionId: input.submissionId }),
        );
      }

      // Validate reason is not empty
      if (!input.reason.trim()) {
        return yield* Effect.fail(
          new InvalidReportReasonError({
            reason: input.reason,
            message: "Reason is required",
          }),
        );
      }

      // Check if user already reported this submission
      const submissionId = ChallengeSubmissionIdType.create(input.submissionId);
      const alreadyReported = yield* reportPort.existsBySubmissionAndReporter(
        submissionId,
        input.reporterId,
      );

      if (alreadyReported) {
        return yield* Effect.fail(
          new AlreadyReportedError({
            submissionId: input.submissionId,
            reporterId: input.reporterId,
          }),
        );
      }

      // Create the report
      const now = new Date();
      const createdReport = yield* reportPort.create({
        submissionId,
        reporterId: input.reporterId,
        reason: input.reason.trim(),
        details: input.details?.trim() ?? null,
      });

      return {
        id: createdReport.id,
        submissionId: createdReport.submissionId,
        reporterId: createdReport.reporterId,
        reason: createdReport.reason,
        details: createdReport.details,
        createdAt: createdReport.createdAt,
        reporter: null, // Will be hydrated by adapter
      };
    });
  }
}
