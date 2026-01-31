import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@integral-2025-app/trpc/client";

export function useTripDetails(tripId?: string | null) {
  const trpc = useTRPC();

  const { data: currentUser, isLoading: isLoadingUser } = useQuery(
    trpc.user.getMy.queryOptions(),
  );

  const tripQuery = useQuery({
    ...trpc.trip.getById.queryOptions({ id: tripId ?? "" }),
    enabled: !!tripId,
  });

  return {
    currentUser,
    isLoadingUser,
    trip: tripQuery.data,
    isLoadingTrip: tripQuery.isLoading,
    refetchTrip: tripQuery.refetch,
    isErrorTrip: tripQuery.isError,
    tripError: tripQuery.error,
  };
}
