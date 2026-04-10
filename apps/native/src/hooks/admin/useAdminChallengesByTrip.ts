import { useMemo, useState, useEffect } from "react";
import {
  useMutation,
  useInfiniteQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { GraphQLClient } from "graphql-request";
import * as SecureStore from "expo-secure-store";
import { useDeleteChallengeSubmissionMutation } from "@mirai-app/graphql-types";

export interface ChallengeItem {
  id: string;
  title: string;
  description: string | null;
  basePoints: number;
  status: string;
  tripId: string;
}

const PAGE_SIZE = 30;

// GraphQL Client setup with SecureStore
const createGraphQLClient = async (): Promise<GraphQLClient> => {
  const token = await SecureStore.getItemAsync("sb-access-token");
  return new GraphQLClient(
    process.env.EXPO_PUBLIC_GRAPHQL_URL || "http://localhost:4000/graphql",
    {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    },
  );
};

// GraphQL query for challenges by trip (manual since hook doesn't exist yet)
const GetChallengesByTripDocument = `
  query GetChallengesByTrip($tripId: ID!, $limit: Int = 30, $offset: Int = 0) {
    challenges(tripId: $tripId, limit: $limit, offset: $offset) {
      edges {
        node {
          id
          name
          description
          basePoints
          status
          tripId
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

// GraphQL mutation for deleting a challenge (manual since hook doesn't exist yet)
const DeleteChallengeDocument = `
  mutation DeleteChallenge($id: ID!, $tripId: ID!) {
    deleteChallenge(input: { id: $id, tripId: $tripId }) {
      success
    }
  }
`;

export function useAdminChallengesByTrip(tripId: string) {
  const [client, setClient] = useState<GraphQLClient | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    createGraphQLClient().then(setClient);
  }, []);

  const challengeQueryKey = ["GetChallengesByTrip", tripId];

  const {
    data,
    isLoading,
    isRefetching,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: [...challengeQueryKey, "infinite", PAGE_SIZE],
    enabled: !!tripId && !!client,
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      if (!client) {
        throw new Error("GraphQL client not initialized");
      }
      const offset = typeof pageParam === "number" ? pageParam : 0;
      const result = await client.request<{
        challenges?: {
          edges?: Array<{ node: ChallengeItem & { name: string } }>;
          pageInfo?: { hasNextPage: boolean; endCursor?: string };
        };
      }>(GetChallengesByTripDocument, {
        tripId,
        limit: PAGE_SIZE,
        offset,
      });

      const challenges =
        result.challenges?.edges?.map((edge) => ({
          ...edge.node,
          title: edge.node.name,
        })) ?? [];

      return {
        challenges,
        pagination: {
          hasMore: result.challenges?.pageInfo?.hasNextPage ?? false,
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
  });

  const challengesData = useMemo(
    () => (data?.pages ?? []).flatMap((page) => page.challenges ?? []),
    [data?.pages],
  );

  const challenges: ChallengeItem[] = useMemo(() => {
    if (!challengesData) return [];

    return challengesData.map((challenge) => ({
      id: challenge.id,
      title: challenge.title,
      description: challenge.description ?? null,
      basePoints: challenge.basePoints ?? 0,
      status: challenge.status ?? "HIDDEN",
      tripId: challenge.tripId,
    }));
  }, [challengesData]);

  // Manual delete mutation using GraphQL client
  const deleteChallengeMutation = useMutation({
    mutationFn: async (variables: { id: string; tripId: string }) => {
      if (!client) {
        throw new Error("GraphQL client not initialized");
      }
      return client.request<{ deleteChallenge?: { success: boolean } }>(
        DeleteChallengeDocument,
        variables,
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: challengeQueryKey });
    },
  });

  const deleteChallenge = (id: string) => {
    return deleteChallengeMutation.mutateAsync({ id, tripId });
  };

  const stats = useMemo(
    () => ({
      totalChallenges: challenges.length,
    }),
    [challenges],
  );

  return {
    challenges,
    isLoading,
    isRefetching,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
    isDeleting: deleteChallengeMutation.isPending,
    deleteChallenge,
    stats,
  };
}
