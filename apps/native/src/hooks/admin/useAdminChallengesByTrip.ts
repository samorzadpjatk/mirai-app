import { useMemo, useState, useEffect, useCallback } from "react";
import { useMutation, useClient } from "urql";
import { GraphQLClient } from "graphql-request";
import * as SecureStore from "expo-secure-store";

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
  const urqlClient = useClient();

  useEffect(() => {
    createGraphQLClient().then(setClient);
  }, []);

  // Pagination state (replacing useInfiniteQuery)
  const [pages, setPages] = useState<
    Array<{
      challenges: Array<ChallengeItem & { name: string }>;
      pagination: {
        hasMore: boolean;
        offset: number;
        limit: number;
      };
    }>
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefetching, setIsRefetching] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);

  // Manual fetch function
  const fetchChallenges = useCallback(
    async (offset: number, isNextPage = false) => {
      if (!client) {
        throw new Error("GraphQL client not initialized");
      }
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
    [client, tripId],
  );

  // Initial load
  const loadInitial = useCallback(async () => {
    if (!tripId || !client) return;
    setIsLoading(true);
    try {
      const page = await fetchChallenges(0);
      setPages([page]);
      setHasNextPage(page.pagination.hasMore);
    } finally {
      setIsLoading(false);
    }
  }, [fetchChallenges, tripId, client]);

  // Fetch next page
  const fetchNextPage = useCallback(async () => {
    if (!hasNextPage || isFetchingNextPage || !tripId || !client) return;
    setIsFetchingNextPage(true);
    try {
      const lastPage = pages[pages.length - 1];
      const nextOffset = lastPage.pagination.offset + PAGE_SIZE;
      const page = await fetchChallenges(nextOffset, true);
      setPages((prev) => [...prev, page]);
      setHasNextPage(page.pagination.hasMore);
    } finally {
      setIsFetchingNextPage(false);
    }
  }, [fetchChallenges, hasNextPage, isFetchingNextPage, pages, tripId, client]);

  // Refetch
  const refetch = useCallback(async () => {
    if (!tripId || !client) return;
    setIsRefetching(true);
    try {
      setPages([]);
      setHasNextPage(true);
      const page = await fetchChallenges(0);
      setPages([page]);
      setHasNextPage(page.pagination.hasMore);
    } finally {
      setIsRefetching(false);
    }
  }, [fetchChallenges, tripId, client]);

  // Load initial data when client is ready
  useEffect(() => {
    if (client && tripId) {
      void loadInitial();
    }
  }, [client, tripId, loadInitial]);

  const challengesData = useMemo(
    () => pages.flatMap((page) => page.challenges ?? []),
    [pages],
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

  // Manual delete mutation using urql
  const [, deleteChallengeMutation] = useMutation(DeleteChallengeDocument);

  const deleteChallenge = useCallback(
    async (id: string) => {
      const result = await deleteChallengeMutation({ id, tripId });
      if (!result.error) {
        // Invalidate challenges query
        await urqlClient.invalidate(GetChallengesByTripDocument, { tripId });
        // Refresh data
        await refetch();
      }
      return result;
    },
    [deleteChallengeMutation, tripId, urqlClient, refetch],
  );

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
    isDeleting: false, // urql doesn't expose isPending the same way
    deleteChallenge,
    stats,
  };
}
