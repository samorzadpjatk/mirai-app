import { useMemo } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import {
  useGetRewardQuery,
  useGetRewardsByTripQuery,
  useGetRewardsByTripAdminQuery,
  useCreateRewardMutation,
  useUpdateRewardMutation,
  useDeleteRewardMutation,
  usePurchaseRewardMutation,
  useSetRewardHiddenMutation,
  useGetPurchaseHistoryQuery,
  useUpdatePurchaseStatusMutation,
  useUpdateMyPurchaseStatusMutation,
} from "@mirai-app/graphql-types";
import { graphqlClient } from "~/lib/graphql-client";

const PAGE_SIZE = 30;

export const useRewards = (tripId: string) => {
  return useGetRewardsByTripQuery(
    graphqlClient,
    { tripId },
    { enabled: Boolean(tripId) },
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
  } = useInfiniteQuery({
    queryKey: ["GetRewardsByTripAdmin", tripId ?? "", "infinite", PAGE_SIZE],
    enabled: Boolean(tripId),
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const offset = typeof pageParam === "number" ? pageParam : 0;
      const result = await graphqlClient.request<{
        rewardsByTripAdmin: {
          rewards: Array<{
            id: string;
            name: string;
            description: string | null;
            pointsCost: number;
            quantity: number | null;
            isHidden: boolean;
            imageUrl: string | null;
            tripId: string;
          }>;
          pagination: {
            total: number;
            hasMore: boolean;
            limit: number;
            offset: number;
          };
        };
      }>(
        `
        query GetRewardsByTripAdmin($tripId: ID!, $pagination: PaginationInput) {
          rewardsByTripAdmin(tripId: $tripId, pagination: $pagination) {
            rewards {
              id
              name
              description
              pointsCost
              quantity
              isHidden
              imageUrl
              tripId
            }
            pagination {
              total
              hasMore
              limit
              offset
            }
          }
        }
        `,
        {
          tripId: tripId ?? "",
          pagination: {
            limit: PAGE_SIZE,
            offset,
          },
        },
      );
      return result.rewardsByTripAdmin;
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
  return useGetRewardQuery(
    graphqlClient,
    { id: id ?? "" },
    { enabled: Boolean(id) },
  );
};

export const useCreateReward = () => {
  const queryClient = useQueryClient();
  return useCreateRewardMutation(graphqlClient, {
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [["GetRewardsByTrip"]],
      });
      await queryClient.invalidateQueries({
        queryKey: [["GetRewardsByTripAdmin"]],
      });
    },
  });
};

export const useUpdateReward = () => {
  const queryClient = useQueryClient();
  return useUpdateRewardMutation(graphqlClient, {
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [["GetRewardsByTrip"]],
      });
      await queryClient.invalidateQueries({
        queryKey: [["GetRewardsByTripAdmin"]],
      });
    },
  });
};

export const useSetRewardHidden = () => {
  const queryClient = useQueryClient();
  return useSetRewardHiddenMutation(graphqlClient, {
    onSuccess: async (responseData) => {
      await queryClient.invalidateQueries({
        queryKey: ["GetReward", responseData.id],
      });
      await queryClient.invalidateQueries({
        queryKey: [["GetRewardsByTrip"]],
      });
      await queryClient.invalidateQueries({
        queryKey: [["GetRewardsByTripAdmin"]],
      });
    },
  });
};

export const useDeleteReward = () => {
  const queryClient = useQueryClient();
  return useDeleteRewardMutation(graphqlClient, {
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [["GetRewardsByTrip"]],
      });
      await queryClient.invalidateQueries({
        queryKey: [["GetRewardsByTripAdmin"]],
      });
    },
  });
};

export const usePurchaseReward = () => {
  const queryClient = useQueryClient();
  return usePurchaseRewardMutation(graphqlClient, {
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [["GetRewardsByTrip"]],
      });
      await queryClient.invalidateQueries({
        queryKey: [["GetPurchaseHistory"]],
      });
    },
  });
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
  } = useInfiniteQuery({
    queryKey: ["GetPurchaseHistory", tripId, "infinite", PAGE_SIZE],
    enabled: Boolean(tripId),
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const offset = typeof pageParam === "number" ? pageParam : 0;
      return graphqlClient.request<{
        purchaseHistory: {
          purchases: Array<{
            id: string;
            rewardId: string;
            userId: string;
            pointsSpent: number;
            status: string;
            createdAt: string;
          }>;
          pagination: {
            total: number;
            hasMore: boolean;
            limit: number;
            offset: number;
          };
        };
      }>(
        `
        query GetPurchaseHistory($tripId: ID!, $pagination: PaginationInput) {
          purchaseHistory(tripId: $tripId, pagination: $pagination) {
            purchases {
              id
              rewardId
              userId
              pointsSpent
              status
              createdAt
            }
            pagination {
              total
              hasMore
              limit
              offset
            }
          }
        }
        `,
        {
          tripId,
          pagination: {
            limit: PAGE_SIZE,
            offset,
          },
        },
      );
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage.purchaseHistory?.pagination?.hasMore) {
        return undefined;
      }
      return (
        lastPage.purchaseHistory.pagination.offset +
        lastPage.purchaseHistory.pagination.limit
      );
    },
  });

  const purchases = useMemo(
    () =>
      (data?.pages ?? []).flatMap(
        (page) => page.purchaseHistory?.purchases ?? [],
      ),
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
  return useUpdatePurchaseStatusMutation(graphqlClient, {
    onSuccess: async (responseData) => {
      await queryClient.invalidateQueries({
        queryKey: [["GetPurchaseHistory"]],
      });
      await queryClient.invalidateQueries({
        queryKey: ["GetReward", responseData.rewardId],
      });
      await queryClient.invalidateQueries({
        queryKey: [["GetRewardsByTrip"]],
      });
      await queryClient.invalidateQueries({
        queryKey: [["GetRewardsByTripAdmin"]],
      });
    },
  });
};

export const useUpdateMyRewardPurchaseStatus = () => {
  const queryClient = useQueryClient();
  return useUpdateMyPurchaseStatusMutation(graphqlClient, {
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [["GetPurchaseHistory"]],
      });
      await queryClient.invalidateQueries({
        queryKey: [["GetRewardsByTrip"]],
      });
    },
  });
};
