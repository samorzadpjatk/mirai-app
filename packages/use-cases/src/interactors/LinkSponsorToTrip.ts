import { Effect } from "effect";
import { SponsorRepositoryTag } from "../ports/SponsorRepository";
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
export class LinkSponsorNotFoundError extends Error {
  readonly _tag = "LinkSponsorNotFoundError";
  constructor() {
    super("Sponsor not found");
  }
}

/**
 * Error when sponsor is already linked to trip
 */
export class SponsorAlreadyLinkedError extends Error {
  readonly _tag = "SponsorAlreadyLinkedError";
  constructor() {
    super("Sponsor is already associated with this trip");
  }
}

/**
 * Error when repository operation fails
 */
export class LinkSponsorRepositoryError extends Error {
  readonly _tag = "LinkSponsorRepositoryError";
  constructor(
    public readonly operation: string,
    public override readonly cause?: unknown,
  ) {
    super(`Failed to ${operation}`);
  }
}

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
 *   Effect.provideService(SponsorRepositoryTag, repository)
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
  SponsorRepositoryTag
> {
  return Effect.gen(function* () {
    const sponsorRepo = yield* SponsorRepositoryTag;

    // Check if sponsor exists
    const sponsor = yield* sponsorRepo
      .findById(input.sponsorId)
      .pipe(
        Effect.mapError(
          (cause) => new LinkSponsorRepositoryError("find sponsor", cause),
        ),
      );

    if (!sponsor) {
      return yield* Effect.fail(new LinkSponsorNotFoundError());
    }

    // Check if already linked
    const alreadyLinked = yield* sponsorRepo
      .isLinkedToTrip(input.sponsorId, input.tripId)
      .pipe(
        Effect.mapError(
          (cause) => new LinkSponsorRepositoryError("check if linked", cause),
        ),
      );

    if (alreadyLinked) {
      return yield* Effect.fail(new SponsorAlreadyLinkedError());
    }

    // Link sponsor to trip
    yield* sponsorRepo
      .linkToTrip(input.sponsorId, input.tripId)
      .pipe(
        Effect.mapError(
          (cause) =>
            new LinkSponsorRepositoryError("link sponsor to trip", cause),
        ),
      );

    return {
      sponsorId: input.sponsorId,
      tripId: input.tripId,
      linked: true,
    };
  });
}
