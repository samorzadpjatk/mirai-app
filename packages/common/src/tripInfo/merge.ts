/**
 * Trip info resources are stored across four normalised tables
 * (`trip_resource_links`, `trip_resource_files`, `trip_resource_texts`,
 * `trip_resource_icons`). Each table can only represent part of a resource,
 * so one logical resource — a single entry in the seed config — is persisted
 * as one row per table that has something to store.
 *
 * These helpers put those fragments back together so that consumers see a
 * single resource per logical entry instead of several partial ones.
 *
 * Fragments belonging to the same logical resource are identified by the
 * tuple that the writer keeps identical across every row it creates:
 * `type`, `label` and `sortOrder`.
 */

/** Optional fields that live on exactly one of the four resource tables. */
const FRAGMENT_FIELDS = [
  "url",
  "storagePath",
  "fileName",
  "publicUrl",
  "iconName",
  "value",
  "description",
] as const;

export type TripResourceFragmentField = (typeof FRAGMENT_FIELDS)[number];

export interface TripResourceFragment {
  type: string;
  label: string;
  sortOrder: number;
  url?: string | null;
  storagePath?: string | null;
  fileName?: string | null;
  publicUrl?: string | null;
  iconName?: string | null;
  value?: string | null;
  description?: string | null;
}

const isEmptyFragmentValue = (value: unknown): boolean =>
  value === undefined || value === null || value === "";

export const buildTripResourceFragmentKey = (fragment: TripResourceFragment): string =>
  JSON.stringify([fragment.type, fragment.label, fragment.sortOrder]);

/**
 * Merges resource fragments that describe the same logical resource.
 *
 * The first fragment of a group wins for every field it already fills; later
 * fragments only contribute the fields the earlier ones left empty. Groups are
 * returned in the order their first fragment appeared, so an already sorted
 * input stays sorted.
 */
export const mergeTripResourceFragments = <T extends TripResourceFragment>(
  fragments: readonly T[],
): T[] => {
  const byKey = new Map<string, T>();
  const merged: T[] = [];

  for (const fragment of fragments) {
    const key = buildTripResourceFragmentKey(fragment);
    const existing = byKey.get(key);

    if (!existing) {
      const copy = { ...fragment };
      byKey.set(key, copy);
      merged.push(copy);
      continue;
    }

    const target = existing as unknown as Record<string, unknown>;
    const source = fragment as unknown as Record<string, unknown>;

    for (const field of FRAGMENT_FIELDS) {
      if (isEmptyFragmentValue(target[field]) && !isEmptyFragmentValue(source[field])) {
        target[field] = source[field];
      }
    }
  }

  return merged;
};
