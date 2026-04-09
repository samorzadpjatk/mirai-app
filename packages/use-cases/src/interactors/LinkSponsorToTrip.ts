import type { Result } from "@repo/domain";
import { ok, err } from "@repo/domain";
import type { SponsorRepository } from "../ports/SponsorRepository";

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
 * LinkSponsorToTrip Use Case
 *
 * Links a sponsor to a trip.
 * Returns error if sponsor already linked to trip.
 */
export class LinkSponsorToTripUseCase {
  constructor(private sponsorRepository: SponsorRepository) {}

  async execute(
    input: LinkSponsorToTripInput,
  ): Promise<Result<LinkSponsorToTripOutput, string>> {
    // Check if sponsor exists
    const sponsor = await this.sponsorRepository.findById(input.sponsorId);
    if (!sponsor) {
      return err("Sponsor not found");
    }

    // Check if already linked
    const alreadyLinked = await this.sponsorRepository.isLinkedToTrip(
      input.sponsorId,
      input.tripId,
    );
    if (alreadyLinked) {
      return err("Sponsor is already associated with this trip");
    }

    // Link sponsor to trip
    await this.sponsorRepository.linkToTrip(input.sponsorId, input.tripId);

    return ok({
      sponsorId: input.sponsorId,
      tripId: input.tripId,
      linked: true,
    });
  }
}
