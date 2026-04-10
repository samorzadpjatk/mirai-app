import { useEffect, useMemo, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useTRPC, useTRPCClient } from "@mirai-app/frameworks/graphql";
import type { TripListItem } from "~/components/trips/list/types";
import {
  getCachedTrips,
  setCachedTrips,
} from "~/services/storage/selectedTripStorage";

const PAGE_SIZE = 20;

export function useTrips() {
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();
  const [cachedTrips, setCachedTripsState] = useState<TripListItem[] | null>(
    null,
  );
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
  } = useInfiniteQuery({
    queryKey: [
      ...trpc.trip.getAll.queryOptions().queryKey,
      "infinite",
      PAGE_SIZE,
    ],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const offset = typeof pageParam === "number" ? pageParam : 0;
      return trpcClient.trip.getAll.query({
        pagination: {
          limit: PAGE_SIZE,
          offset,
        },
      });
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination.hasMore) {
        return undefined;
      }

      return lastPage.pagination.offset + lastPage.pagination.limit;
    },
  });

  const tripsData = useMemo(
    () => (data ? data.pages.flatMap((page) => page.trips ?? []) : null),
    [data],
  );

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

  const allTrips: TripListItem[] = useMemo(() => {
    if (tripsData) {
      return [...(tripsData as TripListItem[])];
    }
    if (cachedTrips) {
      return [...cachedTrips];
    }
    return [];
  }, [tripsData, cachedTrips]);

  const isLoadingTrips =
    (isLoading || !isCacheHydrated) && allTrips.length === 0;

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
