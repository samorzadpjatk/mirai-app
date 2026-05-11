import { useQuery } from "@tanstack/react-query";
import { orpc } from "@mirai-app/orpc/client";

export function useMyGroup(tripId?: string | null) {
  const query = useQuery(orpc.group.getMy.queryOptions({ input: { tripId: tripId ?? "" }, enabled: !!tripId }));

  return {
    group: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
  } as const;
}
