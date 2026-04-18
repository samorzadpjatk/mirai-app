import type { TripId } from "@mirai-app/domain";
import { Effect } from "effect";
import { TripSponsorPortTag } from "../ports/TripSponsorPort";
import type { SponsorWithLogoDTO } from "../dto/SponsorDTOs";

/**
 * Input for GetSponsorsByTripUseCase
 */
export interface GetSponsorsByTripInput {
  tripId: TripId;
}

/**
 * Get Sponsors By Trip Use Case
 *
 * Retrieves all sponsors associated with a specific trip.
 * Note: isActive filtering is handled at the adapter level.
 */
export class GetSponsorsByTripUseCase {
  execute(input: GetSponsorsByTripInput) {
    return Effect.gen(function* () {
      const tripSponsorPort = yield* TripSponsorPortTag;

      const tripSponsors = yield* tripSponsorPort.findByTripId(input.tripId);

      // Map to DTOs with logo info (isActive filtering handled at adapter level)
      return tripSponsors.map((tripSponsor) => ({
        id: tripSponsor.sponsor.id,
        name: tripSponsor.sponsor.name,
        description: tripSponsor.sponsor.description,
        logoPath: tripSponsor.sponsor.logoPath,
        logoUrl: null, // URL is derived from logoPath by storage layer
        height: tripSponsor.sponsor.height,
        offsetX: tripSponsor.sponsor.offsetX,
        offsetY: tripSponsor.sponsor.offsetY,
        isActive: tripSponsor.sponsor.isActive,
        createdAt: tripSponsor.sponsor.createdAt,
        updatedAt: tripSponsor.sponsor.updatedAt,
      }));
    });
  }
}
