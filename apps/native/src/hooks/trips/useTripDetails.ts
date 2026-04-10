import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { GraphQLClient } from "graphql-request";
import * as SecureStore from "expo-secure-store";
import {
  useGetCurrentUserQuery,
  useGetTripQuery,
} from "@mirai-app/graphql-types";
import {
  getCachedTripById,
  setCachedTripById,
  upsertCachedTripListItem,
} from "~/services/storage/selectedTripStorage";
import type { TripListItem } from "~/components/trips/list/types";
import { isTripPast } from "~/utils/trip";

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

export function useTripDetails(tripId?: string | null) {
  const [client, setClient] = useState<GraphQLClient | null>(null);

  useEffect(() => {
    void createGraphQLClient().then(setClient);
  }, []);

  const currentUserQuery = useQuery({
    queryKey: ["GetCurrentUser"],
    queryFn: async () => {
      if (!client) {
        throw new Error("GraphQL client not initialized");
      }
      return useGetCurrentUserQuery.fetcher(client)();
    },
    enabled: !!client,
  });

  const tripQuery = useQuery({
    queryKey: ["GetTrip", tripId],
    queryFn: async () => {
      if (!client) {
        throw new Error("GraphQL client not initialized");
      }
      return useGetTripQuery.fetcher(client, { id: tripId ?? "" })();
    },
    enabled: !!tripId && !!client,
  });

  const { data: currentUserData, isLoading: isLoadingUser } = currentUserQuery;
  const currentUser = currentUserData?.me;

  type TripData = NonNullable<typeof tripQuery.data>["trip"];
  const [cachedTrip, setCachedTrip] = useState<TripData | null>(null);
  const [cachedTripId, setCachedTripId] = useState<string | null>(null);
  const [isCacheHydrated, setIsCacheHydrated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      if (!isMounted) return;
      setCachedTrip(null);
      setCachedTripId(null);
      setIsCacheHydrated(false);

      if (!tripId) {
        setIsCacheHydrated(true);
        return;
      }

      const cached = await getCachedTripById<TripData>(tripId);
      if (!isMounted) return;
      setCachedTrip(cached);
      setCachedTripId(tripId);
      setIsCacheHydrated(true);
    })();

    return () => {
      isMounted = false;
    };
  }, [tripId]);

  useEffect(() => {
    if (!tripId || !tripData) return;

    void setCachedTripById(tripId, tripData);

    const listItem: TripListItem = {
      id: tripData.id,
      name: tripData.name,
      description: tripData.description,
      startDate: tripData.startDate,
      endDate: tripData.endDate,
      backgroundImagePath: tripData.backgroundImagePath,
      groups: tripData.groups,
    };
    void upsertCachedTripListItem(listItem);
  }, [tripId, tripData]);

  const localCachedTrip = cachedTripId === (tripId ?? null) ? cachedTrip : null;
  const tripData = tripQuery.data?.trip;
  const trip = tripData ?? localCachedTrip ?? null;
  const isLoadingTrip =
    Boolean(tripId) && !trip && (tripQuery.isLoading || !isCacheHydrated);

  const isTripPastValue = trip ? isTripPast(trip.endDate) : false;

  return {
    currentUser,
    isLoadingUser,
    trip,
    isLoadingTrip,
    refetchTrip: tripQuery.refetch,
    isErrorTrip: tripQuery.isError,
    tripError: tripQuery.error,
    isTripPast: isTripPastValue,
  };
}
