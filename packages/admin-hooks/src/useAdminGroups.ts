"use client";

import { useMemo } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  useQuery,
} from "@tanstack/react-query";
import { useTRPCClient } from "@mirai-app/trpc/client";

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
  participants?: { userId: string }[];
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
}

export interface GroupsPagination {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

interface GroupsResponse {
  groups: Group[];
  pagination: GroupsPagination;
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const parseGroup = (value: unknown): Group | null => {
  if (
    !isObject(value) ||
    typeof value.id !== "string" ||
    typeof value.name !== "string"
  ) {
    return null;
  }

  const organizerRaw = value.organizer;
  const organizer =
    isObject(organizerRaw) && typeof organizerRaw.id === "string"
      ? {
          id: organizerRaw.id,
          firstName:
            typeof organizerRaw.firstName === "string"
              ? organizerRaw.firstName
              : null,
          lastName:
            typeof organizerRaw.lastName === "string"
              ? organizerRaw.lastName
              : null,
        }
      : null;

  const participantsRaw = Array.isArray(value.participants)
    ? value.participants
    : [];

  const participants = participantsRaw
    .map((participant) => {
      if (!isObject(participant) || typeof participant.userId !== "string") {
        return null;
      }
      return { userId: participant.userId };
    })
    .filter((item): item is { userId: string } => item !== null);

  return {
    id: value.id,
    name: value.name,
    description:
      typeof value.description === "string" ? value.description : null,
    image: typeof value.image === "string" ? value.image : null,
    code: typeof value.code === "string" ? value.code : "",
    coins: typeof value.coins === "number" ? value.coins : 0,
    organizer,
    _count: {
      participants: participantsRaw.length,
    },
    participants,
  };
};

const parseGroupsResponse = (value: unknown): GroupsResponse => {
  if (!isObject(value)) {
    return {
      groups: [],
      pagination: {
        total: 0,
        limit: GROUPS_PER_PAGE,
        offset: 0,
        hasMore: false,
      },
    };
  }

  const groupsRaw = Array.isArray(value.groups) ? value.groups : [];
  const groups = groupsRaw
    .map(parseGroup)
    .filter((item): item is Group => item !== null);

  const paginationRaw = isObject(value.pagination) ? value.pagination : {};

  return {
    groups,
    pagination: {
      total:
        typeof paginationRaw.total === "number"
          ? paginationRaw.total
          : groups.length,
      limit:
        typeof paginationRaw.limit === "number"
          ? paginationRaw.limit
          : GROUPS_PER_PAGE,
      offset:
        typeof paginationRaw.offset === "number" ? paginationRaw.offset : 0,
      hasMore: Boolean(paginationRaw.hasMore),
    },
  };
};

export function useAdminGroups(tripId: string, searchTerm: string = "") {
  const trpc = useTRPCClient();

  const {
    data,
    isLoading: groupsLoading,
    error: groupsError,
    isRefetching: groupsRefetching,
    hasNextPage: groupsHasNextPage,
    isFetchingNextPage: groupsFetchingNextPage,
    fetchNextPage: fetchMoreGroups,
    refetch: refetchGroups,
  } = useInfiniteQuery({
    queryKey: ["groups", tripId],
    enabled: Boolean(tripId),
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const offset = typeof pageParam === "number" ? pageParam : 0;

      const result = await trpc.group.getAll.query({
        tripId,
        pagination: {
          limit: GROUPS_PER_PAGE,
          offset,
        },
      });

      return parseGroupsResponse(result);
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination.hasMore) {
        return undefined;
      }

      return lastPage.pagination.offset + lastPage.pagination.limit;
    },
  });

  const groups = useMemo(() => {
    const allGroups = (data?.pages ?? []).flatMap((page) => page.groups ?? []);
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return allGroups;
    }

    return allGroups.filter((group) => {
      const organizerName = group.organizer
        ? `${group.organizer.firstName ?? ""} ${group.organizer.lastName ?? ""}`.trim()
        : "";

      return (
        group.name.toLowerCase().includes(normalizedSearch) ||
        organizerName.toLowerCase().includes(normalizedSearch) ||
        group.code.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [data?.pages, searchTerm]);

  const groupsPagination = useMemo(
    () => data?.pages?.[data.pages.length - 1]?.pagination,
    [data],
  );

  const queryClient = useQueryClient();

  const createGroupMutation = useMutation({
    mutationFn: (input: {
      tripId: string;
      name: string;
      description?: string;
      organizerId?: string;
    }) => trpc.group.create.mutate(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["groups", tripId] });
    },
  });

  const updateGroupMutation = useMutation({
    mutationFn: (input: {
      id: string;
      tripId: string;
      name?: string;
      organizerId?: string;
    }) => trpc.group.update.mutate(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["groups", tripId] });
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: (input: { id: string }) => trpc.group.delete.mutate(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["groups", tripId] });
    },
  });

  const assignUserToGroupMutation = useMutation({
    mutationFn: (input: { userId: string; tripId: string; groupId: string }) =>
      trpc.group.assignUserToGroup.mutate(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["groups", tripId] });
    },
  });

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["groups", "users", tripId],
    enabled: Boolean(tripId),
    queryFn: () => trpc.user.getAll.query({ tripId }),
  });

  const users = useMemo(() => {
    if (!Array.isArray(usersData)) return [];
    return usersData
      .map((u: unknown) => {
        const user = u as Record<string, unknown>;
        if (
          typeof user.id !== "string" ||
          typeof user.firstName !== "string" ||
          typeof user.lastName !== "string"
        ) {
          return null;
        }
        return {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: typeof user.email === "string" ? user.email : null,
        };
      })
      .filter(
        (
          u,
        ): u is {
          id: string;
          firstName: string;
          lastName: string;
          email: string | null;
        } => u !== null,
      );
  }, [usersData]);

  return {
    groups,
    groupsLoading,
    groupsError,
    groupsPagination,
    groupsRefetching,
    groupsHasNextPage,
    groupsFetchingNextPage,
    fetchMoreGroups,
    refetchGroups,
    users,
    usersLoading,
    createGroup: createGroupMutation.mutateAsync,
    isCreatingGroup: createGroupMutation.isPending,
    updateGroup: updateGroupMutation.mutateAsync,
    isUpdatingGroup: updateGroupMutation.isPending,
    deleteGroup: deleteGroupMutation.mutateAsync,
    isDeletingGroup: deleteGroupMutation.isPending,
    assignUserToGroup: assignUserToGroupMutation.mutateAsync,
    isAssigningUser: assignUserToGroupMutation.isPending,
  };
}
