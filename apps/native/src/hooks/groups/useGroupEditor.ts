import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GraphQLClient } from "graphql-request";
import * as SecureStore from "expo-secure-store";
import {
  useGetGroupQuery,
  useUpdateGroupMutation,
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

export function useGroupEditor(groupId?: string | null) {
  const queryClient = useQueryClient();

  const groupQuery = useQuery({
    queryKey: useGetGroupQuery.getKey({ id: groupId ?? "" }),
    queryFn: async () => {
      const client = await createGraphQLClient();
      return useGetGroupQuery.fetcher(client, { id: groupId ?? "" })();
    },
    enabled: !!groupId,
  });

  const updateMutation = useMutation({
    mutationFn: async (variables: {
      id: string;
      tripId: string;
      name?: string;
      image?: string | null;
    }) => {
      const client = await createGraphQLClient();
      return useUpdateGroupMutation.fetcher(client, {
        input: {
          id: variables.id,
          tripId: variables.tripId,
          name: variables.name,
          image: variables.image ?? null,
        },
      })();
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: useGetGroupQuery.getKey({ id: variables.id }),
      });
      await queryClient.invalidateQueries({
        queryKey: useGetGroupsByTripQuery.getKey({
          tripId: variables.tripId,
          limit: 30,
          offset: 0,
        }),
      });
    },
  });

  // TODO: assignMutation and removeMutation need custom GraphQL mutations
  // These are not yet available in the generated hooks
  const assignUser = async (_userId: string, _tripId: string) => {
    throw new Error("assignUser not yet implemented with GraphQL");
  };

  const removeUser = async (_userId: string) => {
    throw new Error("removeUser not yet implemented with GraphQL");
  };

  const updateGroup = async (data: {
    id: string;
    name?: string;
    image?: string;
    tripId?: string;
  }) => {
    const tripId = data.tripId ?? groupQuery.data?.group?.trip?.id;
    if (!tripId) throw new Error("Missing tripId for updateGroup");
    return updateMutation.mutateAsync({
      ...data,
      tripId,
      image: data.image ?? null,
    });
  };

  return {
    group: groupQuery.data?.group,
    isLoading: groupQuery.isLoading,
    isUpdating: updateMutation.isPending,
    updateGroup,
    assignUser,
    removeUser,
  } as const;
}
