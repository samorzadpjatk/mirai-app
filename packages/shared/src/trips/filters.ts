export interface TripSponsorEntry {
  sponsor?: { isActive: boolean } | null;
}

/**
 * Filters trip sponsors to only those with an active sponsor.
 */
export function filterActiveSponsors(tripSponsors: TripSponsorEntry[]): TripSponsorEntry[] {
  return tripSponsors.filter((ts) => ts.sponsor?.isActive);
}
