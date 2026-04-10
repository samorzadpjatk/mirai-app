import { useMemo, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useTRPC, useTRPCClient } from "@mirai-app/frameworks/graphql";
import type { GroupListItem } from "~/components/trips/groups/types";

const PAGE_SIZE = 30;

export function useGroups(tripId?: string | null) {
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();
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
    queryKey: [
      ...trpc.group.getAll.queryOptions({ tripId: tripId ?? "" }).queryKey,
      "infinite",
      PAGE_SIZE,
    ],
    enabled: Boolean(tripId),
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const offset = typeof pageParam === "number" ? pageParam : 0;
      return trpcClient.group.getAll.query({
        tripId: tripId ?? "",
        pagination: {
          limit: PAGE_SIZE,
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
        participantCount: group.participants.length,
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
