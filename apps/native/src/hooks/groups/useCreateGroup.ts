import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { GraphQLClient } from "graphql-request";
import * as SecureStore from "expo-secure-store";
import {
  useCreateGroupMutation,
  useGetGroupsByTripQuery,
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

export function useCreateGroup(tripId?: string | null) {
  const queryClient = useQueryClient();

  const createGroupMutation = useMutation({
    mutationFn: async (variables: {
      tripId: string;
      name: string;
      image?: string | null;
    }) => {
      const client = await createGraphQLClient();
      return useCreateGroupMutation.fetcher(client, {
        input: {
          tripId: variables.tripId,
          name: variables.name,
          image: variables.image ?? null,
        },
      })();
    },
    onSuccess: async (_, variables) => {
      // Invalidate group queries to refresh the list
      await queryClient.invalidateQueries({
        queryKey: useGetGroupsByTripQuery.getKey({
          tripId: variables.tripId,
          limit: 30,
          offset: 0,
        }),
      });
    },
  });

  const createGroup = async (args: { name: string; image?: string }) => {
    const { name, image } = args;
    return await createGroupMutation.mutateAsync({
      tripId: tripId ?? "",
      name,
      image: image ?? null,
    });
  };

  return {
    createGroup,
    isCreating: createGroupMutation.isPending,
  } as const;
}
