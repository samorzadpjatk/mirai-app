"use client";

import { useMemo } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useTRPCClient } from "../client/react";

const REWARDS_PER_PAGE = 30;

export interface Reward {
  id: string;
  tripId: string;
  name: string;
  description: string;
  coinCost: number;
  originalCoinCost: number | null;
  availableQuantity: number;
  isHidden: boolean;
  purchasedCount: number;
  image: string | null;
  signedImageUrl: string | null;
  createdAt: string;
  createdByName: string;
}

interface RewardsPagination {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

interface RewardsResponse {
  rewards: Reward[];
  pagination: RewardsPagination;
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const parseReward = (value: unknown): Reward | null => {
  if (
    !isObject(value) ||
    typeof value.id !== "string" ||
    typeof value.name !== "string"
  ) {
    return null;
  }

  const createdByRaw = isObject(value.createdBy) ? value.createdBy : null;
  const createdByName = createdByRaw
    ? `${typeof createdByRaw.firstName === "string" ? createdByRaw.firstName : ""} ${typeof createdByRaw.lastName === "string" ? createdByRaw.lastName : ""}`.trim()
    : "";

  return {
    id: value.id,
    tripId: typeof value.tripId === "string" ? value.tripId : "",
    name: value.name,
    description: typeof value.description === "string" ? value.description : "",
    coinCost: typeof value.coinCost === "number" ? value.coinCost : 0,
    originalCoinCost:
      typeof value.originalCoinCost === "number"
        ? value.originalCoinCost
        : null,
    availableQuantity:
      typeof value.availableQuantity === "number" ? value.availableQuantity : 0,
    isHidden: Boolean(value.isHidden),
    purchasedCount:
      typeof value.purchasedCount === "number" ? value.purchasedCount : 0,
    image: typeof value.image === "string" ? value.image : null,
    signedImageUrl:
      typeof value.signedImageUrl === "string" ? value.signedImageUrl : null,
    createdAt:
      typeof value.createdAt === "string"
        ? value.createdAt
        : new Date().toISOString(),
    createdByName: createdByName || "Unknown",
  };
};

const parseRewardsResponse = (value: unknown): RewardsResponse => {
  if (!isObject(value)) {
    return {
      rewards: [],
      pagination: {
        total: 0,
        limit: REWARDS_PER_PAGE,
        offset: 0,
        hasMore: false,
      },
    };
  }

  const rewardsRaw = Array.isArray(value.rewards) ? value.rewards : [];
  const rewards = rewardsRaw
    .map(parseReward)
    .filter((reward): reward is Reward => reward !== null);

  const paginationRaw = isObject(value.pagination) ? value.pagination : {};

  return {
    rewards,
    pagination: {
      total:
        typeof paginationRaw.total === "number"
          ? paginationRaw.total
          : rewards.length,
      limit:
        typeof paginationRaw.limit === "number"
          ? paginationRaw.limit
          : REWARDS_PER_PAGE,
      offset:
        typeof paginationRaw.offset === "number" ? paginationRaw.offset : 0,
      hasMore: Boolean(paginationRaw.hasMore),
    },
  };
};

export function useAdminRewards(tripId: string, searchTerm: string) {
  const trpc = useTRPCClient();
  const queryClient = useQueryClient();

  const {
    data,
    isLoading: rewardsLoading,
    error: rewardsError,
    isRefetching: rewardsRefetching,
    hasNextPage: rewardsHasNextPage,
    isFetchingNextPage: rewardsFetchingNextPage,
    fetchNextPage: fetchMoreRewards,
    refetch: refetchRewards,
  } = useInfiniteQuery({
    queryKey: ["rewards", tripId],
    enabled: Boolean(tripId),
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const offset = typeof pageParam === "number" ? pageParam : 0;

      const result = await trpc.reward.getByTripAdmin.query({
        tripId,
        pagination: {
          limit: REWARDS_PER_PAGE,
          offset,
        },
      });

      return parseRewardsResponse(result);
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination.hasMore) {
        return undefined;
      }
      return lastPage.pagination.offset + lastPage.pagination.limit;
    },
  });

  const rewards = useMemo(() => {
    const allRewards = (data?.pages ?? []).flatMap((page) => page.rewards);
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) {
      return allRewards;
    }

    return allRewards.filter(
      (reward) =>
        reward.name.toLowerCase().includes(normalizedSearch) ||
        reward.description.toLowerCase().includes(normalizedSearch),
    );
  }, [data?.pages, searchTerm]);

  const rewardsPagination = useMemo(
    () => data?.pages?.[data.pages.length - 1]?.pagination,
    [data],
  );

  const createRewardMutation = useMutation({
    mutationFn: (input: {
      tripId: string;
      name: string;
      description: string;
      coinCost: number;
      availableQuantity: number;
      image?: string;
      isHidden?: boolean;
    }) => trpc.reward.create.mutate(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["rewards", tripId] });
    },
  });

  const updateRewardMutation = useMutation({
    mutationFn: (input: {
      id: string;
      name?: string;
      description?: string;
      coinCost?: number;
      availableQuantity?: number;
      image?: string | null;
    }) => trpc.reward.update.mutate(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["rewards", tripId] });
    },
  });

  const setRewardHiddenMutation = useMutation({
    mutationFn: (input: { id: string; isHidden: boolean }) =>
      trpc.reward.setHidden.mutate(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["rewards", tripId] });
    },
  });

  const deleteRewardMutation = useMutation({
    mutationFn: (input: { id: string }) => trpc.reward.delete.mutate(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["rewards", tripId] });
    },
  });

  return {
    rewards,
    rewardsLoading,
    rewardsError,
    rewardsRefetching,
    rewardsHasNextPage,
    rewardsFetchingNextPage,
    rewardsPagination,
    fetchMoreRewards,
    refetchRewards,
    createReward: createRewardMutation.mutateAsync,
    isCreatingReward: createRewardMutation.isPending,
    updateReward: updateRewardMutation.mutateAsync,
    isUpdatingReward: updateRewardMutation.isPending,
    setRewardHidden: setRewardHiddenMutation.mutateAsync,
    isSettingRewardHidden: setRewardHiddenMutation.isPending,
    deleteReward: deleteRewardMutation.mutateAsync,
    isDeletingReward: deleteRewardMutation.isPending,
  };
}
