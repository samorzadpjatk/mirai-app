import { useEffect, useMemo, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { GraphQLClient } from "graphql-request";
import * as SecureStore from "expo-secure-store";
import { useGetTripsQuery } from "@mirai-app/graphql-types";
import type { TripListItem } from "~/components/trips/list/types";
import {
  getCachedTrips,
  setCachedTrips,
} from "~/services/storage/selectedTripStorage";

const PAGE_SIZE = 20;

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

export function useTrips() {
  const [client, setClient] = useState<GraphQLClient | null>(null);
  const [cachedTrips, setCachedTripsState] = useState<TripListItem[] | null>(
    null,
  );
  const [isCacheHydrated, setIsCacheHydrated] = useState(false);

  useEffect(() => {
    void createGraphQLClient().then(setClient);
  }, []);

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
  } = useInfiniteQuery({
    queryKey: ["GetTrips", "infinite", PAGE_SIZE],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      if (!client) {
        throw new Error("GraphQL client not initialized");
      }
      const offset = typeof pageParam === "number" ? pageParam : 0;
      const result = await useGetTripsQuery.fetcher(client, {
        limit: PAGE_SIZE,
        offset,
      })();
      return {
        trips: result.trips,
        pagination: {
          hasMore: result.trips.length === PAGE_SIZE,
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
    enabled: !!client,
  });

  const tripsData = useMemo(
    () => (data ? data.pages.flatMap((page) => page.trips ?? []) : null),
    [data],
  );

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      const cached = await getCachedTrips();
      if (!isMounted) return;
      setCachedTripsState(cached);
      setIsCacheHydrated(true);
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!tripsData?.length) return;
    const normalizedTrips = [...(tripsData as TripListItem[])];
    void setCachedTrips(normalizedTrips);
  }, [tripsData]);

  const allTrips: TripListItem[] = useMemo(() => {
    if (tripsData) {
      return [...(tripsData as TripListItem[])];
    }
    if (cachedTrips) {
      return [...cachedTrips];
    }
    return [];
  }, [tripsData, cachedTrips]);

  const isLoadingTrips =
    (isLoading || !isCacheHydrated) && allTrips.length === 0;

  return {
    trips: allTrips,
    isLoading: isLoadingTrips,
    isRefetching,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    isError,
    error,
    refetch,
  };
}
