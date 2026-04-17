import { Data } from "effect";
import type { UserId } from "@mirai-app/domain";

/**
 * Location not found error
 */
export class LocationNotFoundError extends Data.TaggedError(
  "LocationNotFoundError",
)<{
  userId: string;
}> {}

/**
 * Location sharing request not found error
 */
export class LocationSharingRequestNotFoundError extends Data.TaggedError(
  "LocationSharingRequestNotFoundError",
)<{
  requestId: string;
}> {}

/**
 * Invalid sharing target error
 */
export class InvalidSharingTargetError extends Data.TaggedError(
  "InvalidSharingTargetError",
)<{
  targetUserId: string;
  reason: string;
}> {}

/**
 * Cannot share with yourself error
 */
export class CannotShareWithSelfError extends Data.TaggedError(
  "CannotShareWithSelfError",
)<{}> {}

/**
 * Location sharing request already exists error
 */
export class LocationSharingRequestAlreadyExistsError extends Data.TaggedError(
  "LocationSharingRequestAlreadyExistsError",
)<{
  senderId: string;
  receiverId: string;
}> {}

/**
 * Location sharing already enabled error
 */
export class LocationSharingAlreadyEnabledError extends Data.TaggedError(
  "LocationSharingAlreadyEnabledError",
)<{
  senderId: string;
  receiverId: string;
}> {}

/**
 * Request not pending error
 */
export class RequestNotPendingError extends Data.TaggedError(
  "RequestNotPendingError",
)<{
  requestId: string;
  currentStatus: string;
}> {}

/**
 * Not request recipient error
 */
export class NotRequestRecipientError extends Data.TaggedError(
  "NotRequestRecipientError",
)<{
  requestId: string;
  userId: string;
}> {}

/**
 * Trip has ended error
 */
export class TripHasEndedError extends Data.TaggedError("TripHasEndedError")<{
  tripId: string;
}> {}

/**
 * Not trip participant error
 */
export class NotTripParticipantError extends Data.TaggedError(
  "NotTripParticipantError",
)<{
  userId: string;
  tripId?: string;
}> {}

/**
 * User not found error
 */
export class UserNotFoundError extends Data.TaggedError("UserNotFoundError")<{
  userId: string;
}> {}

/**
 * Missing coordinates error
 */
export class MissingCoordinatesError extends Data.TaggedError(
  "MissingCoordinatesError",
)<{
  field: "latitude" | "longitude";
}> {}
