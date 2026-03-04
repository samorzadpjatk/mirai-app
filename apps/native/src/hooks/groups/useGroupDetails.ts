import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@integral-2025-app/trpc/client";

export function useGroupDetails(groupId?: string | null) {
  const trpc = useTRPC();
  const currentUserQuery = useQuery(trpc.user.getMy.queryOptions());
  const groupQuery = useQuery(trpc.group.getById.queryOptions({ id: groupId ?? "" }, { enabled: !!groupId }));

  return {
    currentUser: currentUserQuery.data,
    isLoadingUser: currentUserQuery.isLoading,
    group: groupQuery.data,
    isLoadingGroup: groupQuery.isLoading,
  } as const;
}
