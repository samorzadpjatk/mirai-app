import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { orpc } from "@mirai-app/orpc/client";

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

export function buildTransactionQueryInput(tripId: string, pageParam: number) {
  const offset = typeof pageParam === "number" ? pageParam : 0;
  return {
    tripId,
    pagination: {
      limit: PAGE_SIZE,
      offset,
    },
  };
}

export function getNextTransactionPageParam(lastPage: {
  pagination: { hasMore: boolean; offset: number; limit: number };
}) {
  if (!lastPage.pagination.hasMore) {
    return undefined;
  }
  return lastPage.pagination.offset + lastPage.pagination.limit;
}

export function useAdminTransactions(tripId: string) {
  const { data, isLoading, isRefetching, hasNextPage, isFetchingNextPage, fetchNextPage, refetch } =
    useInfiniteQuery(
      orpc.coinTransaction.getAll.infiniteOptions({
        input: (pageParam: number) => buildTransactionQueryInput(tripId, pageParam),
        initialPageParam: 0,
        getNextPageParam: getNextTransactionPageParam,
        enabled: Boolean(tripId),
      }),
    );

  const groupsQuery = useQuery(
    orpc.group.getAllNames.queryOptions({ input: { tripId }, enabled: Boolean(tripId) }),
  );

  // Transform the data to match our interface
  const transactions = (data?.pages ?? []).flatMap((page) =>
    page.transactions.map((transaction) => ({
      id: transaction.id,
      amount: transaction.amount,
      reason: transaction.reason ?? "",
      createdAt:
        typeof transaction.createdAt === "string"
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
    })),
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
