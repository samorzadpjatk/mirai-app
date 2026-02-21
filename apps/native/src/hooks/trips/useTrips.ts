import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@integral-2025-app/trpc/client";
import type { TripListItem } from "~/components/trips/list/types";
import { getCachedTrips, setCachedTrips } from "~/lib/selectedTripStorage";

export function useTrips() {
  const trpc = useTRPC();
  const [cachedTrips, setCachedTripsState] = useState<TripListItem[] | null>(null);
  const [isCacheHydrated, setIsCacheHydrated] = useState(false);

  const {
    data: tripsData,
    isLoading: isTripsLoading,
    isRefetching,
    isError,
    error,
    refetch,
  } = useQuery(trpc.trip.getAll.queryOptions());

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
    if (!tripsData) return;
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

  const isLoading = (isTripsLoading || !isCacheHydrated) && allTrips.length === 0;

  return {
    trips: allTrips,
    isLoading,
    isRefetching,
    isError,
    error,
    refetch,
  };
}
