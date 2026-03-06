import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@integral-2025-app/trpc/client';
import { invalidateGroupQueries } from '@integral-2025-app/trpc/client/query';

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

  const coinsMutation = useMutation(trpc.group.addCoins.mutationOptions({
    onSuccess: async () => { await invalidateGroupQueries(queryClient, true); },
  }));

  const addCoins = (groupId: string, amount: number, _reason: string) => {
    if (amount <= 0) {
      throw new Error('Amount must be positive for adding coins');
    }
    return coinsMutation.mutateAsync({
      groupId,
      amount,
      tripId,
    });
  };

  const removeCoins = (groupId: string, amount: number, _reason: string) => {
    if (amount <= 0) {
      throw new Error('Amount must be positive for removing coins');
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
