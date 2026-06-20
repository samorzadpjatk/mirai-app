export interface TripPage<T> {
  trips?: T[];
}

export const flattenTrips = <T>(pages: TripPage<T>[] | undefined): T[] | null => {
  if (!pages) return null;
  return pages.flatMap((page) => page.trips ?? []);
};
