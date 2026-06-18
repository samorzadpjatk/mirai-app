import { orpc } from "@mirai-app/orpc/client";
import { filterActivities, toggleHeartSummary } from "@mirai-app/shared/feed";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import type {
  ActivityFilter,
  CommunityFeedActivity,
} from "~/components/community/CommunityActivityCard";

export type { CommunityFeedActivity };

export type FeedCursor = {
  id: string;
  createdAt: Date | string;
  isPinned: boolean;
} | null;

export interface FeedPageData {
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

export interface UseCommunityFeedProps {
  selectedTripId: string | null;
  selectedFilter: ActivityFilter;
  focusActivityId?: string;
}

export function buildEmptyFeedPageData(): FeedPageData {
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
  };
}

export function getNextCommunityFeedPageParam(lastPage: FeedPageData): FeedCursor | undefined {
  return lastPage.nextCursor ?? undefined;
}

export function updateActivityReactionsInPages(
  pages: FeedPageData[],
  activityId: string,
  updater:
    | CommunityFeedActivity["reactionsSummary"]
    | ((
        current: CommunityFeedActivity["reactionsSummary"] | undefined,
      ) => CommunityFeedActivity["reactionsSummary"]),
): FeedPageData[] {
  return pages.map((page) => ({
    ...page,
    activities: page.activities.map((activity) => {
      if (activity.id !== activityId) return activity;
      const nextSummary =
        typeof updater === "function" ? updater(activity.reactionsSummary) : updater;
      return {
        ...activity,
        reactionsSummary: nextSummary,
      };
    }),
  }));
}

export function applyReactionSummaryToFeed(
  queryClient: {
    setQueryData: <T>(
      queryKey: readonly unknown[],
      updater: ((old: T | undefined) => T | undefined) | T | undefined,
    ) => unknown;
  },
  queryKey: readonly unknown[],
  activityId: string,
  updater:
    | CommunityFeedActivity["reactionsSummary"]
    | ((
        current: CommunityFeedActivity["reactionsSummary"] | undefined,
      ) => CommunityFeedActivity["reactionsSummary"]),
): void {
  queryClient.setQueryData(queryKey, (oldData: { pages: FeedPageData[] } | undefined) => {
    if (!oldData?.pages) return oldData;
    return {
      ...oldData,
      pages: updateActivityReactionsInPages(oldData.pages, activityId, updater),
    };
  });
}

export function buildCommunityFeedQueryFn(selectedTripId: string | null, orpcClient: typeof orpc) {
  return async ({ pageParam }: { pageParam: FeedCursor }): Promise<FeedPageData> => {
    if (!selectedTripId) {
      return buildEmptyFeedPageData();
    }

    return (await orpcClient.activityFeed.getByTrip.call({
      tripId: selectedTripId,
      page: 1,
      pageSize: 30,
      cursor: pageParam ?? undefined,
    })) as FeedPageData;
  };
}

export function buildCommunityFeedQueryKey(
  selectedTripId: string | null,
): readonly [string, string, number] | null {
  if (!selectedTripId) return null;
  return ["community-feed", selectedTripId, 30] as const;
}

export function buildCommunityFeedActivities(
  pages: FeedPageData[] | undefined,
): CommunityFeedActivity[] {
  return (pages ?? []).flatMap((page) => page.activities ?? []);
}

export function buildHandleToggleHeart(
  toggleHeart: (args: { activityId: string }) => Promise<unknown>,
): (activityId: string) => Promise<unknown> {
  return (activityId: string) => {
    return toggleHeart({ activityId });
  };
}

export const useCommunityFeed = ({
  selectedTripId,
  selectedFilter,
  focusActivityId,
}: UseCommunityFeedProps) => {
  const queryClient = useQueryClient();
  const orpcClient = orpc;

  const feedQueryKey = useMemo(() => buildCommunityFeedQueryKey(selectedTripId), [selectedTripId]);

  const queryFn = useMemo(
    () => buildCommunityFeedQueryFn(selectedTripId, orpcClient),
    [selectedTripId, orpcClient],
  );

  const feedQuery = useInfiniteQuery({
    queryKey: feedQueryKey ?? ["community-feed-disabled"],
    enabled: Boolean(selectedTripId && feedQueryKey),
    initialPageParam: null as FeedCursor,
    queryFn,
    getNextPageParam: (lastPage) => getNextCommunityFeedPageParam(lastPage),
  });

  const { mutateAsync: toggleHeart } = useMutation({
    mutationFn: async ({ activityId }: { activityId: string }) => {
      return await orpcClient.activityFeed.toggleReaction.call({
        activityId,
        reactionType: "heart",
      });
    },
    onMutate: async ({ activityId }: { activityId: string }) => {
      const queryKey = feedQueryKey;
      if (!selectedTripId || !queryKey) {
        return undefined;
      }

      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData(queryKey);
      applyReactionSummaryToFeed(queryClient, queryKey, activityId, toggleHeartSummary);
      return { queryKey, previousData };
    },
    onError: (_error, _variables, context) => {
      if (!context?.queryKey || !context.previousData) return;
      queryClient.setQueryData(context.queryKey, context.previousData);
    },
    onSuccess: (result, _variables, context) => {
      if (context?.queryKey) {
        applyReactionSummaryToFeed(
          queryClient,
          context.queryKey,
          result.activityId,
          result.reactionsSummary,
        );
      }
    },
  });

  const handleToggleHeart = useCallback(buildHandleToggleHeart(toggleHeart), [toggleHeart]);

  const activities = useMemo(
    () => buildCommunityFeedActivities(feedQuery.data?.pages),
    [feedQuery.data?.pages],
  );

  const filteredActivities = useMemo(
    () => filterActivities(activities, selectedFilter, focusActivityId),
    [activities, selectedFilter, focusActivityId],
  );

  return {
    feedQuery,
    filteredActivities,
    handleToggleHeart,
  };
};
