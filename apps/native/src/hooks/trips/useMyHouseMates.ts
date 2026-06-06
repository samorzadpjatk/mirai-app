import { orpc } from "@mirai-app/orpc/client";
import { useQuery } from "@tanstack/react-query";

export function useMyHouseMates(tripId?: string | null) {
  const query = useQuery(
    orpc.user.getMyHouseMates.queryOptions({
      input: { tripId: tripId ?? "" },
      enabled: !!tripId,
    }),
  );

  return {
    houseMates: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
  } as const;
}
