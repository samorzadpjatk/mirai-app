import { orpc } from "@mirai-app/orpc/client";
import {
  invalidateRewardQueries,
  invalidateTransactionQueries,
} from "@mirai-app/orpc/client/query";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

const PAGE_SIZE = 30;

export function buildAdminRewardQueryInput(tripId: string | null | undefined, pageParam: number) {
  const offset = typeof pageParam === "number" ? pageParam : 0;
  return {
    tripId: tripId ?? "",
    pagination: {
      limit: PAGE_SIZE,
      offset,
    },
  };
}

export function getNextAdminRewardPageParam(lastPage: {
  pagination: { hasMore: boolean; offset: number; limit: number };
}) {
  if (!lastPage.pagination.hasMore) {
    return undefined;
  }
  return lastPage.pagination.offset + lastPage.pagination.limit;
}

export const useRewards = (tripId: string) => {
  return useQuery(
    orpc.reward.getByTrip.queryOptions({ input: { tripId }, enabled: Boolean(tripId) }),
  );
};

export const useAdminRewards = (tripId?: string | null) => {
  const {
    data,
    isLoading,
    error,
    isRefetching,
    refetch,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteQuery(
    orpc.reward.getByTripAdmin.infiniteOptions({
      input: (pageParam: number) => buildAdminRewardQueryInput(tripId, pageParam),
      initialPageParam: 0,
      getNextPageParam: getNextAdminRewardPageParam,
      enabled: Boolean(tripId),
    }),
  );

  const rewards = useMemo(
    () => (data?.pages ?? []).flatMap((page) => page.rewards ?? []),
    [data?.pages],
  );

  return {
    data: rewards,
    isLoading,
    error,
    isRefetching,
    refetch,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  };
};

export const useReward = (id: string | null) => {
  return useQuery(
    orpc.reward.getById.queryOptions({ input: { id: id ?? "" }, enabled: Boolean(id) }),
  );
};

export const useCreateReward = () => {
  const queryClient = useQueryClient();
  return useMutation(
    orpc.reward.create.mutationOptions({
      onSuccess: async () => {
        await invalidateRewardQueries(queryClient, true);
      },
    }),
  );
};

export const useUpdateReward = () => {
  const queryClient = useQueryClient();
  return useMutation(
    orpc.reward.update.mutationOptions({
      onSuccess: async () => {
        await invalidateRewardQueries(queryClient, true);
      },
    }),
  );
};

export const useSetRewardHidden = () => {
  const queryClient = useQueryClient();
  return useMutation(
    orpc.reward.setHidden.mutationOptions({
      onSuccess: async (responseData) => {
        if (!responseData) return;
        await queryClient.invalidateQueries({ queryKey: ["reward", "getById", responseData.id] });
        await queryClient.invalidateQueries({ queryKey: [["reward", "getByTrip"]] });
        await queryClient.invalidateQueries({ queryKey: [["reward", "getByTripAdmin"]] });
      },
    }),
  );
};

export const useDeleteReward = () => {
  const queryClient = useQueryClient();
  return useMutation(
    orpc.reward.delete.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [["reward", "getByTrip"]] });
        await queryClient.invalidateQueries({ queryKey: [["reward", "getByTripAdmin"]] });
      },
    }),
  );
};

export const usePurchaseReward = () => {
  const queryClient = useQueryClient();
  return useMutation(
    orpc.reward.purchase.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [["reward", "getByTrip"]] });
        await queryClient.invalidateQueries({ queryKey: [["reward", "getPurchaseHistory"]] });
        await queryClient.invalidateQueries({ queryKey: [["reward", "getPurchaseHistoryAdmin"]] });
        await invalidateTransactionQueries(queryClient);
      },
    }),
  );
};

export function buildPurchaseHistoryQueryInput(tripId: string, pageParam: number) {
  const offset = typeof pageParam === "number" ? pageParam : 0;
  return {
    tripId,
    pagination: {
      limit: PAGE_SIZE,
      offset,
    },
  };
}

export function getNextPurchaseHistoryPageParam(lastPage: {
  pagination: { hasMore: boolean; offset: number; limit: number };
}) {
  if (!lastPage.pagination.hasMore) {
    return undefined;
  }
  return lastPage.pagination.offset + lastPage.pagination.limit;
}

export const useRewardPurchaseHistory = (tripId: string) => {
  const {
    data,
    isLoading,
    error,
    isRefetching,
    refetch,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteQuery(
    orpc.reward.getPurchaseHistory.infiniteOptions({
      input: (pageParam: number) => buildPurchaseHistoryQueryInput(tripId, pageParam),
      initialPageParam: 0,
      getNextPageParam: getNextPurchaseHistoryPageParam,
      enabled: Boolean(tripId),
    }),
  );

  const purchases = useMemo(
    () => (data?.pages ?? []).flatMap((page) => page.purchases ?? []),
    [data?.pages],
  );

  return {
    data: purchases,
    isLoading,
    error,
    isRefetching,
    refetch,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  };
};

/**
 * Admin-panel purchase history.
 *
 * Backed by `reward.getPurchaseHistoryAdmin` (moderatorProcedure), the only
 * endpoint that returns other groups' redemptions. The user-facing screen must
 * keep using {@link useRewardPurchaseHistory}, which the server scopes to the
 * caller's own group.
 */
export const useAdminRewardPurchaseHistory = (tripId: string) => {
  const {
    data,
    isLoading,
    error,
    isRefetching,
    refetch,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteQuery(
    orpc.reward.getPurchaseHistoryAdmin.infiniteOptions({
      input: (pageParam: number) => buildPurchaseHistoryQueryInput(tripId, pageParam),
      initialPageParam: 0,
      getNextPageParam: getNextPurchaseHistoryPageParam,
      enabled: Boolean(tripId),
    }),
  );

  const purchases = useMemo(
    () => (data?.pages ?? []).flatMap((page) => page.purchases ?? []),
    [data?.pages],
  );

  return {
    data: purchases,
    isLoading,
    error,
    isRefetching,
    refetch,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  };
};

export const useUpdateRewardPurchaseStatus = () => {
  const queryClient = useQueryClient();
  return useMutation(
    orpc.reward.updatePurchaseStatus.mutationOptions({
      onSuccess: async (responseData) => {
        if (!responseData) return;
        await queryClient.invalidateQueries({ queryKey: [["reward", "getPurchaseHistory"]] });
        await queryClient.invalidateQueries({ queryKey: [["reward", "getPurchaseHistoryAdmin"]] });
        await queryClient.invalidateQueries({
          queryKey: ["reward", "getById", responseData.rewardId],
        });
        await queryClient.invalidateQueries({ queryKey: [["reward", "getByTrip"]] });
        await queryClient.invalidateQueries({ queryKey: [["reward", "getByTripAdmin"]] });
        await invalidateTransactionQueries(queryClient);
      },
    }),
  );
};

export const useUpdateMyRewardPurchaseStatus = () => {
  const queryClient = useQueryClient();
  return useMutation(
    orpc.reward.updateMyPurchaseStatus.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [["reward", "getPurchaseHistory"]] });
        await queryClient.invalidateQueries({ queryKey: [["reward", "getPurchaseHistoryAdmin"]] });
        await queryClient.invalidateQueries({ queryKey: [["reward", "getByTrip"]] });
        await invalidateTransactionQueries(queryClient);
      },
    }),
  );
};
