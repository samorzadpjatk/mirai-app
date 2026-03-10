import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useTRPC, useTRPCClient } from '@mirai-app/trpc/client';
import { invalidateRewardQueries, invalidateTransactionQueries } from '@mirai-app/trpc/client/query';

const PAGE_SIZE = 30;

export const useRewards = (tripId: string) => {
  const trpc = useTRPC();
  return useQuery(trpc.reward.getByTrip.queryOptions({ tripId }, { enabled: Boolean(tripId) }));
};

export const useAdminRewards = (tripId?: string | null) => {
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();

  const {
    data,
    isLoading,
    error,
    isRefetching,
    refetch,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: [
      ...trpc.reward.getByTripAdmin.queryOptions({ tripId: tripId ?? '' }).queryKey,
      'infinite',
      PAGE_SIZE,
    ],
    enabled: Boolean(tripId),
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const offset = typeof pageParam === 'number' ? pageParam : 0;
      return trpcClient.reward.getByTripAdmin.query({
        tripId: tripId ?? '',
        pagination: {
          limit: PAGE_SIZE,
          offset,
        },
      });
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination.hasMore) {
        return undefined;
      }

      return lastPage.pagination.offset + lastPage.pagination.limit;
    },
  });

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
  const trpc = useTRPC();
  return useQuery(trpc.reward.getById.queryOptions({ id: id ?? "" }, { enabled: Boolean(id) }));
};

export const useCreateReward = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  return useMutation(trpc.reward.create.mutationOptions({
    onSuccess: async () => { await invalidateRewardQueries(queryClient, true); },
  }));
};

export const useUpdateReward = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  return useMutation(trpc.reward.update.mutationOptions({
    onSuccess: async () => { await invalidateRewardQueries(queryClient, true); },
  }));
};

export const useSetRewardHidden = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  return useMutation(trpc.reward.setHidden.mutationOptions({
    onSuccess: async (responseData) => {
      await queryClient.invalidateQueries({ queryKey: ['reward', 'getById', responseData.id] });
      await queryClient.invalidateQueries({ queryKey: [['reward', 'getByTrip']] });
      await queryClient.invalidateQueries({ queryKey: [['reward', 'getByTripAdmin']] });
    },
  }));
};

export const useDeleteReward = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  return useMutation(trpc.reward.delete.mutationOptions({
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [['reward', 'getByTrip']] });
      await queryClient.invalidateQueries({ queryKey: [['reward', 'getByTripAdmin']] });
    },
  }));
};

export const usePurchaseReward = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  return useMutation(trpc.reward.purchase.mutationOptions({
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [['reward', 'getByTrip']] });
      await queryClient.invalidateQueries({ queryKey: [['reward', 'getPurchaseHistory']] });
      await invalidateTransactionQueries(queryClient);
    },
  }));
};

export const useRewardPurchaseHistory = (tripId: string) => {
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();

  const {
    data,
    isLoading,
    error,
    isRefetching,
    refetch,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: [
      ...trpc.reward.getPurchaseHistory.queryOptions({ tripId }).queryKey,
      'infinite',
      PAGE_SIZE,
    ],
    enabled: Boolean(tripId),
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const offset = typeof pageParam === 'number' ? pageParam : 0;
      return trpcClient.reward.getPurchaseHistory.query({
        tripId,
        pagination: {
          limit: PAGE_SIZE,
          offset,
        },
      });
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination.hasMore) {
        return undefined;
      }

      return lastPage.pagination.offset + lastPage.pagination.limit;
    },
  });

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
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  return useMutation(trpc.reward.updatePurchaseStatus.mutationOptions({
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
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  return useMutation(trpc.reward.updateMyPurchaseStatus.mutationOptions({
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [['reward', 'getPurchaseHistory']] });
      await queryClient.invalidateQueries({ queryKey: [['reward', 'getByTrip']] });
      await invalidateTransactionQueries(queryClient);
    },
  }));
};
