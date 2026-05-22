import { useEffect, useMemo, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { orpc } from "@mirai-app/orpc/client";
import { flattenTrips } from "@mirai-app/shared";
import type { TripListItem } from "~/components/trips/list/types";
import { getCachedTrips, setCachedTrips } from "~/services/storage/selectedTripStorage";

const PAGE_SIZE = 20;

export function buildTripQueryInput(pageParam: number) {
  const offset = pageParam || 0;
  return {
    pagination: {
      limit: PAGE_SIZE,
      offset,
    },
  };
}

export function getNextTripPageParam(lastPage: {
  pagination: { hasMore: boolean; offset: number; limit: number };
}) {
  if (!lastPage.pagination.hasMore) {
    return undefined;
  }
  return lastPage.pagination.offset + lastPage.pagination.limit;
}

export function calculateAllTrips(
  tripsData: TripListItem[] | null,
  cachedTrips: TripListItem[] | null,
): TripListItem[] {
  if (tripsData) {
    return [...tripsData];
  }
  if (cachedTrips) {
    return [...cachedTrips];
  }
  return [];
}

export function useTrips() {
  const [cachedTrips, setCachedTripsState] = useState<TripListItem[] | null>(null);
  const [isCacheHydrated, setIsCacheHydrated] = useState(false);

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

  const tripsData = useMemo(() => flattenTrips(data?.pages), [data]);

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      const cached = await getCachedTrips();
      if (!isMounted) return;
      setCachedTripsState(cached);
      setIsCacheHydrated(true);
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!tripsData?.length) return;
    const normalizedTrips = [...(tripsData as TripListItem[])];
    void setCachedTrips(normalizedTrips);
  }, [tripsData]);

  const allTrips: TripListItem[] = useMemo(() => calculateAllTrips(tripsData, cachedTrips), [tripsData, cachedTrips]);

  const isLoadingTrips = (isLoading || !isCacheHydrated) && allTrips.length === 0;

  return {
    trips: allTrips,
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
