import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { orpc } from '@mirai-app/orpc/client';
import { invalidateRewardQueries, invalidateTransactionQueries } from '@mirai-app/orpc/client/query';

const PAGE_SIZE = 30;

export const useRewards = (tripId: string) => {
  return useQuery(orpc.reward.getByTrip.queryOptions({ input: { tripId }, enabled: Boolean(tripId) }));
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
  } = useInfiniteQuery(orpc.reward.getByTripAdmin.infiniteOptions({
    input: (pageParam: number) => {
      const offset = typeof pageParam === 'number' ? pageParam : 0;
      return {
        tripId: tripId ?? '',
        pagination: {
          limit: PAGE_SIZE,
          offset,
        },
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination.hasMore) {
        return undefined;
      }

      return lastPage.pagination.offset + lastPage.pagination.limit;
    },
    enabled: Boolean(tripId),
  }));

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
  return useQuery(orpc.reward.getById.queryOptions({ input: { id: id ?? "" }, enabled: Boolean(id) }));
};

export const useCreateReward = () => {
  const queryClient = useQueryClient();
  return useMutation(orpc.reward.create.mutationOptions({
    onSuccess: async () => { await invalidateRewardQueries(queryClient, true); },
  }));
};

export const useUpdateReward = () => {
  const queryClient = useQueryClient();
  return useMutation(orpc.reward.update.mutationOptions({
    onSuccess: async () => { await invalidateRewardQueries(queryClient, true); },
  }));
};

export const useSetRewardHidden = () => {
  const queryClient = useQueryClient();
  return useMutation(orpc.reward.setHidden.mutationOptions({
    onSuccess: async (responseData) => {
      await queryClient.invalidateQueries({ queryKey: ['reward', 'getById', responseData.id] });
      await queryClient.invalidateQueries({ queryKey: [['reward', 'getByTrip']] });
      await queryClient.invalidateQueries({ queryKey: [['reward', 'getByTripAdmin']] });
    },
  }));
};

export const useDeleteReward = () => {
  const queryClient = useQueryClient();
  return useMutation(orpc.reward.delete.mutationOptions({
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [['reward', 'getByTrip']] });
      await queryClient.invalidateQueries({ queryKey: [['reward', 'getByTripAdmin']] });
    },
  }));
};

export const usePurchaseReward = () => {
  const queryClient = useQueryClient();
  return useMutation(orpc.reward.purchase.mutationOptions({
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [['reward', 'getByTrip']] });
      await queryClient.invalidateQueries({ queryKey: [['reward', 'getPurchaseHistory']] });
      await invalidateTransactionQueries(queryClient);
    },
  }));
};

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
  } = useInfiniteQuery(orpc.reward.getPurchaseHistory.infiniteOptions({
    input: (pageParam: number) => {
      const offset = typeof pageParam === 'number' ? pageParam : 0;
      return {
        tripId,
        pagination: {
          limit: PAGE_SIZE,
          offset,
        },
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination.hasMore) {
        return undefined;
      }

      return lastPage.pagination.offset + lastPage.pagination.limit;
    },
    enabled: Boolean(tripId),
  }));

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
  return useMutation(orpc.reward.updatePurchaseStatus.mutationOptions({
    onSuccess: async (responseData) => {
      await queryClient.invalidateQueries({ queryKey: [['reward', 'getPurchaseHistory']] });
      await queryClient.invalidateQueries({ queryKey: ['reward', 'getById', responseData.rewardId] });
      await queryClient.invalidateQueries({ queryKey: [['reward', 'getByTrip']] });
      await queryClient.invalidateQueries({ queryKey: [['reward', 'getByTripAdmin']] });
      await invalidateTransactionQueries(queryClient);
    },
  }));
};

export const useUpdateMyRewardPurchaseStatus = () => {
  const queryClient = useQueryClient();
  return useMutation(orpc.reward.updateMyPurchaseStatus.mutationOptions({
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [['reward', 'getPurchaseHistory']] });
      await queryClient.invalidateQueries({ queryKey: [['reward', 'getByTrip']] });
      await invalidateTransactionQueries(queryClient);
    },
  }));
};
