import { useCallback, useMemo } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { GraphQLClient } from "graphql-request";
import * as SecureStore from "expo-secure-store";
import {
  useGetActivitiesByTripQuery,
  useToggleActivityReactionMutation,
} from "@mirai-app/graphql-types";
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

export const useCommunityFeed = ({
  selectedTripId,
  selectedFilter,
  focusActivityId,
}: UseCommunityFeedProps) => {
  const queryClient = useQueryClient();

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

  const feedQuery = useInfiniteQuery({
    queryKey: feedQueryKey ?? ["community-feed-disabled"],
    enabled: Boolean(selectedTripId && feedQueryKey),
    initialPageParam: null as FeedCursor,
    queryFn: async ({ pageParam }) => {
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

      const client = await createGraphQLClient();
      const result = await useGetActivitiesByTripQuery.fetcher(client, {
        tripId: selectedTripId,
        limit: 30,
        cursor: pageParam
          ? {
              id: pageParam.id,
              createdAt:
                pageParam.createdAt instanceof Date
                  ? pageParam.createdAt.toISOString()
                  : pageParam.createdAt,
              isPinned: pageParam.isPinned,
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
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

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

    queryClient.setQueryData(
      queryKey,
      (oldData: { pages: FeedPageData[] } | undefined) => {
        if (!oldData?.pages) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page: FeedPageData) => ({
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
        };
      },
    );
  };

  const toggleHeartMutation = useMutation({
    mutationFn: async ({ activityId }: { activityId: string }) => {
      const client = await createGraphQLClient();
      return useToggleActivityReactionMutation.fetcher(client, {
        activityId,
        reaction: "heart",
      })();
    },
    onMutate: async ({ activityId }) => {
      const queryKey = feedQueryKey;
      if (!selectedTripId || !queryKey) {
        return undefined;
      }

      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData(feedQueryKey);
      applyReactionSummaryToFeed(
        activityId,
        toggleHeartSummaryLocally,
        queryKey,
      );
      return { queryKey, previousData };
    },
    onError: (_error, _variables, context) => {
      if (!context?.queryKey || !context.previousData) return;
      queryClient.setQueryData(context.queryKey, context.previousData);
    },
    onSuccess: (result, _variables, context) => {
      if (result.toggleActivityReaction) {
        applyReactionSummaryToFeed(
          result.toggleActivityReaction.activityId,
          result.toggleActivityReaction
            .reactionsSummary as CommunityFeedActivity["reactionsSummary"],
          context?.queryKey,
        );
      }
    },
  });

  const handleToggleHeart = useCallback(
    (activityId: string) => {
      void toggleHeartMutation.mutateAsync({ activityId });
    },
    [toggleHeartMutation],
  );

  const activities = useMemo(
    () =>
      (feedQuery.data?.pages ?? []).flatMap((page) => page.activities ?? []),
    [feedQuery.data?.pages],
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
    feedQuery,
    filteredActivities,
    handleToggleHeart,
  };
};

export type { FeedCursor, FeedPageData };
