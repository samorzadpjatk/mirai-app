import { useMemo, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { orpc } from "@mirai-app/orpc/client";
import { flattenGroups, filterGroupsBySearch } from "@mirai-app/shared";
import type { GroupListItem } from "~/components/trips/groups/types";

const PAGE_SIZE = 30;

export function buildGroupQueryInput(tripId: string | null | undefined, pageParam: number) {
  const offset = pageParam || 0;
  return {
    tripId: tripId ?? "",
    pagination: {
      limit: PAGE_SIZE,
      offset,
    },
  };
}

export function getNextGroupPageParam(lastPage: {
  pagination: { hasMore: boolean; offset: number; limit: number };
}) {
  if (!lastPage.pagination.hasMore) {
    return undefined;
  }
  return lastPage.pagination.offset + lastPage.pagination.limit;
}

export function useGroups(tripId?: string | null) {
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading, isRefetching, hasNextPage, isFetchingNextPage, fetchNextPage, refetch } =
    useInfiniteQuery(
      orpc.group.getAll.infiniteOptions({
        input: (pageParam: number) => buildGroupQueryInput(tripId, pageParam),
        initialPageParam: 0,
        getNextPageParam: getNextGroupPageParam,
        enabled: Boolean(tripId),
      }),
    );

  const groups = useMemo(() => flattenGroups(data?.pages), [data?.pages]);

  const filteredGroups: GroupListItem[] = useMemo(() => {
    const filtered = filterGroupsBySearch(groups ?? [], searchQuery);
    return filtered.map((group) => ({
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
