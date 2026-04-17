import { Data } from "effect";

/**
 * Challenge-related errors for use cases
 */

export class ChallengeNotFoundError extends Data.TaggedError(
  "ChallengeNotFoundError",
)<{
  challengeId: string;
}> {}

export class ChallengeValidationError extends Data.TaggedError(
  "ChallengeValidationError",
)<{
  field: string;
  message: string;
}> {}

export class InvalidChallengeStatusError extends Data.TaggedError(
  "InvalidChallengeStatusError",
)<{
  challengeId: string;
  currentStatus: string;
  requiredStatus: string;
}> {}

export class InvalidPeerVotingConfigError extends Data.TaggedError(
  "InvalidPeerVotingConfigError",
)<{
  message: string;
}> {}

export class InvalidRecurringConfigError extends Data.TaggedError(
  "InvalidRecurringConfigError",
)<{
  message: string;
}> {}

export class ChallengeNotInVotingPhaseError extends Data.TaggedError(
  "ChallengeNotInVotingPhaseError",
)<{
  challengeId: string;
  currentStatus: string;
}> {}

export class NotPeerVotingChallengeError extends Data.TaggedError(
  "NotPeerVotingChallengeError",
)<{
  challengeId: string;
  scoringCategory: string;
}> {}

export class PeerVotingNotReadyError extends Data.TaggedError(
  "PeerVotingNotReadyError",
)<{
  challengeId: string;
  totalSubmissions: number;
  pendingSubmissions: number;
}> {}
