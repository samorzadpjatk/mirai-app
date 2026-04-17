import { Data } from "effect";

/**
 * Trip not found error
 */
export class TripNotFoundError extends Data.TaggedError("TripNotFoundError")<{
  tripId: string;
}> {}

/**
 * User is not a trip participant error
 */
export class NotTripParticipantError extends Data.TaggedError(
  "NotTripParticipantError",
)<{
  userId: string;
  tripId: string;
}> {}

/**
 * Trip resource not found error
 */
export class TripResourceNotFoundError extends Data.TaggedError(
  "TripResourceNotFoundError",
)<{
  resourceId: string;
}> {}

/**
 * Trip already exists error
 */
export class TripAlreadyExistsError extends Data.TaggedError(
  "TripAlreadyExistsError",
)<{
  tripId: string;
}> {}
