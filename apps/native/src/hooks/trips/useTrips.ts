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

  const wiatronaliaTrip = useMemo<TripListItem>(
    () => ({
      id: "wiatronalia-static",
      name: "Wiatronalia",
      description: "Majówka żeglarska PJATKxATAx...",
      startDate: new Date("2026-04-29"),
      endDate: new Date("2026-05-03"),
      groups: [],
    }),
    [],
  );

  const allTrips: TripListItem[] = useMemo(() => {
    const apiTrips = (tripsData ?? []) as TripListItem[];
    return [...apiTrips, wiatronaliaTrip];
  }, [tripsData, wiatronaliaTrip]);

  return {
    trips: allTrips,
    isLoading,
    isError,
    error,
    refetch,
  };
}
