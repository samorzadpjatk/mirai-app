import { useTRPC } from "@integral-2025-app/trpc/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const useRewards = (tripId: string) => {
  const trpc = useTRPC();

  return useQuery({
    ...trpc.reward.getByTrip.queryOptions({ tripId }),
    enabled: Boolean(tripId),
  });
};

export const useAdminRewards = (tripId?: string | null) => {
  const trpc = useTRPC();

  return useQuery({
    ...trpc.reward.getByTripAdmin.queryOptions({ tripId: tripId ?? "" }),
    enabled: Boolean(tripId),
  });
};

export const useReward = (id: string | null) => {
  const trpc = useTRPC();

  return useQuery({
    ...trpc.reward.getById.queryOptions({ id: id ?? "" }),
    enabled: Boolean(id),
  });
};

export const useCreateReward = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.reward.create.mutationOptions({
      onSuccess: async (_data, variables) => {
        await queryClient.invalidateQueries({
          queryKey: trpc.reward.getByTrip.queryKey({ tripId: variables.tripId }),
        });
        await queryClient.invalidateQueries({
          queryKey: trpc.reward.getByTripAdmin.queryKey({ tripId: variables.tripId }),
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
      onSuccess: async (_data, variables) => {
        await queryClient.invalidateQueries({
          queryKey: trpc.reward.getById.queryKey({ id: variables.id }),
        });
        await queryClient.invalidateQueries({ queryKey: [["reward", "getByTrip"]] });
        await queryClient.invalidateQueries({ queryKey: [["reward", "getByTripAdmin"]] });
      },
    })
  );
};

export const useSetRewardHidden = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.reward.setHidden.mutationOptions({
      onSuccess: async (data) => {
        await queryClient.invalidateQueries({
          queryKey: trpc.reward.getById.queryKey({ id: data.id }),
        });
        await queryClient.invalidateQueries({ queryKey: [["reward", "getByTrip"]] });
        await queryClient.invalidateQueries({ queryKey: [["reward", "getByTripAdmin"]] });
      },
    }),
  );
};

export const useDeleteReward = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.reward.delete.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [["reward", "getByTrip"]] });
        await queryClient.invalidateQueries({ queryKey: [["reward", "getByTripAdmin"]] });
      },
    })
  );
};

export const usePurchaseReward = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  
  return useMutation(
    trpc.reward.purchase.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: [["reward", "getByTrip"]]
        });
        await queryClient.invalidateQueries({
          queryKey: [["reward", "getPurchaseHistory"]]
        });
        await queryClient.invalidateQueries({
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

export const useUpdateRewardPurchaseStatus = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.reward.updatePurchaseStatus.mutationOptions({
      onSuccess: async (data) => {
        await queryClient.invalidateQueries({
          queryKey: [["reward", "getPurchaseHistory"]],
        });
        await queryClient.invalidateQueries({
          queryKey: trpc.reward.getById.queryKey({ id: data.rewardId }),
        });
        await queryClient.invalidateQueries({
          queryKey: [["reward", "getByTrip"]],
        });
        await queryClient.invalidateQueries({
          queryKey: [["reward", "getByTripAdmin"]],
        });
        await queryClient.invalidateQueries({
          queryKey: [["group"]],
        });
      },
    }),
  );
};

export const useUpdateMyRewardPurchaseStatus = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.reward.updateMyPurchaseStatus.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: [["reward", "getPurchaseHistory"]],
        });
        await queryClient.invalidateQueries({
          queryKey: [["reward", "getByTrip"]],
        });
        await queryClient.invalidateQueries({
          queryKey: [["group"]],
        });
      },
    }),
  );
};
