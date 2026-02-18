import { useTRPC } from "@integral-2025-app/trpc/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const useRewards = (tripId: string) => {
  const trpc = useTRPC();
  
  return useQuery(
    trpc.reward.getByTrip.queryOptions({ tripId })
  );
};

export const useReward = (id: string) => {
  const trpc = useTRPC();
  
  return useQuery(
    trpc.reward.getById.queryOptions({ id })
  );
};

export const useCreateReward = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  
  return useMutation(
    trpc.reward.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [["reward", "getByTrip"]]
        });
      },
    })
  );
};

export const useUpdateReward = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  
  return useMutation(
    trpc.reward.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [["reward", "getByTrip"]]
        });
        queryClient.invalidateQueries({
          queryKey: [["reward", "getById"]]
        });
      },
    })
  );
};

export const useDeleteReward = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  
  return useMutation(
    trpc.reward.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [["reward", "getByTrip"]]
        });
      },
    })
  );
};

export const usePurchaseReward = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  
  return useMutation(
    trpc.reward.purchase.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [["reward", "getByTrip"]]
        });
        queryClient.invalidateQueries({
          queryKey: [["reward", "getPurchaseHistory"]]
        });
        queryClient.invalidateQueries({
          queryKey: [["group"]]
        });
      },
    })
  );
};

export const useRewardPurchaseHistory = (tripId: string) => {
  const trpc = useTRPC();
  
  return useQuery(
    trpc.reward.getPurchaseHistory.queryOptions({ tripId })
  );
};
