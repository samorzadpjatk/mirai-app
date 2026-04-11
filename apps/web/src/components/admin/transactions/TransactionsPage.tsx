"use client";

import { useMemo, useState } from "react";
import { Button } from "../../ui/Button";
import { LoadingSpinner } from "../../ui/LoadingSpinner";
import { ErrorMessage } from "../../ui/ErrorMessage";
import { useTrip } from "../../../contexts/TripContext";
import {
  useGetCoinTransactionsQuery,
  type CoinTransaction,
} from "@mirai-app/graphql-client";
import { graphqlClient } from "../../../lib/graphql-client";
import { TransactionsFilters } from "./TransactionsFilters";
import { TransactionCard } from "./TransactionCard";

export function TransactionsPage() {
  const { selectedTrip, isLoading: tripsLoading } = useTrip();
  const selectedTripId = selectedTrip?.id ?? "";
  const [userFilter, setUserFilter] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("all");
  const [transactionType, setTransactionType] = useState<
    "all" | "credit" | "debit"
  >("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const {
    data: transactionsData,
    isLoading,
    isFetching,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
  } = useGetCoinTransactionsQuery(
    graphqlClient,
    {
      tripId: selectedTripId,
      pagination: { limit: 50, offset: 0 },
    },
    {
      enabled: Boolean(selectedTripId),
    },
  );

  const transactions = useMemo(
    () => transactionsData?.coinTransactions?.transactions ?? [],
    [transactionsData],
  );

  const filteredTransactions = useMemo<CoinTransaction[]>(() => {
    let filtered = transactions;

    if (selectedGroupId !== "all") {
      filtered = filtered.filter(
        (transaction) => transaction.group?.id === selectedGroupId,
      );
    }

    if (transactionType === "credit") {
      filtered = filtered.filter((transaction) => transaction.amount > 0);
    }

    if (transactionType === "debit") {
      filtered = filtered.filter((transaction) => transaction.amount < 0);
    }

    if (dateFrom) {
      const fromTime = new Date(`${dateFrom}T00:00:00`).getTime();
      filtered = filtered.filter((transaction) => {
        const timestamp = new Date(transaction.createdAt).getTime();
        return Number.isFinite(timestamp) && timestamp >= fromTime;
      });
    }

    if (dateTo) {
      const toTime = new Date(`${dateTo}T23:59:59`).getTime();
      filtered = filtered.filter((transaction) => {
        const timestamp = new Date(transaction.createdAt).getTime();
        return Number.isFinite(timestamp) && timestamp <= toTime;
      });
    }

    const normalized = userFilter.trim().toLowerCase();
    if (!normalized) {
      return filtered;
    }

    return filtered.filter((transaction) => {
      const adminName = (transaction.admin?.fullName ?? "").toLowerCase();
      return adminName.includes(normalized);
    });
  }, [
    transactions,
    selectedGroupId,
    userFilter,
    transactionType,
    dateFrom,
    dateTo,
  ]);

  const dateRange = useMemo(() => {
    if (filteredTransactions.length === 0) {
      return null;
    }

    const dates = filteredTransactions
      .map((transaction) => new Date(transaction.createdAt).getTime())
      .filter((value) => Number.isFinite(value));

    if (dates.length === 0) {
      return null;
    }

    return {
      from: new Date(Math.min(...dates)).toLocaleDateString(),
      to: new Date(Math.max(...dates)).toLocaleDateString(),
    };
  }, [filteredTransactions]);

  // Extract groups from transactions for filter dropdown
  const groups = useMemo(() => {
    const groupMap = new Map<string, { id: string; name: string }>();
    transactions.forEach((t) => {
      if (t.group && !groupMap.has(t.group.id)) {
        groupMap.set(t.group.id, t.group);
      }
    });
    return Array.from(groupMap.values());
  }, [transactions]);

  if (tripsLoading) {
    return <LoadingSpinner label="Loading trips..." />;
  }

  return (
    <section className="space-y-5">
      <header>
        <h2 className="text-2xl font-semibold text-text-primary">
          Transactions
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          View and filter coin transactions.
        </p>
      </header>

      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          disabled={!selectedTripId || isFetching}
          onClick={() => {
            void refetch();
          }}
        >
          {isFetching ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {!selectedTripId ? (
        <ErrorMessage message="Select a trip from the navbar to view transactions." />
      ) : null}

      {selectedTripId ? (
        <TransactionsFilters
          userFilter={userFilter}
          onUserFilterChange={setUserFilter}
          selectedGroupId={selectedGroupId}
          onGroupChange={setSelectedGroupId}
          transactionType={transactionType}
          onTransactionTypeChange={setTransactionType}
          dateFrom={dateFrom}
          onDateFromChange={setDateFrom}
          dateTo={dateTo}
          onDateToChange={setDateTo}
          groups={groups}
        />
      ) : null}

      {selectedTripId && isLoading ? (
        <LoadingSpinner label="Loading transactions..." />
      ) : null}

      {selectedTripId && !isLoading && filteredTransactions.length === 0 ? (
        <ErrorMessage message="No transactions found for current filters." />
      ) : null}

      {selectedTripId && filteredTransactions.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filteredTransactions.map((transaction) => (
            <TransactionCard key={transaction.id} transaction={transaction} />
          ))}
        </div>
      ) : null}

      {selectedTripId && dateRange ? (
        <p className="text-sm text-text-muted">
          Showing {filteredTransactions.length} transactions, from{" "}
          {dateRange.from} to {dateRange.to}.
        </p>
      ) : null}

      {selectedTripId && hasNextPage ? (
        <div>
          <Button
            variant="secondary"
            disabled={isFetchingNextPage}
            onClick={() => void fetchNextPage()}
          >
            {isFetchingNextPage ? "Loading more..." : "Load more"}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
