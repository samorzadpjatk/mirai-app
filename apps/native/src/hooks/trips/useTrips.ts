import { useMemo, useState, useCallback, useEffect } from "react";
import { useQuery } from "urql";
import { GetTripsDocument } from "@mirai-app/frameworks";
import type { TripListItem } from "~/components/trips/list/types";
import {
  getCachedTrips,
  setCachedTrips,
} from "~/services/storage/selectedTripStorage";

const PAGE_SIZE = 20;

export function useTrips() {
  const [offset, setOffset] = useState(0);
  const [cachedTrips, setCachedTripsState] = useState<TripListItem[] | null>(
    null,
  );
  const [isCacheHydrated, setIsCacheHydrated] = useState(false);

  const [{ data, fetching, error }] = useQuery({
    query: GetTripsDocument,
    variables: { limit: PAGE_SIZE, offset },
  });

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

  const tripsData = useMemo(() => data?.trips ?? null, [data]);

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

  const hasMore = useMemo(
    () => (data?.trips?.length ?? 0) === PAGE_SIZE,
    [data],
  );

  const fetchNextPage = useCallback(() => {
    if (hasMore) {
      setOffset((prev) => prev + PAGE_SIZE);
    }
  }, [hasMore]);

  const isLoadingTrips =
    (fetching && offset === 0) || (!isCacheHydrated && allTrips.length === 0);

  return {
    trips: allTrips,
    isLoading: isLoadingTrips,
    isRefetching: fetching && offset === 0,
    hasNextPage: hasMore,
    isFetchingNextPage: fetching && offset > 0,
    fetchNextPage,
    isError: !!error,
    error,
    refetch: () => setOffset(0),
  };
}
