import { orpc } from "@mirai-app/orpc/client";
import {
  buildTripQueryInput,
  calculateAllTrips,
  flattenTrips,
  getNextTripPageParam,
} from "@mirai-app/shared";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import type { TripListItem } from "~/components/trips/list/types";
import { getCachedTrips, setCachedTrips } from "~/services/storage/selectedTripStorage";

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

  const allTrips: TripListItem[] = useMemo(
    () => calculateAllTrips(tripsData as TripListItem[] | null, cachedTrips),
    [tripsData, cachedTrips],
  );

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
