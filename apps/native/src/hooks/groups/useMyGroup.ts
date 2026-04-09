import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@mirai-app/frameworks/trpc/client";

export function useMyGroup(tripId?: string | null) {
  const trpc = useTRPC();
  const query = useQuery(
    trpc.group.getMy.queryOptions(
      { tripId: tripId ?? "" },
      { enabled: !!tripId },
    ),
  );

  return {
    group: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
  } as const;
}
