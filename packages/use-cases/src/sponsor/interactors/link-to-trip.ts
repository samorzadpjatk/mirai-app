import { Effect, Data } from "effect";
import { SponsorGatewayTag } from "../ports/gateway";
import type { Sponsor } from "@mirai-app/domain";

/**
 * Input for LinkSponsorToTrip use case
 */
export interface LinkSponsorToTripInput {
  sponsorId: string;
  tripId: string;
}

/**
 * Output DTO for LinkSponsorToTrip use case
 */
export interface LinkSponsorToTripOutput {
  sponsorId: string;
  tripId: string;
  linked: boolean;
}

/**
 * Error when sponsor is not found
 */
export class LinkSponsorNotFoundError extends Data.TaggedError(
  "LinkSponsorNotFoundError",
)<{ sponsorId: string }> {}

/**
 * Error when sponsor is already linked to trip
 */
export class SponsorAlreadyLinkedError extends Data.TaggedError(
  "SponsorAlreadyLinkedError",
)<{ sponsorId: string; tripId: string }> {}

/**
 * Error when repository operation fails
 */
export class LinkSponsorRepositoryError extends Data.TaggedError(
  "LinkSponsorRepositoryError",
)<{
  operation: string;
  cause?: unknown;
}> {}

/**
 * LinkSponsorToTrip Use Case (Effect-based)
 *
 * Links a sponsor to a trip.
 * Returns error if sponsor already linked to trip.
 *
 * ## Effect-based Pattern
 *
 * ```typescript
 * const program = linkSponsorToTripUseCase(input).pipe(
 *   Effect.provideService(SponsorGatewayTag, repository)
 * );
 * const result = await Effect.runPromise(program);
 * ```
 */
export function linkSponsorToTripUseCase(
  input: LinkSponsorToTripInput,
): Effect.Effect<
  LinkSponsorToTripOutput,
  | LinkSponsorNotFoundError
  | SponsorAlreadyLinkedError
  | LinkSponsorRepositoryError,
  SponsorGatewayTag
> {
  return Effect.gen(function* () {
    const sponsorRepo = yield* SponsorGatewayTag;

    // Check if sponsor exists
    const sponsor = yield* sponsorRepo.findById(input.sponsorId).pipe(
      Effect.mapError(
        (cause) =>
          new LinkSponsorRepositoryError({
            operation: "find sponsor",
            cause,
          }),
      ),
    );

    if (!sponsor) {
      return yield* Effect.fail(
        new LinkSponsorNotFoundError({ sponsorId: input.sponsorId }),
      );
    }

    // Check if already linked
    const alreadyLinked = yield* sponsorRepo
      .isLinkedToTrip(input.sponsorId, input.tripId)
      .pipe(
        Effect.mapError(
          (cause) =>
            new LinkSponsorRepositoryError({
              operation: "check if linked",
              cause,
            }),
        ),
      );

    if (alreadyLinked) {
      return yield* Effect.fail(
        new SponsorAlreadyLinkedError({
          sponsorId: input.sponsorId,
          tripId: input.tripId,
        }),
      );
    }

    // Link sponsor to trip
    yield* sponsorRepo.linkToTrip(input.sponsorId, input.tripId).pipe(
      Effect.mapError(
        (cause) =>
          new LinkSponsorRepositoryError({
            operation: "link sponsor to trip",
            cause,
          }),
      ),
    );

    return {
      sponsorId: input.sponsorId,
      tripId: input.tripId,
      linked: true,
    };
  });
}
