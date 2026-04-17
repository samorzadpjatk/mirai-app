import type { TripId } from "@mirai-app/domain";
import { Effect } from "effect";
import { TripSponsorPort } from "../ports/TripSponsorPort";
import type { SponsorDTO } from "../dto/SponsorDTOs";

/**
 * Input for GetSponsorsByTripUseCase
 */
export interface GetSponsorsByTripInput {
  tripId: TripId;
}

/**
 * Get Sponsors By Trip Use Case
 *
 * Retrieves all active sponsors associated with a specific trip.
 */
export class GetSponsorsByTripUseCase {
  execute(input: GetSponsorsByTripInput) {
    return Effect.gen(function* () {
      const tripSponsorPort = yield* TripSponsorPort;

      const tripSponsors = yield* tripSponsorPort.findByTripId(input.tripId);

      // Filter to only include active sponsors and map to DTOs
      return tripSponsors
        .filter((tripSponsor) => tripSponsor.sponsor.isActive)
        .map((tripSponsor) => tripSponsor.sponsor);
    });
  }
}
