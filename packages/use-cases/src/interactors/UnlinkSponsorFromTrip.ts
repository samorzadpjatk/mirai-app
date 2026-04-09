import type { Result } from "@mirai-app/domain";
import { ok, err } from "@mirai-app/domain";
import type { SponsorRepository } from "../ports/SponsorRepository";

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
 * UnlinkSponsorFromTrip Use Case
 *
 * Removes the link between a sponsor and a trip.
 */
export class UnlinkSponsorFromTripUseCase {
  constructor(private sponsorRepository: SponsorRepository) {}

  async execute(
    input: UnlinkSponsorFromTripInput,
  ): Promise<Result<UnlinkSponsorFromTripOutput, string>> {
    // Unlink sponsor from trip
    await this.sponsorRepository.unlinkFromTrip(input.sponsorId, input.tripId);

    return ok({
      sponsorId: input.sponsorId,
      tripId: input.tripId,
      unlinked: true,
    });
  }
}
