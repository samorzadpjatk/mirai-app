import type { Sponsor, TripSponsor } from "@mirai-app/db/schema";

/**
 * Extracts active sponsors from a list of trip sponsors.
 * Filters out entries where the sponsor is missing or inactive,
 * then maps to the sponsor object.
 */
export function extractActiveSponsors(
  tripSponsorsList: (TripSponsor & { sponsor: Sponsor | null })[],
): Sponsor[] {
  return tripSponsorsList
    .filter((tripSponsor) => tripSponsor.sponsor?.isActive)
    .map((tripSponsor) => tripSponsor.sponsor)
    .filter((sponsor): sponsor is Sponsor => sponsor !== null);
}
