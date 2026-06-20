import { buildTripQueryInput, flattenTrips, getNextTripPageParam } from "@mirai-app/common/trips";
import { orpc } from "@mirai-app/orpc/client";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import type { TripListItem } from "~/components/trips/list/types";

export function useTrips() {
  const {
    data,
    isLoading,
    isRefetching,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    isError,
    error,
    refetch,
  } = useInfiniteQuery(
    orpc.trip.getAll.infiniteOptions({
      input: buildTripQueryInput,
      initialPageParam: 0,
      getNextPageParam: getNextTripPageParam,
    }),
  );

  const trips = useMemo<TripListItem[]>(
    () => (flattenTrips(data?.pages) as TripListItem[] | null) ?? [],
    [data],
  );

  const isLoadingTrips = isLoading && trips.length === 0;

  return {
    trips,
    isLoading: isLoadingTrips,
    isRefetching,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    isError,
    error,
    refetch,
  };
}
