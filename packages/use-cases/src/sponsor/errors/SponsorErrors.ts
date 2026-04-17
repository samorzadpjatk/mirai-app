import { Data } from "effect";
import type { SponsorId } from "@mirai-app/domain";

/**
 * Sponsor not found error
 */
export class SponsorNotFoundError extends Data.TaggedError(
  "SponsorNotFoundError",
)<{
  sponsorId: string;
}> {}

/**
 * Sponsor already exists error
 */
export class SponsorAlreadyExistsError extends Data.TaggedError(
  "SponsorAlreadyExistsError",
)<{
  name: string;
}> {}

/**
 * Trip sponsor not found error
 */
export class TripSponsorNotFoundError extends Data.TaggedError(
  "TripSponsorNotFoundError",
)<{
  tripId: string;
  sponsorId: string;
}> {}

/**
 * Sponsor already associated with trip error
 */
export class SponsorAlreadyAssociatedError extends Data.TaggedError(
  "SponsorAlreadyAssociatedError",
)<{
  tripId: string;
  sponsorId: string;
}> {}

/**
 * Trip not found error (when associating sponsor)
 */
export class TripNotFoundError extends Data.TaggedError("TripNotFoundError")<{
  tripId: string;
}> {}

/**
 * Invalid sponsor data error
 */
export class InvalidSponsorDataError extends Data.TaggedError(
  "InvalidSponsorDataError",
)<{
  field: string;
  message: string;
}> {}

/**
 * Sponsor deletion failed error
 */
export class SponsorDeletionError extends Data.TaggedError(
  "SponsorDeletionError",
)<{
  sponsorId: SponsorId;
  reason: string;
}> {}
