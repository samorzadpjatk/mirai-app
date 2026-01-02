import React, { useState } from "react";
import { YStack, H2, Spinner, Text, ScrollView, Card, XStack, Badge, Input, Button } from "tamagui";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@integral-2025-app/trpc/client";
import { RefreshControl } from "react-native";
import { Search } from "@tamagui/lucide-icons";
import { formatRelativeTime } from "~/utils/format";

interface Transaction {
  id: string;
  amount: number;
  reason: string | null;
  createdAt: Date;
  admin: {
    id: string;
    name: string | null;
  };
  group: {
    id: string;
    name: string;
  };
}

export default function TransactionsScreen() {
  const trpc = useTRPC();
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: transactions, isLoading, isError, error, refetch, isFetching } = useQuery<Transaction[]>(
    trpc.coinTransaction.getAll.queryOptions()
  );

  const { data: stats, refetch: refetchStats } = useQuery(
    trpc.coinTransaction.getStatistics.queryOptions()
  );

  if (isLoading) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" padding="$4">
        <Spinner size="large" color="$blue10" />
        <Text marginTop="$4" color="$gray11">
          Loading transactions...
        </Text>
      </YStack>
    );
  }

  if (isError) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" padding="$4">
        <Text color="$red10" fontSize="$6" fontWeight="bold">
          Error loading transactions
        </Text>
        <Text color="$gray11" marginTop="$2" textAlign="center">
          {error?.message || "Something went wrong"}
        </Text>
        <Button marginTop="$4" onPress={() => void refetch()}>
          Try Again
        </Button>
      </YStack>
    );
  }

  const filteredTransactions = transactions?.filter((t) => {
    const search = searchTerm.toLowerCase();
    return (
      t.group.name.toLowerCase().includes(search) ||
      t.admin.name?.toLowerCase().includes(search) ||
      t.reason?.toLowerCase().includes(search)
    );
  });

  return (
    <YStack flex={1} backgroundColor="$background">
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={() => {
              void refetch();
              void refetchStats();
            }}
          />
        }
      >
        <YStack padding="$4" gap="$4">
          <H2 color="$gray12">
            Transaction History
          </H2>

          {/* Statistics Card */}
          {stats && (
            <Card bordered padding="$4">
              <Text fontSize="$5" fontWeight="bold" marginBottom="$3">
                Overview
              </Text>
              <YStack gap="$2">
                <XStack justifyContent="space-between">
                  <Text color="$gray11">Total Transactions:</Text>
                  <Text fontWeight="bold">{stats.transactionCount}</Text>
                </XStack>
                <XStack justifyContent="space-between">
                  <Text color="$gray11">Coins Added:</Text>
                  <Text fontWeight="bold" color="$green10">+{stats.addedCoins}</Text>
                </XStack>
                <XStack justifyContent="space-between">
                  <Text color="$gray11">Coins Removed:</Text>
                  <Text fontWeight="bold" color="$red10">{stats.removedCoins}</Text>
                </XStack>
              </YStack>
            </Card>
          )}

          {/* Search Bar */}
          <XStack gap="$2">
            <Input
              flex={1}
              placeholder="Search transactions..."
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
            <Button icon={Search} disabled />
          </XStack>

          {/* Transactions List */}
          <YStack gap="$3">
            {filteredTransactions?.length === 0 && (
              <Card padding="$4" bordered>
                <Text color="$gray11" textAlign="center">
                  No transactions found
                </Text>
              </Card>
            )}
            
            {filteredTransactions?.map((transaction) => (
              <Card key={transaction.id} bordered padding="$3">
                <YStack gap="$2">
                  <XStack justifyContent="space-between" alignItems="center">
                    <Text fontSize="$5" fontWeight="bold">
                      {transaction.group.name}
                    </Text>
                    <Badge 
                      backgroundColor={transaction.amount > 0 ? "$green10" : "$red10"} 
                      color="$background"
                    >
                      {transaction.amount > 0 ? "+" : ""}{transaction.amount}
                    </Badge>
                  </XStack>
                  
                  <Text fontSize="$3" color="$gray11">
                    By: {transaction.admin.name ?? "Unknown Admin"}
                  </Text>
                  
                  {transaction.reason && (
                    <Text fontSize="$3" color="$gray10" fontStyle="italic">
                      "{transaction.reason}"
                    </Text>
                  )}
                  
                  <Text fontSize="$2" color="$gray10">
                    {formatRelativeTime(transaction.createdAt)}
                  </Text>
                </YStack>
              </Card>
            ))}
          </YStack>
        </YStack>
      </ScrollView>
    </YStack>
  );
}
