import { useMemo } from "react";
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@mirai-app/orpc/client";
import { invalidateUserQueries } from "@mirai-app/orpc/client/query";

const USERS_PER_PAGE = 30;

export interface User {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  role: "USER" | "ADMIN" | "MODERATOR" | "SERVICE";
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
  | "firstName"
  | "lastName"
  | "email"
  | "wristNumber"
  | "houseNumber"
  | "groupName";

export function useAdminUsers(tripId: string, searchTerm: string, field: UserSearchField) {
  // Use direct oRPC + React Query for queries
  const queryClient = useQueryClient();
  const { data: groupsData, isLoading: groupsLoading } = useQuery(
    orpc.group.getAll.queryOptions({ input: { tripId } }),
  );
  const groups = (groupsData ?? []) as Group[];

  const normalizedSearchTerm = searchTerm.trim();

  const { data, isLoading, isRefetching, hasNextPage, isFetchingNextPage, fetchNextPage, refetch } =
    useInfiniteQuery(
      orpc.user.searchWithPagination.infiniteOptions({
        input: (pageParam: number) => {
          const offset = typeof pageParam === "number" ? pageParam : 0;
          return {
            tripId,
            field,
            searchTerm: normalizedSearchTerm || undefined,
            pagination: {
              limit: USERS_PER_PAGE,
              offset,
            },
          };
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage) => {
          if (!lastPage.pagination.hasMore) {
            return undefined;
          }

          return lastPage.pagination.offset + lastPage.pagination.limit;
        },
        enabled: Boolean(tripId),
      }),
    );

  const users = useMemo(
    () => (data?.pages ?? []).flatMap((page) => page.users ?? []),
    [data?.pages],
  );

  const usersPagination = useMemo(() => data?.pages?.[data.pages.length - 1]?.pagination, [data]);

  // Use direct oRPC + React Query for mutations
  const assignToGroupMutation = useMutation(
    orpc.group.assignUserToGroup.mutationOptions({
      onSuccess: async () => {
        await invalidateUserQueries(queryClient, true);
      },
    }),
  );
  const removeFromGroupMutation = useMutation(
    orpc.group.removeUserFromGroup.mutationOptions({
      onSuccess: async () => {
        await invalidateUserQueries(queryClient, true);
      },
    }),
  );
  const createUserMutation = useMutation(
    orpc.user.createUser.mutationOptions({
      onSuccess: async () => {
        await invalidateUserQueries(queryClient, true);
      },
    }),
  );
  const banUserMutation = useMutation(
    orpc.user.banUserUntil.mutationOptions({
      onSuccess: async () => {
        await invalidateUserQueries(queryClient, true);
      },
    }),
  );
  const deleteUserMutation = useMutation(
    orpc.user.deleteUser.mutationOptions({
      onSuccess: async () => {
        await invalidateUserQueries(queryClient, true);
      },
    }),
  );
  const updateNameMutation = useMutation(
    orpc.user.updateName.mutationOptions({
      onSuccess: async () => {
        await invalidateUserQueries(queryClient, true);
      },
    }),
  );
  const updateWristNumberMutation = useMutation(
    orpc.user.updateWristNumber.mutationOptions({
      onSuccess: async () => {
        await invalidateUserQueries(queryClient, true);
      },
    }),
  );
  const removeWristNumberMutation = useMutation(
    orpc.user.removeWristNumber.mutationOptions({
      onSuccess: async () => {
        await invalidateUserQueries(queryClient, true);
      },
    }),
  );
  const updateHouseNumberMutation = useMutation(
    orpc.user.updateHouseNumber.mutationOptions({
      onSuccess: async () => {
        await invalidateUserQueries(queryClient, true);
      },
    }),
  );
  const removeHouseNumberMutation = useMutation(
    orpc.user.removeHouseNumber.mutationOptions({
      onSuccess: async () => {
        await invalidateUserQueries(queryClient, true);
      },
    }),
  );

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

  const createUser = (input: {
    tripId: string;
    firstName: string;
    lastName: string;
    email: string;
  }) => {
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
          wristNumber: wristNumber.trim(),
        })
      : removeWristNumberMutation.mutateAsync({ userId, tripId });
  };

  const updateHouseNumber = (userId: string, houseNumber: string) => {
    return houseNumber.trim()
      ? updateHouseNumberMutation.mutateAsync({
          userId,
          tripId,
          houseNumber: houseNumber.trim(),
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
