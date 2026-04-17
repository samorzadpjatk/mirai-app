import { Effect } from "effect";
import { TripSponsorPort } from "../ports/TripSponsorPort";
import { TripSponsorNotFoundError } from "../errors/SponsorErrors";
import type { SponsorId, TripId } from "@mirai-app/domain";

/**
 * Input for RemoveSponsorFromTripUseCase
 */
export interface RemoveSponsorFromTripInput {
  tripId: TripId;
  sponsorId: SponsorId;
}

/**
 * Remove Sponsor From Trip Use Case
 *
 * Removes the association between a sponsor and a trip.
 */
export class RemoveSponsorFromTripUseCase {
  execute(input: RemoveSponsorFromTripInput) {
    return Effect.gen(function* () {
      const tripSponsorPort = yield* TripSponsorPort;

      // Find the association
      const existingAssociation =
        yield* tripSponsorPort.findByTripIdAndSponsorId(
          input.tripId,
          input.sponsorId,
        );

      if (!existingAssociation) {
        return yield* Effect.fail(
          new TripSponsorNotFoundError({
            tripId: input.tripId,
            sponsorId: input.sponsorId,
          }),
        );
      }

      // Delete the association
      yield* tripSponsorPort.deleteByTripIdAndSponsorId(
        input.tripId,
        input.sponsorId,
      );
    });
  }
}
