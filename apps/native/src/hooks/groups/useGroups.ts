import { useCallback, useMemo, useState } from "react";
import { useQuery } from "urql";
import { GetGroupsByTripDocument } from "@mirai-app/frameworks";
import type { GroupListItem } from "~/components/trips/groups/types";

const PAGE_SIZE = 30;

export function useGroups(tripId?: string | null) {
  const [searchQuery, setSearchQuery] = useState("");
  const [offset, setOffset] = useState(0);

  const [{ data, fetching }] = useQuery({
    query: GetGroupsByTripDocument,
    variables: {
      tripId: tripId ?? "",
      limit: PAGE_SIZE,
      offset,
    },
    pause: !tripId,
  });

  const groups = useMemo(() => data?.groupsByTrip ?? [], [data]);

  const hasNextPage = useMemo(() => {
    return groups.length === PAGE_SIZE;
  }, [groups.length]);

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

  const fetchNextPage = useCallback(() => {
    if (hasNextPage) {
      setOffset((prev) => prev + PAGE_SIZE);
    }
  }, [hasNextPage]);

  const refetch = useCallback(() => {
    setOffset(0);
    // urql will refetch when variables change
  }, []);

  return {
    groups,
    filteredGroups,
    isLoading: fetching && offset === 0,
    isRefetching: fetching && offset === 0,
    hasNextPage,
    isFetchingNextPage: fetching && offset > 0,
    fetchNextPage,
    refetch,
    searchQuery,
    setSearchQuery,
  };
}
