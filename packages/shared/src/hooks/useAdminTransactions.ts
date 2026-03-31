"use client";

import { useMemo } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useTRPCClient } from "@mirai-app/trpc/client";

const PAGE_SIZE = 50;

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

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export function useAdminTransactions(tripId: string) {
  const trpc = useTRPCClient();

  const {
    data,
    isLoading,
    isRefetching,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["transactions", tripId, "infinite", PAGE_SIZE],
    enabled: Boolean(tripId),
    initialPageParam: 0,
    queryFn: ({ pageParam }) => {
      const offset = typeof pageParam === "number" ? pageParam : 0;
      return trpc.coinTransaction.getAll.query({
        tripId,
        pagination: {
          limit: PAGE_SIZE,
          offset,
        },
      });
    },
    getNextPageParam: (lastPage) => {
      if (!isObject(lastPage) || !isObject(lastPage.pagination)) {
        return undefined;
      }

      if (!lastPage.pagination.hasMore) {
        return undefined;
      }

      if (
        typeof lastPage.pagination.offset !== "number" ||
        typeof lastPage.pagination.limit !== "number"
      ) {
        return undefined;
      }

      return lastPage.pagination.offset + lastPage.pagination.limit;
    },
  });

  const groupsQuery = useQuery({
    queryKey: ["transactions", "groups", tripId],
    enabled: Boolean(tripId),
    queryFn: () => trpc.group.getAllNames.query({ tripId }),
  });

  const transactions = useMemo(() => {
    return (data?.pages ?? []).flatMap((page) => {
      if (!isObject(page) || !Array.isArray(page.transactions)) {
        return [] as TransactionItem[];
      }

      return page.transactions
        .map((transaction) => {
          if (!isObject(transaction) || typeof transaction.id !== "string") {
            return null;
          }

          const group = isObject(transaction.group) ? transaction.group : null;
          const admin = isObject(transaction.admin) ? transaction.admin : null;

          return {
            id: transaction.id,
            amount:
              typeof transaction.amount === "number" ? transaction.amount : 0,
            reason:
              typeof transaction.reason === "string" ? transaction.reason : "",
            createdAt:
              typeof transaction.createdAt === "string"
                ? transaction.createdAt
                : new Date().toISOString(),
            group: {
              id: group && typeof group.id === "string" ? group.id : "",
              name:
                group && typeof group.name === "string"
                  ? group.name
                  : "Unknown group",
            },
            admin: {
              id: admin && typeof admin.id === "string" ? admin.id : "",
              firstName:
                admin && typeof admin.firstName === "string"
                  ? admin.firstName
                  : "",
              lastName:
                admin && typeof admin.lastName === "string"
                  ? admin.lastName
                  : "",
            },
          } as TransactionItem;
        })
        .filter((item): item is TransactionItem => item !== null);
    });
  }, [data?.pages]);

  const groups = useMemo(() => {
    if (!Array.isArray(groupsQuery.data)) {
      return [] as { id: string; name: string }[];
    }

    return groupsQuery.data
      .map((group) => {
        if (
          !isObject(group) ||
          typeof group.id !== "string" ||
          typeof group.name !== "string"
        ) {
          return null;
        }
        return { id: group.id, name: group.name };
      })
      .filter((group): group is { id: string; name: string } => group !== null);
  }, [groupsQuery.data]);

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
