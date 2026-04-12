import { Effect } from "effect";
import { SponsorRepositoryTag } from "../ports/SponsorRepository";

/**
 * Input for UnlinkSponsorFromTrip use case
 */
export interface UnlinkSponsorFromTripInput {
  sponsorId: string;
  tripId: string;
}

/**
 * Output DTO for UnlinkSponsorFromTrip use case
 */
export interface UnlinkSponsorFromTripOutput {
  sponsorId: string;
  tripId: string;
  unlinked: boolean;
}

/**
 * Error when repository operation fails
 */
export class UnlinkSponsorRepositoryError extends Error {
  readonly _tag = "UnlinkSponsorRepositoryError";
  constructor(
    public readonly operation: string,
    public readonly cause?: unknown,
  ) {
    super(`Failed to ${operation}`);
  }
}

/**
 * UnlinkSponsorFromTrip Use Case (Effect-based)
 *
 * Removes the link between a sponsor and a trip.
 *
 * ## Effect-based Pattern
 *
 * ```typescript
 * const program = unlinkSponsorFromTripUseCase(input).pipe(
 *   Effect.provideService(SponsorRepositoryTag, repository)
 * );
 * const result = await Effect.runPromise(program);
 * ```
 */
export function unlinkSponsorFromTripUseCase(
  input: UnlinkSponsorFromTripInput,
): Effect.Effect<
  UnlinkSponsorFromTripOutput,
  UnlinkSponsorRepositoryError,
  SponsorRepositoryTag
> {
  return Effect.gen(function* () {
    const sponsorRepo = yield* SponsorRepositoryTag;

    // Unlink sponsor from trip
    yield* sponsorRepo
      .unlinkFromTrip(input.sponsorId, input.tripId)
      .pipe(
        Effect.mapError(
          (cause) =>
            new UnlinkSponsorRepositoryError("unlink sponsor from trip", cause),
        ),
      );

    return {
      sponsorId: input.sponsorId,
      tripId: input.tripId,
      unlinked: true,
    };
  });
}
