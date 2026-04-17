import { Data } from "effect";

/**
 * Activity not found error
 */
export class ActivityNotFoundError extends Data.TaggedError(
  "ActivityNotFoundError",
)<{
  activityId: string;
}> {}

/**
 * Trip not found error
 */
export class TripNotFoundError extends Data.TaggedError("TripNotFoundError")<{
  tripId: string;
}> {}

/**
 * Challenge not found error
 */
export class ChallengeNotFoundError extends Data.TaggedError(
  "ChallengeNotFoundError",
)<{
  challengeId: string;
}> {}

/**
 * Submission not found error
 */
export class SubmissionNotFoundError extends Data.TaggedError(
  "SubmissionNotFoundError",
)<{
  submissionId: string;
}> {}

/**
 * Group not found error
 */
export class GroupNotFoundError extends Data.TaggedError("GroupNotFoundError")<{
  groupId: string;
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
 * User not found error
 */
export class UserNotFoundError extends Data.TaggedError("UserNotFoundError")<{
  userId: string;
}> {}

/**
 * Activity already exists error
 */
export class ActivityAlreadyExistsError extends Data.TaggedError(
  "ActivityAlreadyExistsError",
)<{
  activityId: string;
}> {}

/**
 * Activity is hidden error
 */
export class ActivityIsHiddenError extends Data.TaggedError(
  "ActivityIsHiddenError",
)<{
  activityId: string;
}> {}

/**
 * Not authorized to hide activity error
 */
export class NotAuthorizedToHideError extends Data.TaggedError(
  "NotAuthorizedToHideError",
)<{
  userId: string;
  activityId: string;
}> {}

/**
 * Invalid reaction type error
 */
export class InvalidReactionTypeError extends Data.TaggedError(
  "InvalidReactionTypeError",
)<{
  reactionType: string;
  allowedTypes: string[];
}> {}

/**
 * Reaction already exists error
 */
export class ReactionAlreadyExistsError extends Data.TaggedError(
  "ReactionAlreadyExistsError",
)<{
  activityId: string;
  userId: string;
  reactionType: string;
}> {}

/**
 * Reaction not found error
 */
export class ReactionNotFoundError extends Data.TaggedError(
  "ReactionNotFoundError",
)<{
  activityId: string;
  userId: string;
}> {}

/**
 * Invalid cursor error
 */
export class InvalidCursorError extends Data.TaggedError("InvalidCursorError")<{
  cursor: string;
  reason: string;
}> {}
