/**
 * Per-trip sponsor logo layout.
 *
 * `height`, `offsetX` and `offsetY` used to live on the `sponsors` table but were
 * moved to `trip_sponsor_display` by migration `20260605202256_freezing_venom`,
 * because the same sponsor can be laid out differently on each trip.
 */
export interface SponsorDisplay {
  height: number;
  offsetX: number;
  offsetY: number;
}

/** A `trip_sponsor_display` row as it comes back from the database. */
export interface SponsorDisplayRow {
  sponsorId: string;
  height?: number | null;
  offsetX?: number | null;
  offsetY?: number | null;
}

/** Layout used when a sponsor has no `trip_sponsor_display` row for the trip. */
export const DEFAULT_SPONSOR_DISPLAY: SponsorDisplay = {
  height: 0,
  offsetX: 0,
  offsetY: 0,
};

const normalizeDisplay = (row: SponsorDisplayRow): SponsorDisplay => ({
  height: row.height ?? DEFAULT_SPONSOR_DISPLAY.height,
  offsetX: row.offsetX ?? DEFAULT_SPONSOR_DISPLAY.offsetX,
  offsetY: row.offsetY ?? DEFAULT_SPONSOR_DISPLAY.offsetY,
});

/**
 * Indexes `trip_sponsor_display` rows by sponsor id, normalising database nulls
 * to the default layout. Later rows win, matching the unique
 * `(trip_id, sponsor_id)` constraint.
 */
export function buildSponsorDisplayMap(rows: SponsorDisplayRow[]): Map<string, SponsorDisplay> {
  return new Map(rows.map((row) => [row.sponsorId, normalizeDisplay(row)]));
}

/**
 * Attaches the per-trip layout to each `trip_sponsors` entry. Sponsors without a
 * display row get {@link DEFAULT_SPONSOR_DISPLAY}, so consumers never see nulls.
 */
export function attachSponsorDisplay<T extends { sponsorId: string }>(
  tripSponsorsList: T[],
  displayRows: SponsorDisplayRow[],
): (T & { display: SponsorDisplay })[] {
  const displayBySponsorId = buildSponsorDisplayMap(displayRows);
  return tripSponsorsList.map((tripSponsor) => ({
    ...tripSponsor,
    display: displayBySponsorId.get(tripSponsor.sponsorId) ?? { ...DEFAULT_SPONSOR_DISPLAY },
  }));
}
