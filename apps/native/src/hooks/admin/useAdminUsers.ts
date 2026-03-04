import { useMemo } from 'react';
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC, useTRPCClient } from '@integral-2025-app/trpc/client';
import { invalidateUserQueries } from '@integral-2025-app/trpc/client/query';

const USERS_PER_PAGE = 30;

export interface User {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  role: 'USER' | 'ADMIN' | 'MODERATOR' | 'SERVICE';
  wristNumber?: string | null;
  houseNumber?: string | null;
  group?: { id: string; name: string } | null;
  tripId: string;
  bannedUntil?: string | null;
  banReason?: string | null;
  isBanned?: boolean;
}

export interface Group {
  id: string;
  name: string;
}

interface GroupAssignmentResult {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  tripId: string;
  groupId: string | null;
  userId: string;
  wristNumber: string | null;
  houseNumber: string | null;
}

export type UserSearchField =
  | 'firstName'
  | 'lastName'
  | 'email'
  | 'wristNumber'
  | 'houseNumber'
  | 'groupName';

export function useAdminUsers(tripId: string, searchTerm: string, field: UserSearchField) {
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();

  // Use direct tRPC + React Query for queries
  const queryClient = useQueryClient();
  const { data: groupsData, isLoading: groupsLoading } = useQuery(trpc.group.getAll.queryOptions({ tripId }));
  const groups = (groupsData ?? []) as Group[];

  const normalizedSearchTerm = searchTerm.trim();

  const {
    data,
    isLoading,
    isRefetching,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: [
      ...trpc.user.searchWithPagination.queryOptions({
        tripId,
        field,
        searchTerm: normalizedSearchTerm || undefined,
        pagination: {
          limit: USERS_PER_PAGE,
          offset: 0,
        },
      }).queryKey,
      'infinite',
      USERS_PER_PAGE,
    ],
    enabled: Boolean(tripId),
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const offset = typeof pageParam === 'number' ? pageParam : 0;

      return trpcClient.user.searchWithPagination.query({
        tripId,
        field,
        searchTerm: normalizedSearchTerm || undefined,
        pagination: {
          limit: USERS_PER_PAGE,
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

  const users = useMemo(
    () => (data?.pages ?? []).flatMap((page) => page.users ?? []),
    [data?.pages],
  );

  const usersPagination = useMemo(
    () => data?.pages?.[data.pages.length - 1]?.pagination,
    [data],
  );

  // Use direct tRPC + React Query for mutations
  const assignToGroupMutation = useMutation(trpc.group.assignUserToGroup.mutationOptions({
    onSuccess: async () => { await invalidateUserQueries(queryClient, true); },
  }));
  const removeFromGroupMutation = useMutation(trpc.group.removeUserFromGroup.mutationOptions({
    onSuccess: async () => { await invalidateUserQueries(queryClient, true); },
  }));
  const createUserMutation = useMutation(trpc.user.createUser.mutationOptions({
    onSuccess: async () => { await invalidateUserQueries(queryClient, true); },
  }));
  const banUserMutation = useMutation(trpc.user.banUserUntil.mutationOptions({
    onSuccess: async () => { await invalidateUserQueries(queryClient, true); },
  }));
  const deleteUserMutation = useMutation(trpc.user.deleteUser.mutationOptions({
    onSuccess: async () => { await invalidateUserQueries(queryClient, true); },
  }));
  const updateNameMutation = useMutation(trpc.user.updateName.mutationOptions({
    onSuccess: async () => { await invalidateUserQueries(queryClient, true); },
  }));
  const updateWristNumberMutation = useMutation(trpc.user.updateWristNumber.mutationOptions({
    onSuccess: async () => { await invalidateUserQueries(queryClient, true); },
  }));
  const removeWristNumberMutation = useMutation(trpc.user.removeWristNumber.mutationOptions({
    onSuccess: async () => { await invalidateUserQueries(queryClient, true); },
  }));
  const updateHouseNumberMutation = useMutation(trpc.user.updateHouseNumber.mutationOptions({
    onSuccess: async () => { await invalidateUserQueries(queryClient, true); },
  }));
  const removeHouseNumberMutation = useMutation(trpc.user.removeHouseNumber.mutationOptions({
    onSuccess: async () => { await invalidateUserQueries(queryClient, true); },
  }));

  const assignToGroup = (userId: string, groupId: string) => {
    return assignToGroupMutation.mutateAsync({
      userId,
      tripId,
      groupId,
    }) as Promise<GroupAssignmentResult>;
  };

  const removeFromGroup = (userId: string) => {
    return removeFromGroupMutation.mutateAsync({
      userId,
      tripId,
    });
  };

  const createUser = (input: { tripId: string; firstName: string; lastName: string; email: string }) => {
    return createUserMutation.mutateAsync(input);
  };

  const banUserUntil = (input: { userId: string; bannedUntilMs: number; reason?: string }) => {
    return banUserMutation.mutateAsync(input);
  };

  const deleteUser = (input: { userId: string; tripId: string }) => {
    return deleteUserMutation.mutateAsync(input);
  };

  const updateName = (input: { userId: string; firstName: string; lastName: string }) => {
    return updateNameMutation.mutateAsync({
      userId: input.userId,
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
    });
  };

  const updateWristNumber = (userId: string, wristNumber: string) => {
    return wristNumber.trim()
      ? updateWristNumberMutation.mutateAsync({
        userId,
        tripId,
        wristNumber: wristNumber.trim()
      })
      : removeWristNumberMutation.mutateAsync({ userId, tripId });
  };

  const updateHouseNumber = (userId: string, houseNumber: string) => {
    return houseNumber.trim()
      ? updateHouseNumberMutation.mutateAsync({
        userId,
        tripId,
        houseNumber: houseNumber.trim()
      })
      : removeHouseNumberMutation.mutateAsync({ userId, tripId });
  };

  return {
    users,
    usersLoading: isLoading,
    usersPagination,
    usersRefetching: isRefetching,
    usersHasNextPage: hasNextPage,
    usersFetchingNextPage: isFetchingNextPage,
    fetchMoreUsers: fetchNextPage,
    refetchUsers: refetch,
    groups,
    groupsLoading,
    assignToGroup,
    removeFromGroup,
    updateName,
    updateWristNumber,
    updateHouseNumber,
    createUser,
    banUserUntil,
    deleteUser,
    isAssigningToGroup: assignToGroupMutation.isPending,
    isRemovingFromGroup: removeFromGroupMutation.isPending,
    isUpdatingName: updateNameMutation.isPending,
    isUpdatingWristNumber: updateWristNumberMutation.isPending,
    isRemovingWristNumber: removeWristNumberMutation.isPending,
    isUpdatingHouseNumber: updateHouseNumberMutation.isPending,
    isRemovingHouseNumber: removeHouseNumberMutation.isPending,
    isCreatingUser: createUserMutation.isPending,
    isBanningUser: banUserMutation.isPending,
    isDeletingUser: deleteUserMutation.isPending,
  };
}
