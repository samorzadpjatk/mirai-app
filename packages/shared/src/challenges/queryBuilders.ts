export interface ChallengePaginationResponse {
  pagination: { hasMore: boolean; offset: number; limit: number };
}

export function buildChallengeQueryInput(tripId: string | null | undefined, pageParam: number) {
  const offset = pageParam || 0;
  return { tripId: tripId ?? "", pagination: { limit: 30, offset } };
}

export function getNextChallengePageParam(
  lastPage: ChallengePaginationResponse,
): number | undefined {
  if (!lastPage.pagination.hasMore) return undefined;
  return lastPage.pagination.offset + lastPage.pagination.limit;
}

export function buildChallengeFilter(tripId?: string | null) {
  const filter: { isRecurring: boolean; tripId?: string } = { isRecurring: false };
  if (tripId && tripId !== "all") {
    filter.tripId = tripId;
  }
  return filter;
}
