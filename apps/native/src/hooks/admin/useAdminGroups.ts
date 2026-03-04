import { useMemo } from 'react';
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC, useTRPCClient } from '@integral-2025-app/trpc/client';
import { invalidateGroupQueries } from '@integral-2025-app/trpc/client/query';

const GROUPS_PER_PAGE = 30;

export interface Group {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  code: string;
  coins: number;
  organizer: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
  _count: { participants: number };
}

export interface User {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  role: "USER" | "ADMIN" | "MODERATOR" | "SERVICE";
  wristNumber: string | null;
  houseNumber: string | null;
  group: { name: string; id: string } | null;
  tripId: string;
}

export function useAdminGroups(tripId: string) {
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();

  const {
    data,
    isLoading: groupsLoading,
    isRefetching: groupsRefetching,
    hasNextPage: groupsHasNextPage,
    isFetchingNextPage: groupsFetchingNextPage,
    fetchNextPage: fetchMoreGroups,
    refetch: refetchGroups,
  } = useInfiniteQuery({
    queryKey: [
      ...trpc.group.getAll.queryOptions({
        tripId,
        pagination: {
          limit: GROUPS_PER_PAGE,
          offset: 0,
        },
      }).queryKey,
      'infinite',
      GROUPS_PER_PAGE,
    ],
    enabled: Boolean(tripId),
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const offset = typeof pageParam === 'number' ? pageParam : 0;

      return trpcClient.group.getAll.query({
        tripId,
        pagination: {
          limit: GROUPS_PER_PAGE,
          offset,
        },
      });
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination.hasMore) {
        return undefined;
      }

      return lastPage.pagination.offset + lastPage.pagination.limit;
    },
  });

  const groups = useMemo(
    () =>
      (data?.pages ?? []).flatMap((page) =>
        (page.groups ?? []).map((group) => ({
          ...group,
          organizer: group.organizer
            ? {
                id: group.organizer.id,
                firstName: group.organizer.firstName,
                lastName: group.organizer.lastName,
              }
            : null,
          _count: {
            participants: group.participants.length,
          },
        })),
      ),
    [data?.pages],
  );

  const groupsPagination = useMemo(
    () => data?.pages?.[data.pages.length - 1]?.pagination,
    [data],
  );

  // Use direct tRPC + React Query for queries
  const queryClient = useQueryClient();
  const { data: usersData, isLoading: usersLoading } = useQuery(trpc.user.getAll.queryOptions({ tripId }));
  const users = (usersData ?? []) as User[];

  // Use direct tRPC + React Query for mutations
  const createGroupMutation = useMutation(trpc.group.create.mutationOptions({
    onSuccess: async () => { await invalidateGroupQueries(queryClient, true); },
  }));

  const updateGroupMutation = useMutation(trpc.group.update.mutationOptions({
    onSuccess: async () => { await invalidateGroupQueries(queryClient, true); },
  }));

  const deleteGroupMutation = useMutation(trpc.group.delete.mutationOptions({
    onSuccess: async () => { await invalidateGroupQueries(queryClient, true); },
  }));

  const createGroup = (name: string) => {
    return createGroupMutation.mutateAsync({
      name,
      tripId,
    });
  };

  const updateGroup = (id: string, name?: string, organizerId?: string) => {
    return updateGroupMutation.mutateAsync({
      id,
      tripId,
      ...(name !== undefined ? { name } : {}),
      organizerId,
    });
  };

  const deleteGroup = (id: string) => {
    return deleteGroupMutation.mutateAsync({
      id,
    });
  };

  return {
    groups,
    groupsLoading,
    groupsPagination,
    groupsRefetching,
    groupsHasNextPage,
    groupsFetchingNextPage,
    fetchMoreGroups,
    refetchGroups,
    users,
    usersLoading,
    createGroup,
    updateGroup,
    deleteGroup,
    isCreatingGroup: createGroupMutation.isPending,
    isUpdatingGroup: updateGroupMutation.isPending,
    isDeletingGroup: deleteGroupMutation.isPending,
  };
}
