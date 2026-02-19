import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@integral-2025-app/trpc/client";

export function useMyGroup(tripId?: string | null) {
  const trpc = useTRPC();

  const query = useQuery({
    ...trpc.group.getMy.queryOptions({ tripId: tripId ?? "" }),
    enabled: Boolean(tripId),
  });

  return {
    group: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
  } as const;
}
