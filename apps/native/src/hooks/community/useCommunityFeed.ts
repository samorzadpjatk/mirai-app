import { useCallback, useMemo } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useTRPCClient } from "@mirai-app/frameworks/graphql";
import type {
  CommunityFeedActivity,
  ActivityFilter,
} from "~/components/community/CommunityActivityCard";

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
  const trpcClient = useTRPCClient();

  const feedQueryKey = useMemo(
    () =>
      selectedTripId ? (["community-feed", selectedTripId, 30] as const) : null,
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

      return (await trpcClient.activityFeed.getByTrip.query({
        tripId: selectedTripId,
        page: 1,
        pageSize: 30,
        cursor: pageParam ?? undefined,
      })) as FeedPageData;
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

  const { mutateAsync: toggleHeart } = useMutation({
    mutationFn: async ({ activityId }: { activityId: string }) => {
      return await trpcClient.activityFeed.toggleReaction.mutate({
        activityId,
        reactionType: "heart",
      });
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
      applyReactionSummaryToFeed(
        result.activityId,
        result.reactionsSummary as CommunityFeedActivity["reactionsSummary"],
        context?.queryKey,
      );
    },
  });

  const handleToggleHeart = useCallback(
    (activityId: string) => {
      void toggleHeart({ activityId });
    },
    [toggleHeart],
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
