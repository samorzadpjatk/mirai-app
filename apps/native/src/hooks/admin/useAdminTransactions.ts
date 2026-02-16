import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@integral-2025-app/trpc/client';

export interface TransactionItem {
  id: string;
  amount: number;
  reason: string;
  createdAt: string;
  group: {
    id: string;
    name: string;
  };
  admin: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export function useAdminTransactions(tripId: string) {
  const trpc = useTRPC();

  const transactionsQuery = useQuery(
    trpc.coinTransaction.getCoinTransactions.queryOptions({
      tripId,
      limit: 50,
    })
  );

  const groupsQuery = useQuery(
    trpc.group.getAllNames.queryOptions({ tripId })
  );

  // Transform the data to match our interface
  const transactions = (transactionsQuery.data ?? []).map((transaction) => ({
    id: transaction.id,
    amount: transaction.amount,
    reason: transaction.reason ?? '',
    createdAt: typeof transaction.createdAt === 'string' 
      ? transaction.createdAt 
      : transaction.createdAt.toISOString(),
    group: {
      id: transaction.group.id,
      name: transaction.group.name,
    },
    admin: {
      id: transaction.admin.id,
      firstName: transaction.admin.firstName,
      lastName: transaction.admin.lastName,
    },
  }));

  const groups = groupsQuery.data ?? [];

  return {
    transactions,
    groups,
    isLoading: transactionsQuery.isLoading,
    groupsLoading: groupsQuery.isLoading,
    refetch: transactionsQuery.refetch,
  };
}
