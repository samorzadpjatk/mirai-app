import { Data } from "effect";

/**
 * User-related errors for use cases
 */

export class UserNotFoundError extends Data.TaggedError("UserNotFoundError")<{
  userId: string;
}> {}

export class UserAlreadyExistsError extends Data.TaggedError(
  "UserAlreadyExistsError",
)<{
  identifier: string;
}> {}

export class CannotRemoveOwnAdminError extends Data.TaggedError(
  "CannotRemoveOwnAdminError",
)<{
  userId: string;
}> {}

export class UserNotInTripError extends Data.TaggedError("UserNotInTripError")<{
  userId: string;
  tripId: string;
}> {}

export class WristNumberAlreadyTakenError extends Data.TaggedError(
  "WristNumberAlreadyTakenError",
)<{
  wristNumber: string;
  tripId: string;
  takenByUserId: string;
}> {}

export class InvalidBanDateError extends Data.TaggedError(
  "InvalidBanDateError",
)<{
  reason: string;
}> {}

export class CannotDeleteLastAdminError extends Data.TaggedError(
  "CannotDeleteLastAdminError",
)<{
  userId: string;
}> {}

export class AuthUserNotFoundError extends Data.TaggedError(
  "AuthUserNotFoundError",
)<{
  authUserId: string;
}> {}
