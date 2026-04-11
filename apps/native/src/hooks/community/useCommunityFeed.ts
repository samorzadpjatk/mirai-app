import { useCallback, useMemo, useState } from "react";
import { useMutation, useClient } from "urql";
import { GraphQLClient } from "graphql-request";
import * as SecureStore from "expo-secure-store";
import {
  useGetActivitiesByTripQuery,
  useToggleActivityReactionMutation,
} from "@mirai-app/graphql-client";
import type {
  CommunityFeedActivity,
  ActivityFilter,
} from "~/components/community/CommunityActivityCard";

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

type FeedCursor = {
  id: string;
  createdAt: Date | string;
  isPinned: boolean;
} | null;

interface FeedPageData {
  activities: CommunityFeedActivity[];
  pagination: {
    total: number | null;
    page: number | null;
    pageSize: number;
    totalPages: number | null;
    hasMore?: boolean;
  };
  nextCursor?: FeedCursor;
}

const emptyReactionSummary = () => ({
  total: 0,
  counts: {
    heart: 0,
    fire: 0,
    clap: 0,
    star: 0,
  },
  myReactions: [] as string[],
});

const toggleHeartSummaryLocally = (
  summary: CommunityFeedActivity["reactionsSummary"] | undefined,
) => {
  const normalized = summary ?? emptyReactionSummary();
  const myReactions = new Set(normalized.myReactions ?? []);
  const hadHeart = myReactions.has("heart");

  if (hadHeart) {
    myReactions.delete("heart");
  } else {
    myReactions.add("heart");
  }

  return {
    ...normalized,
    total: Math.max(0, normalized.total + (hadHeart ? -1 : 1)),
    counts: {
      ...(normalized.counts ?? emptyReactionSummary().counts),
      heart: Math.max(0, (normalized.counts?.heart ?? 0) + (hadHeart ? -1 : 1)),
    },
    myReactions: Array.from(myReactions),
  };
};

interface UseCommunityFeedProps {
  selectedTripId: string | null;
  selectedFilter: ActivityFilter;
  focusActivityId?: string;
}

// GraphQL document for activities by trip query
const GetActivitiesByTripDocument = `
  query GetActivitiesByTrip($tripId: ID!, $limit: Int = 30, $cursor: ActivityCursorInput) {
    activitiesByTrip(tripId: $tripId, limit: $limit, cursor: $cursor) {
      activities {
        id
        activityType
        createdAt
        isPinned
        reactionsSummary {
          total
          counts {
            heart
            fire
            clap
            star
          }
          myReactions
        }
        userPost {
          id
          content
          imagePaths
          author {
            user {
              id
              firstName
              lastName
              hasAvatar
            }
            houseNumber
          }
        }
        admin {
          id
          firstName
          lastName
          hasAvatar
        }
        tripId
        rankChange {
          newRank
          previousRank
        }
      }
      pagination {
        total
        page
        pageSize
        totalPages
        hasMore
      }
      nextCursor {
        id
        createdAt
        isPinned
      }
    }
  }
`;

export const useCommunityFeed = ({
  selectedTripId,
  selectedFilter,
  focusActivityId,
}: UseCommunityFeedProps) => {
  const client = useClient();

  // Pagination state
  const [pages, setPages] = useState<FeedPageData[]>([]);
  const [currentCursor, setCurrentCursor] = useState<FeedCursor>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);

  const feedQueryKey = useMemo(
    () =>
      selectedTripId
        ? (useGetActivitiesByTripQuery.getKey({
            tripId: selectedTripId,
            limit: 30,
          }) as readonly unknown[])
        : null,
    [selectedTripId],
  );

  // Manual fetch function for pagination
  const fetchPage = useCallback(
    async (cursor: FeedCursor, isNextPage = false) => {
      if (!selectedTripId) {
        return {
          activities: [],
          pagination: {
            total: null,
            page: null,
            pageSize: 30,
            totalPages: null,
            hasMore: false,
          },
          nextCursor: null,
        } satisfies FeedPageData;
      }

      const graphqlClient = await createGraphQLClient();
      const result = await useGetActivitiesByTripQuery.fetcher(graphqlClient, {
        tripId: selectedTripId,
        limit: 30,
        cursor: cursor
          ? {
              id: cursor.id,
              createdAt:
                cursor.createdAt instanceof Date
                  ? cursor.createdAt.toISOString()
                  : cursor.createdAt,
              isPinned: cursor.isPinned,
            }
          : undefined,
      })();

      return {
        activities: result.activitiesByTrip
          .activities as CommunityFeedActivity[],
        pagination: {
          total: result.activitiesByTrip.pagination.total,
          page: result.activitiesByTrip.pagination.page,
          pageSize: result.activitiesByTrip.pagination.pageSize,
          totalPages: result.activitiesByTrip.pagination.totalPages,
          hasMore: result.activitiesByTrip.pagination.hasMore,
        },
        nextCursor: result.activitiesByTrip.nextCursor
          ? {
              id: result.activitiesByTrip.nextCursor.id,
              createdAt: result.activitiesByTrip.nextCursor.createdAt,
              isPinned: result.activitiesByTrip.nextCursor.isPinned,
            }
          : undefined,
      } satisfies FeedPageData;
    },
    [selectedTripId],
  );

  // Initial load
  const loadInitial = useCallback(async () => {
    if (!selectedTripId) return;
    setIsLoading(true);
    try {
      const page = await fetchPage(null);
      setPages([page]);
      setCurrentCursor(page.nextCursor ?? null);
      setHasMore(page.pagination.hasMore ?? false);
    } finally {
      setIsLoading(false);
    }
  }, [fetchPage, selectedTripId]);

  // Fetch next page
  const fetchNextPage = useCallback(async () => {
    if (!hasMore || isFetchingNextPage || !selectedTripId) return;
    setIsFetchingNextPage(true);
    try {
      const page = await fetchPage(currentCursor, true);
      setPages((prev) => [...prev, page]);
      setCurrentCursor(page.nextCursor ?? null);
      setHasMore(page.pagination.hasMore ?? false);
    } finally {
      setIsFetchingNextPage(false);
    }
  }, [currentCursor, fetchPage, hasMore, isFetchingNextPage, selectedTripId]);

  // Refetch
  const refetch = useCallback(async () => {
    setPages([]);
    setCurrentCursor(null);
    setHasMore(true);
    await loadInitial();
  }, [loadInitial]);

  const applyReactionSummaryToFeed = (
    activityId: string,
    updater:
      | CommunityFeedActivity["reactionsSummary"]
      | ((
          current: CommunityFeedActivity["reactionsSummary"] | undefined,
        ) => CommunityFeedActivity["reactionsSummary"]),
    queryKeyOverride?: readonly unknown[],
  ) => {
    const queryKey = queryKeyOverride ?? feedQueryKey;
    if (!queryKey) return;

    // Update local state instead of queryClient
    setPages((currentPages) =>
      currentPages.map((page) => ({
        ...page,
        activities: page.activities.map((activity) => {
          if (activity.id !== activityId) return activity;
          const nextSummary =
            typeof updater === "function"
              ? updater(activity.reactionsSummary)
              : updater;
          return {
            ...activity,
            reactionsSummary: nextSummary,
          };
        }),
      })),
    );
  };

  // GraphQL mutation for toggling heart reaction
  const [, toggleHeartMutation] = useMutation(ToggleActivityReactionDocument);

  const handleToggleHeart = useCallback(
    async (activityId: string) => {
      // Optimistic update
      const queryKey = feedQueryKey;
      if (selectedTripId && queryKey) {
        applyReactionSummaryToFeed(
          activityId,
          toggleHeartSummaryLocally,
          queryKey,
        );
      }

      try {
        const result = await toggleHeartMutation({
          activityId,
          reaction: "heart",
        });

        if (result.data?.toggleActivityReaction) {
          applyReactionSummaryToFeed(
            result.data.toggleActivityReaction.activityId,
            result.data.toggleActivityReaction
              .reactionsSummary as CommunityFeedActivity["reactionsSummary"],
            queryKey,
          );
        }
      } catch (error) {
        // Revert optimistic update on error - refetch the page
        console.error("Failed to toggle reaction:", error);
        await refetch();
      }
    },
    [feedQueryKey, selectedTripId, toggleHeartMutation, refetch],
  );

  const activities = useMemo(
    () => pages.flatMap((page) => page.activities ?? []),
    [pages],
  );

  const filteredActivities = useMemo(() => {
    const base =
      selectedFilter === "all"
        ? activities
        : activities.filter(
            (activity) => activity.activityType === selectedFilter,
          );

    if (!focusActivityId) return base;

    const focused = base.find((activity) => activity.id === focusActivityId);
    if (!focused) return base;

    const rest = base.filter((activity) => activity.id !== focusActivityId);
    return [focused, ...rest];
  }, [activities, focusActivityId, selectedFilter]);

  return {
    feedQuery: {
      data: { pages },
      isLoading,
      isRefetching: isLoading,
      hasNextPage: hasMore,
      isFetchingNextPage,
      fetchNextPage,
      refetch,
    },
    filteredActivities,
    handleToggleHeart,
  };
};

// GraphQL document for toggle reaction mutation
const ToggleActivityReactionDocument = `
  mutation ToggleActivityReaction($activityId: ID!, $reaction: String!) {
    toggleActivityReaction(activityId: $activityId, reaction: $reaction) {
      activityId
      reactionsSummary {
        total
        counts {
          heart
          fire
          clap
          star
        }
        myReactions
      }
    }
  }
`;

export type { FeedCursor, FeedPageData };
