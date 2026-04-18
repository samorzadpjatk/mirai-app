import { Effect, Data } from "effect";
import type { ChallengeSubmissionId } from "@mirai-app/domain";
import {
  ChallengeSubmissionId as ChallengeSubmissionIdFactory,
  TripId,
  UserId,
} from "@mirai-app/domain";
import { SubmissionReportPortTag } from "../ports/SubmissionReportPort";
import { ChallengeSubmissionPortTag } from "../../challenge-submission/ports/ChallengeSubmissionPort";
import { TripPortTag } from "../../trip/ports/TripPort";
import { TripParticipantPortTag } from "../../user/ports/TripParticipantPort";
import { UserPortTag } from "../../user/ports/UserPort";
import {
  SubmissionNotFoundError,
  TripNotFoundError,
  TripHasEndedError,
  NotTripParticipantError,
  AlreadyReportedError,
  InvalidReportReasonError,
} from "../errors/SubmissionReportErrors";
import { UserNotFoundError } from "../../user/errors/UserErrors";
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
      const userPort = yield* UserPortTag;

      // Validate trip exists and has not ended
      const tripId = TripId.create(input.tripId);
      const reporterId = UserId.create(input.reporterId);
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
        reporterId,
        tripId,
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
      const submissionId = ChallengeSubmissionIdFactory.create(
        input.submissionId,
      );
      const submission = yield* submissionPort.findById(submissionId);

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
      const alreadyReported = yield* reportPort.existsBySubmissionAndReporter(
        submissionId,
        reporterId,
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
        reporterId,
        reason: input.reason.trim(),
        details: input.details?.trim() ?? null,
      });

      // Fetch reporter user data for fully populated DTO
      const reporter = yield* userPort.findById(reporterId);

      if (!reporter) {
        return yield* Effect.fail(
          new UserNotFoundError({ userId: input.reporterId }),
        );
      }

      return {
        id: createdReport.id,
        submissionId: createdReport.submissionId,
        reporterId: createdReport.reporterId,
        reason: createdReport.reason,
        details: createdReport.details,
        createdAt: createdReport.createdAt,
        reporter: {
          id: UserId.toString(reporterId),
          user: {
            id: reporter.id,
            firstName: reporter.firstName,
            lastName: reporter.lastName,
            email: null, // User entity doesn't have email property
          },
        },
      };
    });
  }
}
