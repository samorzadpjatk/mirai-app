"use client";

import { useMemo } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useTRPCClient } from "@mirai-app/trpc/client";

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

export interface UsersPagination {
  limit: number;
  offset: number;
  hasMore: boolean;
  totalCount: number;
}

interface UserSearchResponse {
  users: User[];
  pagination: UsersPagination;
}

interface UserDetails {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
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

type UseAdminUsersResult = {
  users: User[];
  usersLoading: boolean;
  usersError: unknown;
  usersPagination?: UsersPagination;
  usersRefetching: boolean;
  usersHasNextPage?: boolean;
  usersFetchingNextPage: boolean;
  fetchMoreUsers: () => Promise<unknown>;
  refetchUsers: () => Promise<unknown>;
  groups: Group[];
  groupsLoading: boolean;
  createUser: (input: {
    tripId: string;
    firstName: string;
    lastName: string;
    email: string;
  }) => Promise<unknown>;
  isCreatingUser: boolean;
  getUserDetails: (userId: string) => Promise<UserDetails | null>;
  updateName: (input: {
    userId: string;
    firstName: string;
    lastName: string;
  }) => Promise<unknown>;
  updateWristNumber: (input: {
    userId: string;
    wristNumber: string;
  }) => Promise<unknown>;
  updateHouseNumber: (input: {
    userId: string;
    houseNumber: string;
  }) => Promise<unknown>;
  isUpdatingName: boolean;
  isUpdatingWristNumber: boolean;
  isUpdatingHouseNumber: boolean;
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const parseUser = (value: unknown): User | null => {
  if (
    !isObject(value) ||
    typeof value.id !== "string" ||
    typeof value.tripId !== "string"
  ) {
    return null;
  }

  const roleRaw = value.role;
  const role =
    roleRaw === "USER" ||
    roleRaw === "ADMIN" ||
    roleRaw === "MODERATOR" ||
    roleRaw === "SERVICE"
      ? roleRaw
      : "USER";

  const groupRaw = value.group;
  const group =
    isObject(groupRaw) &&
    typeof groupRaw.id === "string" &&
    typeof groupRaw.name === "string"
      ? { id: groupRaw.id, name: groupRaw.name }
      : null;

  return {
    id: value.id,
    firstName: typeof value.firstName === "string" ? value.firstName : null,
    lastName: typeof value.lastName === "string" ? value.lastName : null,
    email: typeof value.email === "string" ? value.email : null,
    role,
    wristNumber:
      typeof value.wristNumber === "string" ? value.wristNumber : null,
    houseNumber:
      typeof value.houseNumber === "string" ? value.houseNumber : null,
    group,
    tripId: value.tripId,
    bannedUntil:
      typeof value.bannedUntil === "string" ? value.bannedUntil : null,
    banReason: typeof value.banReason === "string" ? value.banReason : null,
    isBanned: Boolean(value.isBanned),
  };
};

const parseUsersResponse = (value: unknown): UserSearchResponse => {
  if (!isObject(value)) {
    return {
      users: [],
      pagination: {
        limit: USERS_PER_PAGE,
        offset: 0,
        hasMore: false,
        totalCount: 0,
      },
    };
  }

  const usersRaw = Array.isArray(value.users) ? value.users : [];
  const users = usersRaw
    .map(parseUser)
    .filter((item): item is User => item !== null);

  const paginationRaw = isObject(value.pagination) ? value.pagination : {};
  const pagination: UsersPagination = {
    limit:
      typeof paginationRaw.limit === "number"
        ? paginationRaw.limit
        : USERS_PER_PAGE,
    offset: typeof paginationRaw.offset === "number" ? paginationRaw.offset : 0,
    hasMore: Boolean(paginationRaw.hasMore),
    totalCount:
      typeof paginationRaw.totalCount === "number"
        ? paginationRaw.totalCount
        : users.length,
  };

  return { users, pagination };
};

const parseGroups = (value: unknown): Group[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (
        !isObject(item) ||
        typeof item.id !== "string" ||
        typeof item.name !== "string"
      ) {
        return null;
      }
      return { id: item.id, name: item.name };
    })
    .filter((item): item is Group => item !== null);
};

const parseUserDetails = (
  userValue: unknown,
  participantValue: unknown,
): UserDetails | null => {
  if (!isObject(userValue) || typeof userValue.id !== "string") {
    return null;
  }

  const participant = isObject(participantValue) ? participantValue : {};

  return {
    id: userValue.id,
    firstName:
      typeof userValue.firstName === "string" ? userValue.firstName : null,
    lastName:
      typeof userValue.lastName === "string" ? userValue.lastName : null,
    email: typeof userValue.email === "string" ? userValue.email : null,
    wristNumber:
      typeof participant.wristNumber === "string"
        ? participant.wristNumber
        : null,
    houseNumber:
      typeof participant.houseNumber === "string"
        ? participant.houseNumber
        : null,
  };
};

export function useAdminUsers(
  tripId: string,
  searchTerm: string,
  field: UserSearchField,
): UseAdminUsersResult {
  const trpc = useTRPCClient();
  const queryClient = useQueryClient();
  const normalizedSearchTerm = searchTerm.trim();

  const { data: groupsData, isLoading: groupsLoading } = useQuery({
    queryKey: ["users", "groups", tripId],
    enabled: Boolean(tripId),
    queryFn: () => trpc.group.getAll.query({ tripId }),
  });

  const groups = useMemo(() => parseGroups(groupsData), [groupsData]);

  const {
    data,
    isLoading,
    error,
    isRefetching,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["users", "search", tripId, field, normalizedSearchTerm],
    enabled: Boolean(tripId),
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const offset = typeof pageParam === "number" ? pageParam : 0;

      const result = await trpc.user.searchWithPagination.query({
        tripId,
        field,
        searchTerm: normalizedSearchTerm || undefined,
        pagination: {
          limit: USERS_PER_PAGE,
          offset,
        },
      });

      return parseUsersResponse(result);
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

  const createUserMutation = useMutation({
    mutationFn: (input: {
      tripId: string;
      firstName: string;
      lastName: string;
      email: string;
    }) => trpc.user.createUser.mutate(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["users", "search", tripId],
      });
    },
  });

  const updateNameMutation = useMutation({
    mutationFn: (input: {
      userId: string;
      firstName: string;
      lastName: string;
    }) => trpc.user.updateName.mutate(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["users", "search", tripId],
      });
    },
  });

  const updateWristMutation = useMutation({
    mutationFn: (input: { userId: string; wristNumber: string }) => {
      const normalized = input.wristNumber.trim();
      if (!normalized) {
        return trpc.user.removeWristNumber.mutate({
          userId: input.userId,
          tripId,
        });
      }

      return trpc.user.updateWristNumber.mutate({
        userId: input.userId,
        tripId,
        wristNumber: normalized,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["users", "search", tripId],
      });
    },
  });

  const updateHouseMutation = useMutation({
    mutationFn: (input: { userId: string; houseNumber: string }) => {
      const normalized = input.houseNumber.trim();
      if (!normalized) {
        return trpc.user.removeHouseNumber.mutate({
          userId: input.userId,
          tripId,
        });
      }

      return trpc.user.updateHouseNumber.mutate({
        userId: input.userId,
        tripId,
        houseNumber: normalized,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["users", "search", tripId],
      });
    },
  });

  const getUserDetails = async (
    userId: string,
  ): Promise<UserDetails | null> => {
    const [userResult, participantResult] = await Promise.all([
      trpc.user.getById.query({ id: userId }),
      trpc.user.getTripParticipant.query({ userId, tripId }),
    ]);

    return parseUserDetails(userResult, participantResult);
  };

  return {
    users,
    usersLoading: isLoading,
    usersError: error,
    usersPagination,
    usersRefetching: isRefetching,
    usersHasNextPage: hasNextPage,
    usersFetchingNextPage: isFetchingNextPage,
    fetchMoreUsers: fetchNextPage,
    refetchUsers: refetch,
    groups,
    groupsLoading,
    createUser: createUserMutation.mutateAsync,
    isCreatingUser: createUserMutation.isPending,
    getUserDetails,
    updateName: updateNameMutation.mutateAsync,
    updateWristNumber: updateWristMutation.mutateAsync,
    updateHouseNumber: updateHouseMutation.mutateAsync,
    isUpdatingName: updateNameMutation.isPending,
    isUpdatingWristNumber: updateWristMutation.isPending,
    isUpdatingHouseNumber: updateHouseMutation.isPending,
  };
}
