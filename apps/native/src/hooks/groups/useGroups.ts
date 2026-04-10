import { useCallback, useMemo, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { GraphQLClient } from "graphql-request";
import * as SecureStore from "expo-secure-store";
import { useGetGroupsByTripQuery } from "@mirai-app/graphql-types";
import type { GroupListItem } from "~/components/trips/groups/types";

const PAGE_SIZE = 30;

const createGraphQLClient = async () => {
  const graphqlUrl =
    process.env.EXPO_PUBLIC_GRAPHQL_URL || "http://localhost:4000/graphql";
  const token = await SecureStore.getItemAsync("sb-access-token");

  return new GraphQLClient(graphqlUrl, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
};

export function useGroups(tripId?: string | null) {
  const [searchQuery, setSearchQuery] = useState("");

  const {
    data,
    isLoading,
    isRefetching,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["GetGroupsByTrip", tripId, "infinite", PAGE_SIZE],
    enabled: Boolean(tripId),
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const client = await createGraphQLClient();
      const offset = typeof pageParam === "number" ? pageParam : 0;
      const result = await useGetGroupsByTripQuery.fetcher(client, {
        tripId: tripId ?? "",
        limit: PAGE_SIZE,
        offset,
      })();
      return {
        groups: result.groupsByTrip,
        pagination: {
          hasMore: result.groupsByTrip.length === PAGE_SIZE,
          offset,
          limit: PAGE_SIZE,
        },
      };
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination.hasMore) {
        return undefined;
      }

      return lastPage.pagination.offset + lastPage.pagination.limit;
    },
  });

  const groups = useMemo(
    () => (data?.pages ?? []).flatMap((page) => page.groups ?? []),
    [data?.pages],
  );

  const filteredGroups: GroupListItem[] = useMemo(() => {
    return groups
      .filter((group) =>
        group.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      .map((group) => ({
        id: group.id,
        name: group.name,
        code: group.code,
        image: group.image,
        participantCount: group.participants?.length ?? 0,
      }));
  }, [groups, searchQuery]);

  return {
    groups,
    filteredGroups,
    isLoading,
    isRefetching,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
    searchQuery,
    setSearchQuery,
  };
}
