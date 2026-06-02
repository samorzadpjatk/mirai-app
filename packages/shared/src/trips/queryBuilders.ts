export interface TripPaginationResponse {
  pagination: { hasMore: boolean; offset: number; limit: number };
}

export function buildTripQueryInput(pageParam: number) {
  const offset = pageParam || 0;
  return { pagination: { limit: 20, offset } };
}

export function getNextTripPageParam(lastPage: TripPaginationResponse): number | undefined {
  if (!lastPage.pagination.hasMore) return undefined;
  return lastPage.pagination.offset + lastPage.pagination.limit;
}

export function calculateAllTrips<T>(tripsData: T[] | null, cachedTrips: T[] | null): T[] {
  if (tripsData) return [...tripsData];
  if (cachedTrips) return [...cachedTrips];
  return [];
}
