import { orpc } from "@mirai-app/orpc/client";
import { useQuery } from "@tanstack/react-query";

export function useTripHouses(tripId?: string | null) {
  const query = useQuery(
    orpc.user.getTripHouses.queryOptions({
      input: { tripId: tripId ?? "" },
      enabled: !!tripId,
    }),
  );

  return {
    houses: query.data?.houses ?? [],
    unassigned: query.data?.unassigned ?? [],
    isLoading: query.isLoading,
    error: query.error,
  } as const;
}
