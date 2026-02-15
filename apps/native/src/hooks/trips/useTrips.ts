import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@integral-2025-app/trpc/client";
import type { TripListItem } from "~/components/trips/list/types";

export function useTrips() {
  const trpc = useTRPC();

  const {
    data: tripsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery(trpc.trip.getAll.queryOptions());

  const allTrips: TripListItem[] = useMemo(() => {
    const apiTrips = (tripsData ?? []) as TripListItem[];
    return [...apiTrips];
  }, [tripsData]);

  return {
    trips: allTrips,
    isLoading,
    isError,
    error,
    refetch,
  };
}
