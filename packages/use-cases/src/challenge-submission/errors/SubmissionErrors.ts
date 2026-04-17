import { Data } from "effect";

/**
 * ChallengeSubmission-related errors for use cases
 */

export class SubmissionNotFoundError extends Data.TaggedError(
  "SubmissionNotFoundError",
)<{
  submissionId: string;
}> {}

export class SubmissionValidationError extends Data.TaggedError(
  "SubmissionValidationError",
)<{
  field: string;
  message: string;
}> {}

export class ChallengeNotActiveError extends Data.TaggedError(
  "ChallengeNotActiveError",
)<{
  challengeId: string;
  currentStatus: string;
}> {}

export class SubmissionWindowClosedError extends Data.TaggedError(
  "SubmissionWindowClosedError",
)<{
  challengeId: string;
  endTime: Date;
}> {}

export class SubmissionAlreadyExistsError extends Data.TaggedError(
  "SubmissionAlreadyExistsError",
)<{
  challengeId: string;
  groupId: string;
}> {}

export class CannotEditApprovedSubmissionError extends Data.TaggedError(
  "CannotEditApprovedSubmissionError",
)<{
  submissionId: string;
}> {}

export class InvalidSubmissionTypeError extends Data.TaggedError(
  "InvalidSubmissionTypeError",
)<{
  submissionType: string;
  message: string;
}> {}

export class MissingRequiredMediaError extends Data.TaggedError(
  "MissingRequiredMediaError",
)<{
  submissionType: string;
  required: string;
}> {}

export class InvalidQrCodeError extends Data.TaggedError("InvalidQrCodeError")<{
  submittedValue: string | undefined;
}> {}

export class InvalidLocationError extends Data.TaggedError(
  "InvalidLocationError",
)<{
  latitude: number;
  longitude: number;
  targetLatitude: number;
  targetLongitude: number;
  distance: number;
  maxDistance: number;
}> {}

export class MissingLocationError extends Data.TaggedError(
  "MissingLocationError",
)<{
  message: string;
}> {}

export class InvalidTextPhraseError extends Data.TaggedError(
  "InvalidTextPhraseError",
)<{
  submittedPhrase: string | undefined;
  expectedPhrase: string;
}> {}

export class NotGroupMemberError extends Data.TaggedError(
  "NotGroupMemberError",
)<{
  userId: string;
  tripId: string;
}> {}

export class ReviewNotAllowedError extends Data.TaggedError(
  "ReviewNotAllowedError",
)<{
  challengeId: string;
  scoringCategory: string;
  message: string;
}> {}

export class RejectionReasonRequiredError extends Data.TaggedError(
  "RejectionReasonRequiredError",
)<{
  submissionId: string;
}> {}

export class ImageLocationCannotAutoApproveError extends Data.TaggedError(
  "ImageLocationCannotAutoApproveError",
)<{
  message: string;
}> {}

export class TextAutoApproveRequiresPhraseError extends Data.TaggedError(
  "TextAutoApproveRequiresPhraseError",
)<{
  message: string;
}> {}
