import React, { useMemo, useState } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { colors, spacing, typography } from "../../../../styles";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAdminTransactions } from "~/hooks/admin/useAdminTransactions";
import { AdminHeader } from "~/components/admin/AdminHeader";
import { TransactionsFilters } from "~/components/admin/transactions/TransactionsFilters";
import TransactionCard from "~/components/admin/transactions/TransactionCard";
import type { TransactionItem } from "~/hooks/admin/useAdminTransactions";

export default function AdminTransactionsScreen() {
  const insets = useSafeAreaInsets();
  const { tripId } = useLocalSearchParams<{ tripId?: string }>();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState<string>("all");

  // Use the custom hook for all transaction operations
  const {
    transactions,
    groups,
    isLoading,
    isRefetching,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
    groupsLoading,
  } = useAdminTransactions(tripId ?? "");

  const handleLoadMore = () => {
    if (!hasNextPage || isFetchingNextPage || isLoading) {
      return;
    }

    void fetchNextPage();
  };

  // Memoized filtered transactions
  const filteredTransactions = useMemo<TransactionItem[]>(() => {
    let filtered = transactions;

    // Filter by group
    if (selectedGroupId !== "all") {
      filtered = filtered.filter((transaction) => transaction.group.id === selectedGroupId);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((transaction) => {
        const groupName = transaction.group.name?.toLowerCase() ?? "";
        const adminName = [transaction.admin.firstName, transaction.admin.lastName]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        const reasonText = transaction.reason.toLowerCase();

        return groupName.includes(term) || adminName.includes(term) || reasonText.includes(term);
      });
    }

    return filtered;
  }, [transactions, selectedGroupId, searchTerm]);

  const groupOptions = useMemo(() => {
    return groups.map((group) => ({
      id: group.id,
      name: group.name,
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

  const renderTransaction = ({ item }: { item: TransactionItem }) => (
    <TransactionCard transaction={item} />
  );

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
    <View style={[styles.container, { paddingTop: spacing.xl, paddingBottom: insets.bottom }]}>
      <StatusBar style="light" />

      <AdminHeader title="Transactions" subtitle="View coin transaction history" />

      <TransactionsFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedGroupId={selectedGroupId}
        onGroupChange={setSelectedGroupId}
        groups={groupOptions}
      />

      {isLoading || groupsLoading ? (
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
                <Text style={styles.loadingText}>Loading more transactions...</Text>
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
