import { Data } from "effect";

/**
 * ChallengeVote-related errors for use cases
 */

export class VoteNotFoundError extends Data.TaggedError("VoteNotFoundError")<{
  voteId: string;
}> {}

export class VotingNotActiveError extends Data.TaggedError(
  "VotingNotActiveError",
)<{
  challengeId: string;
  currentStatus: string;
}> {}

export class AlreadyVotedError extends Data.TaggedError("AlreadyVotedError")<{
  challengeId: string;
  voterId: string;
}> {}

export class PositionAlreadyTakenError extends Data.TaggedError(
  "PositionAlreadyTakenError",
)<{
  challengeId: string;
  position: number;
}> {}

export class VotePositionTakenError extends Data.TaggedError(
  "VotePositionTakenError",
)<{
  challengeId: string;
  position: number;
}> {}

export class CannotVoteForOwnGroupError extends Data.TaggedError(
  "CannotVoteForOwnGroupError",
)<{
  challengeId: string;
  groupId: string;
}> {}

export class InvalidSubmissionError extends Data.TaggedError(
  "InvalidSubmissionError",
)<{
  submissionId: string;
  reason: string;
}> {}

export class InvalidVotePositionError extends Data.TaggedError(
  "InvalidVotePositionError",
)<{
  position: number;
  maxAllowed: number;
}> {}

export class DuplicateVotePositionError extends Data.TaggedError(
  "DuplicateVotePositionError",
)<{
  position: number;
}> {}

export class DuplicateSubmissionVoteError extends Data.TaggedError(
  "DuplicateSubmissionVoteError",
)<{
  submissionId: string;
}> {}

export class NotJudgedStaffChallengeError extends Data.TaggedError(
  "NotJudgedStaffChallengeError",
)<{
  challengeId: string;
  scoringCategory: string;
}> {}

export class StaffVotingRequiresEndTimeError extends Data.TaggedError(
  "StaffVotingRequiresEndTimeError",
)<{
  challengeId: string;
}> {}

export class StaffVotingNotStartedError extends Data.TaggedError(
  "StaffVotingNotStartedError",
)<{
  challengeId: string;
  endTime: Date;
}> {}

export class InsufficientSubmissionsError extends Data.TaggedError(
  "InsufficientSubmissionsError",
)<{
  challengeId: string;
  required: number;
  actual: number;
}> {}

export class AdminOnlyVotingError extends Data.TaggedError(
  "AdminOnlyVotingError",
)<{
  challengeId: string;
  userRole: string;
}> {}
