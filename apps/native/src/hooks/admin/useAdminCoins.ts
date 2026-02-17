import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@integral-2025-app/trpc/client';

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
  operation: 'add' | 'remove';
}

export function useAdminCoins(tripId: string) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const groupsQuery = trpc.group.getGroupList.queryOptions({ tripId });
  const { data: groups, isLoading: groupsLoading } = useQuery(groupsQuery);

  const coinTransactionsQuery = trpc.coinTransaction.getCoinTransactions.queryOptions({ tripId });

  const addCoinsMutation = useMutation(
    trpc.coin.addCoins.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: groupsQuery.queryKey });
        void queryClient.invalidateQueries({ queryKey: coinTransactionsQuery.queryKey });
      },
    }),
  );

  const removeCoinsMutation = useMutation(
    trpc.coin.removeCoins.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: groupsQuery.queryKey });
        void queryClient.invalidateQueries({ queryKey: coinTransactionsQuery.queryKey });
      },
    }),
  );

  const addCoins = (groupId: string, amount: number, reason: string) => {
    return addCoinsMutation.mutateAsync({
      groupId,
      amount,
      reason,
      tripId,
    });
  };

  const removeCoins = (groupId: string, amount: number, reason: string) => {
    return removeCoinsMutation.mutateAsync({
      groupId,
      amount,
      reason,
      tripId,
    });
  };

  return {
    groups: groups ?? [],
    groupsLoading,
    addCoins,
    removeCoins,
    isAddingCoins: addCoinsMutation.isPending,
    isRemovingCoins: removeCoinsMutation.isPending,
  };
}
