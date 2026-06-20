export interface TripSponsorEntry {
  sponsor?: { isActive: boolean } | null;
}

/**
 * Filters trip sponsors to only those with an active sponsor.
 * Generic to preserve the full sponsor type from the input.
 */
export function filterActiveSponsors<T extends TripSponsorEntry>(tripSponsors: T[]): T[] {
  return tripSponsors.filter((ts) => ts.sponsor?.isActive);
}
