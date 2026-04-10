import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GraphQLClient } from "graphql-request";
import * as SecureStore from "expo-secure-store";
import { useQuery } from "@tanstack/react-query";
import { colors, spacing, typography } from "../../../../styles";
import {
  useGetCoinTransactionsQuery,
  type GetCoinTransactionsQuery,
} from "@mirai-app/graphql-types";
import { AdminHeader } from "~/components/admin/AdminHeader";
import { TransactionsFilters } from "~/components/admin/transactions/TransactionsFilters";
import TransactionCard from "~/components/admin/transactions/TransactionCard";

// GraphQL Client setup with SecureStore
const createGraphQLClient = async (): Promise<GraphQLClient> => {
  const token = await SecureStore.getItemAsync("sb-access-token");
  return new GraphQLClient(
    process.env.EXPO_PUBLIC_GRAPHQL_URL || "http://localhost:4000/graphql",
    {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    },
  );
};

type TransactionItem = NonNullable<
  GetCoinTransactionsQuery["coinTransactions"]
>[number];

export default function AdminTransactionsScreen() {
  const insets = useSafeAreaInsets();
  const { tripId } = useLocalSearchParams<{ tripId?: string }>();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState<string>("all");

  const [client, setClient] = useState<GraphQLClient | null>(null);

  useMemo(() => {
    createGraphQLClient().then(setClient);
  }, []);

  // Query for coin transactions
  const {
    data: transactionsData,
    isLoading,
    isFetching: isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["GetCoinTransactions", { tripId }],
    enabled: Boolean(tripId) && Boolean(client),
    queryFn: async () => {
      if (!client) throw new Error("GraphQL client not initialized");
      return useGetCoinTransactionsQuery.fetcher(client, {
        tripId: tripId ?? "",
        pagination: { limit: 50, offset: 0 },
      })();
    },
  });

  const transactionsRaw =
    (transactionsData as GetCoinTransactionsQuery | undefined)
      ?.coinTransactions ?? [];

  // Transform transactions to match expected format
  const transactions = useMemo(() => {
    return transactionsRaw.map(
      (
        tx,
      ): TransactionItem & { group: { id: string; name: string | null } } => ({
        ...tx,
        group: {
          id: tx.group?.id ?? "",
          name: tx.group?.name ?? null,
        },
      }),
    );
  }, [transactionsRaw]);

  // Query for groups (derived from transactions)
  const groups = useMemo(() => {
    const groupMap = new Map<string, { id: string; name: string | null }>();
    transactions.forEach((tx) => {
      if (tx.group?.id && !groupMap.has(tx.group.id)) {
        groupMap.set(tx.group.id, tx.group);
      }
    });
    return Array.from(groupMap.values());
  }, [transactions]);

  const groupsLoading = isLoading;

  const handleLoadMore = () => {
    // Pagination not implemented in this version
  };

  const hasNextPage = false;
  const isFetchingNextPage = false;

  // Memoized filtered transactions
  const filteredTransactions = useMemo<typeof transactions>(() => {
    let filtered = transactions;

    // Filter by group
    if (selectedGroupId !== "all") {
      filtered = filtered.filter(
        (transaction) => transaction.group?.id === selectedGroupId,
      );
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((transaction) => {
        const groupName = transaction.group?.name?.toLowerCase() ?? "";
        const adminName = [
          transaction.admin?.firstName,
          transaction.admin?.lastName,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        const reasonText = transaction.reason?.toLowerCase() ?? "";

        return (
          groupName.includes(term) ||
          adminName.includes(term) ||
          reasonText.includes(term)
        );
      });
    }

    return filtered;
  }, [transactions, selectedGroupId, searchTerm]);

  const groupOptions = useMemo(() => {
    return groups.map((group) => ({
      id: group.id,
      name: group.name ?? "Unknown Group",
    }));
  }, [groups]);

  if (!tripId) {
    return (
      <View style={[styles.container, { paddingTop: spacing.xl }]}>
        <StatusBar style="light" />
        <View style={styles.header}>
          <Text style={styles.title}>Error</Text>
          <Text style={styles.subtitle}>Trip ID is required</Text>
        </View>
      </View>
    );
  }

  const renderTransaction = ({
    item,
  }: {
    item: (typeof transactions)[number];
  }) => <TransactionCard transaction={item} />;

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="cash-outline" size={48} color={colors.textSecondary} />
      <Text style={styles.emptyText}>
        {searchTerm || selectedGroupId !== "all"
          ? "No transactions found"
          : "No transactions available"}
      </Text>
    </View>
  );

  return (
    <View
      style={[
        styles.container,
        { paddingTop: spacing.xl, paddingBottom: insets.bottom },
      ]}
    >
      <StatusBar style="light" />

      <AdminHeader
        title="Transactions"
        subtitle="View coin transaction history"
      />

      <TransactionsFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedGroupId={selectedGroupId}
        onGroupChange={setSelectedGroupId}
        groups={groupOptions}
      />

      {isLoading || groupsLoading || !client ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading transactions...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredTransactions}
          renderItem={renderTransaction}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.transactionsList}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.35}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching && !isFetchingNextPage}
              onRefresh={() => {
                void refetch();
              }}
              tintColor={colors.primary}
            />
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={styles.listFooter}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.loadingText}>
                  Loading more transactions...
                </Text>
              </View>
            ) : null
          }
          ListEmptyComponent={renderEmptyState}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  header: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  title: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.base,
    color: colors.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.base,
    color: colors.textSecondary,
  },
  transactionsList: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  listFooter: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  emptyContainer: {
    alignItems: "center" as const,
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    fontSize: typography.base,
    color: colors.textSecondary,
    textAlign: "center" as const,
  },
});
