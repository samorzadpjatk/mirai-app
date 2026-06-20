import { buildTripQueryInput, getNextTripPageParam } from "@mirai-app/common/trips";
import { orpc } from "@mirai-app/orpc/client";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import type { TripListItem } from "~/components/trips/list/types";

export function useHomeFull() {
  const {
    data,
    isLoading,
    isRefetching,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    isError,
    error,
    refetch,
  } = useInfiniteQuery(
    orpc.home.getHomeFull.infiniteOptions({
      input: (pageParam) => buildTripQueryInput(pageParam),
      initialPageParam: 0,
      getNextPageParam: (lastPage) => getNextTripPageParam(lastPage.trips),
    }),
  );

  const trips = useMemo<TripListItem[]>(
    () => data?.pages.flatMap((page) => (page.trips.trips as TripListItem[]) ?? []) ?? [],
    [data],
  );

  const user = useMemo(() => data?.pages[0]?.user, [data]);
  const notifications = useMemo(() => data?.pages[0]?.notifications, [data]);

  const isLoadingHome = isLoading && trips.length === 0;

  return {
    user,
    notifications,
    trips,
    isLoading: isLoadingHome,
    isRefetching,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    isError,
    error,
    refetch,
  };
}
