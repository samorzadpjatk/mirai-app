import { useQuery } from "@tanstack/react-query";
import { orpc } from "@mirai-app/orpc/client";

export function useGroupDetails(groupId?: string | null) {
  const currentUserQuery = useQuery(orpc.user.getMy.queryOptions({ input: {} }));
  const groupQuery = useQuery(orpc.group.getById.queryOptions({ input: { id: groupId ?? "" }, enabled: !!groupId }));

  return {
    currentUser: currentUserQuery.data,
    isLoadingUser: currentUserQuery.isLoading,
    group: groupQuery.data,
    isLoadingGroup: groupQuery.isLoading,
  } as const;
}
