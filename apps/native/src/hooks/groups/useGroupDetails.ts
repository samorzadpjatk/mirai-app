import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GraphQLClient } from "graphql-request";
import * as SecureStore from "expo-secure-store";
import {
  useGetCurrentUserQuery,
  useGetGroupQuery,
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

export function useGroupDetails(groupId?: string | null) {
  const queryClient = useQueryClient();

  const currentUserQuery = useQuery({
    queryKey: useGetCurrentUserQuery.getKey(),
    queryFn: async () => {
      const client = await createGraphQLClient();
      return useGetCurrentUserQuery.fetcher(client)();
    },
  });

  const groupQuery = useQuery({
    queryKey: useGetGroupQuery.getKey({ id: groupId ?? "" }),
    queryFn: async () => {
      const client = await createGraphQLClient();
      return useGetGroupQuery.fetcher(client, { id: groupId ?? "" })();
    },
    enabled: !!groupId,
  });

  return {
    currentUser: currentUserQuery.data?.me,
    isLoadingUser: currentUserQuery.isLoading,
    group: groupQuery.data?.group,
    isLoadingGroup: groupQuery.isLoading,
  } as const;
}
