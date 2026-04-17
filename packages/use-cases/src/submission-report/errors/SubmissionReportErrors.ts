import { Data } from "effect";

/**
 * Submission not found error
 */
export class SubmissionNotFoundError extends Data.TaggedError(
  "SubmissionNotFoundError",
)<{
  submissionId: string;
}> {}

/**
 * Trip not found error
 */
export class TripNotFoundError extends Data.TaggedError("TripNotFoundError")<{
  tripId: string;
}> {}

/**
 * Trip has ended error
 */
export class TripHasEndedError extends Data.TaggedError("TripHasEndedError")<{
  tripId: string;
}> {}

/**
 * Not a trip participant error
 */
export class NotTripParticipantError extends Data.TaggedError(
  "NotTripParticipantError",
)<{
  userId: string;
  tripId: string;
}> {}

/**
 * Already reported error
 */
export class AlreadyReportedError extends Data.TaggedError(
  "AlreadyReportedError",
)<{
  submissionId: string;
  reporterId: string;
}> {}

/**
 * Report not found error
 */
export class ReportNotFoundError extends Data.TaggedError(
  "ReportNotFoundError",
)<{
  reportId: string;
}> {}

/**
 * Invalid report reason error
 */
export class InvalidReportReasonError extends Data.TaggedError(
  "InvalidReportReasonError",
)<{
  reason: string;
  message: string;
}> {}
