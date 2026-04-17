import { Data } from "effect";

/**
 * Group not found error
 */
export class GroupNotFoundError extends Data.TaggedError("GroupNotFoundError")<{
  groupId: string;
}> {}

/**
 * Group already exists error
 */
export class GroupAlreadyExistsError extends Data.TaggedError(
  "GroupAlreadyExistsError",
)<{
  identifier: string;
}> {}

/**
 * Join request not found error
 */
export class JoinRequestNotFoundError extends Data.TaggedError(
  "JoinRequestNotFoundError",
)<{
  requestId: string;
}> {}

/**
 * Join request already exists error
 */
export class JoinRequestAlreadyExistsError extends Data.TaggedError(
  "JoinRequestAlreadyExistsError",
)<{
  userId: string;
  tripId: string;
}> {}

/**
 * Already in group error
 */
export class AlreadyInGroupError extends Data.TaggedError(
  "AlreadyInGroupError",
)<{
  userId: string;
  groupId: string;
}> {}

/**
 * Not in group error
 */
export class NotInGroupError extends Data.TaggedError("NotInGroupError")<{
  userId: string;
  groupId: string;
}> {}

/**
 * Not group organizer error
 */
export class NotGroupOrganizerError extends Data.TaggedError(
  "NotGroupOrganizerError",
)<{
  userId: string;
  groupId: string;
}> {}

/**
 * Cannot remove organizer error
 */
export class CannotRemoveOrganizerError extends Data.TaggedError(
  "CannotRemoveOrganizerError",
)<{
  groupId: string;
  organizerId: string;
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
 * User not found error
 */
export class UserNotFoundError extends Data.TaggedError("UserNotFoundError")<{
  userId: string;
}> {}

/**
 * Trip not found error
 */
export class TripNotFoundError extends Data.TaggedError("TripNotFoundError")<{
  tripId: string;
}> {}
