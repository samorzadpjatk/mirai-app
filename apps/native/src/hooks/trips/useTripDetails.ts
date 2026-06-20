import { orpc } from "@mirai-app/orpc/client";
import { useQuery } from "@tanstack/react-query";
import { isTripPast } from "~/utils/trip";

export function useTripDetails(tripId?: string | null) {
  const enabled = Boolean(tripId);
  const query = useQuery(
    orpc.trip.getByIdFull.queryOptions({
      input: { id: tripId ?? "" },
      enabled,
    }),
  );

  const trip = query.data?.trip ?? null;
  const isTripPastValue = trip ? isTripPast(trip.endDate) : undefined;

  return {
    trip,
    isLoadingTrip: enabled && query.isLoading,
    isErrorTrip: query.isError,
    tripError: query.error ?? null,
    refetchTrip: query.refetch,
    isTripPast: isTripPastValue,
    tripId: tripId ?? "",
  };
}
