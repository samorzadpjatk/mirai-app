import { useMemo, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { orpc } from "@mirai-app/orpc/client";
import type { GroupListItem } from "~/components/trips/groups/types";

const PAGE_SIZE = 30;

export function useGroups(tripId?: string | null) {
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading, isRefetching, hasNextPage, isFetchingNextPage, fetchNextPage, refetch } =
    useInfiniteQuery(
      orpc.group.getAll.infiniteOptions({
        input: (pageParam: number) => {
          const offset = pageParam || 0;
          return {
            tripId: tripId ?? "",
            pagination: {
              limit: PAGE_SIZE,
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

  const groups = useMemo(
    () => (data?.pages ?? []).flatMap((page) => page.groups ?? []),
    [data?.pages],
  );

  const filteredGroups: GroupListItem[] = useMemo(() => {
    return groups
      .filter((group) => group.name.toLowerCase().includes(searchQuery.toLowerCase()))
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
