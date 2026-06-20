export interface GroupPaginationResponse {
  pagination: { hasMore: boolean; offset: number; limit: number };
}

export function buildGroupQueryInput(tripId: string | null | undefined, pageParam: number) {
  const offset = pageParam || 0;
  return { tripId: tripId ?? "", pagination: { limit: 30, offset } };
}

export function getNextGroupPageParam(lastPage: GroupPaginationResponse): number | undefined {
  if (!lastPage.pagination.hasMore) return undefined;
  return lastPage.pagination.offset + lastPage.pagination.limit;
}
