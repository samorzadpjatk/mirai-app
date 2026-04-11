import { useState, useMemo } from "react";
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
import { useQuery } from "urql";
import { colors, spacing, typography } from "../../../../styles";
import {
  GetCoinTransactionsDocument,
  type GetCoinTransactionsQuery,
} from "@mirai-app/graphql-client";
import { AdminHeader } from "~/components/admin/AdminHeader";
import { TransactionsFilters } from "~/components/admin/transactions/TransactionsFilters";
import TransactionCard from "~/components/admin/transactions/TransactionCard";

type TransactionItem = NonNullable<
  GetCoinTransactionsQuery["coinTransactions"]
>["transactions"][number];

// Custom hook for admin transactions
const useAdminTransactions = (tripId: string) => {
  const [
    { data: transactionsData, fetching: isLoading, error },
    refetchTransactions,
  ] = useQuery({
    query: GetCoinTransactionsDocument,
    variables: {
      tripId,
      limit: 50,
      offset: 0,
    },
    pause: !tripId,
  });

  const data = transactionsData as GetCoinTransactionsQuery | undefined;

  const transactionsRaw = useMemo(() => {
    return data?.coinTransactions?.transactions ?? [];
  }, [data]);

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

  return {
    transactions,
    groups,
    isLoading,
    isRefetching: isLoading,
    refetchTransactions,
    error,
  };
};

export default function AdminTransactionsScreen() {
  const insets = useSafeAreaInsets();
  const { tripId } = useLocalSearchParams<{ tripId?: string }>();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState<string>("all");

  // Use the custom hook for all transaction operations
  const { transactions, groups, isLoading, isRefetching, refetchTransactions } =
    useAdminTransactions(tripId ?? "");

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

      {isLoading ? (
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
                void refetchTransactions({ requestPolicy: "network-only" });
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

/*
## Summary of Migration from TanStack Query to urql

### Changes Made:

1. **Removed manual GraphQL client setup:**
   - Removed: `import { GraphQLClient } from "graphql-request"`
   - Removed: `import * as SecureStore from "expo-secure-store"`
   - Removed: `createGraphQLClient` function and `client` state management
   - Rationale: urql client is provided via context by the app's root provider

2. **Updated imports:**
   - Removed: `import { useQuery } from "@tanstack/react-query"`
   - Removed: `import { useGetCoinTransactionsQuery } from "@mirai-app/graphql-client"`
   - Added: `import { useQuery } from "urql"`
   - Added: `import { GetCoinTransactionsDocument } from "@mirai-app/graphql-client"`

3. **Extracted query logic into custom hook:**
   - Created: `useAdminTransactions(tripId: string)` custom hook
   - Moved query logic from inline `useQuery` to the custom hook
   - Follows pattern established in other admin screens (coins, groups, users)

4. **Updated query pattern:**
   - Changed from TanStack Query's object-based options to urql's tuple return
   - From: `const { data, isLoading, isFetching, refetch } = useQuery({ queryKey, queryFn, enabled })`
   - To: `const [{ data, fetching }, refetch] = useQuery({ query, variables, pause })`
   - Changed: `queryKey` → `query` property with Document constant
   - Changed: `queryFn` → removed (urql handles execution)
   - Changed: `enabled` → `pause` (inverse logic - `pause: !condition`)

5. **Updated loading states:**
   - Changed: `isLoading` → `fetching` (urql's loading state property)
   - Changed: `isFetching` → `fetching` (urql uses single property for both)
   - Removed conditional check for `!client` (urql handles client internally)

6. **Updated refetch behavior:**
   - Changed: `refetch()` → `refetch({ requestPolicy: "network-only" })`
   - urql requires explicit request policy for network-only refetch

7. **Type handling:**
   - Updated to use `GetCoinTransactionsDocument` directly from graphql-types
   - Maintained same TransactionItem type and data transformation logic

### Key Differences from TanStack Query:

| TanStack Query | urql |
|----------------|------|
| `useQuery({ queryKey, queryFn, enabled })` | `useQuery({ query, variables, pause })` |
| Returns object: `{ data, isLoading, isFetching, refetch }` | Returns tuple: `[{ data, fetching }, refetch]` |
| `isLoading` / `isFetching` separate | Single `fetching` property |
| `enabled` boolean | `pause` boolean (inverted logic) |
| `refetch()` | `refetch({ requestPolicy: "network-only" })` |
| Manual client management | Client from React context |

### Files Referenced for Pattern:
- `apps/native/src/app/(tabs)/admin/coins/index.tsx` - Document import pattern
- `apps/native/src/app/(tabs)/admin/groups/index.tsx` - Custom hook pattern
- `apps/native/src/app/(tabs)/admin/users/index.tsx` - urql useQuery pattern
*/
