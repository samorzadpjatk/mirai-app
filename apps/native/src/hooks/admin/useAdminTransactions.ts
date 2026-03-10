import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useTRPC, useTRPCClient } from '@mirai-app/trpc/client';

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

const PAGE_SIZE = 50;

export function useAdminTransactions(tripId: string) {
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();

  const {
    data,
    isLoading,
    isRefetching,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: [
      ...trpc.coinTransaction.getAll.queryOptions({ tripId }).queryKey,
      'infinite',
      PAGE_SIZE,
    ],
    enabled: Boolean(tripId),
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const offset = typeof pageParam === 'number' ? pageParam : 0;
      return trpcClient.coinTransaction.getAll.query({
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

  const groupsQuery = useQuery(
    trpc.group.getAllNames.queryOptions({ tripId }, { enabled: Boolean(tripId) })
  );

  // Transform the data to match our interface
  const transactions = (data?.pages ?? []).flatMap((page) =>
    page.transactions.map((transaction) => ({
      id: transaction.id,
      amount: transaction.amount,
      reason: transaction.reason ?? '',
      createdAt:
        typeof transaction.createdAt === 'string'
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
    }))
  );

  const groups = groupsQuery.data ?? [];

  return {
    transactions,
    groups,
    isLoading,
    isRefetching,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    groupsLoading: groupsQuery.isLoading,
    refetch,
  };
}
