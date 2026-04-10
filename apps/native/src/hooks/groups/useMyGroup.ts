import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { GraphQLClient } from "graphql-request";
import * as SecureStore from "expo-secure-store";
import { useGetCurrentUserQuery } from "@mirai-app/graphql-types";

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

export function useMyGroup(tripId?: string | null) {
  // Get current user and extract their group from the trip
  const query = useQuery({
    queryKey: ["GetCurrentUser", "myGroup", tripId],
    queryFn: async () => {
      const client = await createGraphQLClient();
      return useGetCurrentUserQuery.fetcher(client)();
    },
    enabled: !!tripId,
    select: (data) => {
      // Extract group from user's trip participation
      const user = data?.me;
      if (!user?.participations) return null;

      const participation = user.participations.find(
        (p) => p.trip?.id === tripId,
      );
      return participation?.group ?? null;
    },
  });

  return {
    group: query.data,
    isLoading: query.isLoading,
    error: query.error,
  } as const;
}
