import { orpc } from "@mirai-app/orpc/client";
import { invalidateGroupQueries } from "@mirai-app/orpc/client/query";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface Group {
  id: string;
  name: string;
  coins: number;
  organizer: { id: string; firstName: string | null; lastName: string | null } | null;
  _count: { participants: number };
}

export interface CoinOperation {
  groupId: string;
  amount: number;
  reason: string;
  operation: "add" | "remove";
}

export function useAdminCoins(tripId: string) {
  const queryClient = useQueryClient();

  const groupsQuery = orpc.group.getGroupList.queryOptions({ input: { tripId } });
  const { data: groups, isLoading: groupsLoading } = useQuery(groupsQuery);

  const coinsMutation = useMutation(
    orpc.group.addCoins.mutationOptions({
      onSuccess: async () => {
        await invalidateGroupQueries(queryClient, true);
      },
    }),
  );

  const addCoins = (groupId: string, amount: number, _reason: string) => {
    if (amount <= 0) {
      throw new Error("Amount must be positive for adding coins");
    }
    return coinsMutation.mutateAsync({
      groupId,
      amount,
      tripId,
    });
  };

  const removeCoins = (groupId: string, amount: number, _reason: string) => {
    if (amount <= 0) {
      throw new Error("Amount must be positive for removing coins");
    }
    return coinsMutation.mutateAsync({
      groupId,
      amount: -amount, // Convert to negative for removal
      tripId,
    });
  };

  return {
    groups: groups ?? [],
    groupsLoading,
    addCoins,
    removeCoins,
    isAddingCoins: coinsMutation.isPending,
    isRemovingCoins: coinsMutation.isPending,
  };
}
