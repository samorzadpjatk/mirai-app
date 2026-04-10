import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { GraphQLClient } from "graphql-request";
import * as SecureStore from "expo-secure-store";
import {
  useGetSponsorsQuery,
  useGetSponsorQuery,
  useGetSponsorsByTripQuery,
} from "@mirai-app/graphql-types";

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

export function useSponsors() {
  const [client, setClient] = useState<GraphQLClient | null>(null);

  useEffect(() => {
    void createGraphQLClient().then(setClient);
  }, []);

  return useQuery({
    queryKey: ["GetSponsors"],
    queryFn: async () => {
      if (!client) {
        throw new Error("GraphQL client not initialized");
      }
      return useGetSponsorsQuery.fetcher(client)();
    },
    enabled: !!client,
  });
}

export function useSponsorById(id: string) {
  const [client, setClient] = useState<GraphQLClient | null>(null);

  useEffect(() => {
    void createGraphQLClient().then(setClient);
  }, []);

  return useQuery({
    queryKey: ["GetSponsor", id],
    queryFn: async () => {
      if (!client) {
        throw new Error("GraphQL client not initialized");
      }
      return useGetSponsorQuery.fetcher(client, { id })();
    },
    enabled: !!id && !!client,
  });
}

export function useTripSponsors(tripId: string) {
  const [client, setClient] = useState<GraphQLClient | null>(null);

  useEffect(() => {
    void createGraphQLClient().then(setClient);
  }, []);

  return useQuery({
    queryKey: ["GetSponsorsByTrip", tripId],
    queryFn: async () => {
      if (!client) {
        throw new Error("GraphQL client not initialized");
      }
      return useGetSponsorsByTripQuery.fetcher(client, { tripId })();
    },
    enabled: !!tripId && !!client,
  });
}
