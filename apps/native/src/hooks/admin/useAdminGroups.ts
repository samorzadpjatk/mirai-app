import { orpc } from "@mirai-app/orpc/client";
import { invalidateGroupQueries } from "@mirai-app/orpc/client/query";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

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

export function buildAdminGroupQueryInput(tripId: string, pageParam: number) {
  const offset = typeof pageParam === "number" ? pageParam : 0;
  return {
    tripId,
    pagination: {
      limit: GROUPS_PER_PAGE,
      offset,
    },
  };
}

export function getNextAdminGroupPageParam(lastPage: {
  pagination: { hasMore: boolean; offset: number; limit: number };
}) {
  if (!lastPage.pagination.hasMore) {
    return undefined;
  }
  return lastPage.pagination.offset + lastPage.pagination.limit;
}

export function transformRawGroup(rawGroup: {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  code: string;
  coins: number;
  organizer: { id: string; firstName: string | null; lastName: string | null } | null;
  participants: unknown[];
}): Group {
  return {
    id: rawGroup.id,
    name: rawGroup.name,
    description: rawGroup.description,
    image: rawGroup.image,
    code: rawGroup.code,
    coins: rawGroup.coins,
    organizer: rawGroup.organizer
      ? {
          id: rawGroup.organizer.id,
          firstName: rawGroup.organizer.firstName,
          lastName: rawGroup.organizer.lastName,
        }
      : null,
    _count: {
      participants: rawGroup.participants.length,
    },
  };
}

export function flattenGroupPages(
  pages: { groups?: typeof transformRawGroup extends (x: infer U) => unknown ? U[] : never[] }[],
): Group[] {
  return (pages ?? []).flatMap((page) => (page.groups ?? []).map(transformRawGroup));
}

export function buildUpdateGroupInput(
  id: string,
  tripId: string,
  name?: string,
  organizerId?: string,
) {
  return {
    id,
    tripId,
    ...(name !== undefined ? { name } : {}),
    organizerId,
  };
}

export function useAdminGroups(tripId: string) {
  const {
    data,
    isLoading: groupsLoading,
    isRefetching: groupsRefetching,
    hasNextPage: groupsHasNextPage,
    isFetchingNextPage: groupsFetchingNextPage,
    fetchNextPage: fetchMoreGroups,
    refetch: refetchGroups,
  } = useInfiniteQuery(
    orpc.group.getAll.infiniteOptions({
      input: (pageParam: number) => buildAdminGroupQueryInput(tripId, pageParam),
      initialPageParam: 0,
      getNextPageParam: getNextAdminGroupPageParam,
      enabled: Boolean(tripId),
    }),
  );

  const groups = useMemo(() => flattenGroupPages(data?.pages ?? []), [data?.pages]);

  const groupsPagination = useMemo(() => data?.pages?.[data.pages.length - 1]?.pagination, [data]);

  // Use direct oRPC + React Query for queries
  const queryClient = useQueryClient();
  const { data: usersData, isLoading: usersLoading } = useQuery(
    orpc.user.getAll.queryOptions({ input: { tripId } }),
  );
  const users = (usersData ?? []) as User[];

  // Use direct oRPC + React Query for mutations
  const createGroupMutation = useMutation(
    orpc.group.create.mutationOptions({
      onSuccess: async () => {
        await invalidateGroupQueries(queryClient, true);
      },
    }),
  );

  const updateGroupMutation = useMutation(
    orpc.group.update.mutationOptions({
      onSuccess: async () => {
        await invalidateGroupQueries(queryClient, true);
      },
    }),
  );

  const deleteGroupMutation = useMutation(
    orpc.group.delete.mutationOptions({
      onSuccess: async () => {
        await invalidateGroupQueries(queryClient, true);
      },
    }),
  );

  const createGroup = (name: string) => {
    return createGroupMutation.mutateAsync({
      name,
      tripId,
    });
  };

  const updateGroup = (id: string, name?: string, organizerId?: string) => {
    return updateGroupMutation.mutateAsync(buildUpdateGroupInput(id, tripId, name, organizerId));
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
