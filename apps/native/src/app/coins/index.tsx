import React, { useState } from "react";
import { YStack, H2, Spinner, Text, ScrollView, Button, Card, XStack, Input, Select, TextArea, Adapt, Sheet } from "tamagui";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTRPC } from "@integral-2025-app/trpc/client";
import { RefreshControl } from "react-native";
import { Plus, Minus } from "@tamagui/lucide-icons";

export default function CoinsScreen() {
  const trpc = useTRPC();
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [operation, setOperation] = useState<"add" | "remove">("add");
  
  const { data: groups, refetch: refetchGroups, isFetching: isFetchingGroups } = useQuery(
    trpc.group.getAll.queryOptions()
  );

  const { data: stats, refetch: refetchStats, isFetching: isFetchingStats } = useQuery(
    trpc.coinTransaction.getStatistics.queryOptions()
  );

  const addCoinsMutation = useMutation(
    trpc.coin.addCoins.mutationOptions({
      onSuccess: () => {
        void refetchGroups();
        void refetchStats();
        setSelectedGroupId("");
        setAmount("");
        setReason("");
      },
      onError: (err: Error) => {
        console.error("Error adding coins:", err);
      },
    })
  );

  const removeCoinsMutation = useMutation(
    trpc.coin.removeCoins.mutationOptions({
      onSuccess: () => {
        void refetchGroups();
        void refetchStats();
        setSelectedGroupId("");
        setAmount("");
        setReason("");
      },
      onError: (err: Error) => {
        console.error("Error removing coins:", err);
      },
    })
  );

  const handleSubmit = () => {
    if (!selectedGroupId || !amount || parseInt(amount) <= 0) return;

    const coinData = {
      groupId: selectedGroupId,
      amount: parseInt(amount),
      reason: reason || undefined,
    };

    if (operation === "add") {
      addCoinsMutation.mutate(coinData);
    } else {
      removeCoinsMutation.mutate(coinData);
    }
  };

  const isLoading = !groups || !stats;
  const isSubmitting = addCoinsMutation.isPending || removeCoinsMutation.isPending;
  const isFetching = isFetchingGroups || isFetchingStats;

  if (isLoading) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" padding="$4">
        <Spinner size="large" color="$blue10" />
        <Text marginTop="$4" color="$gray11">
          Loading...
        </Text>
      </YStack>
    );
  }

  const selectedGroup = groups.find(g => g.id === selectedGroupId);
  const requestedAmount = parseInt(amount) || 0;
  const currentCoins = selectedGroup?.coins ?? 0;
  const showWarning = operation === "remove" && selectedGroupId && amount && !isNaN(requestedAmount) && requestedAmount > currentCoins;

  return (
    <YStack flex={1} backgroundColor="$background">
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={() => {
              void refetchGroups();
              void refetchStats();
            }}
          />
        }
      >
        <YStack padding="$4" gap="$4">
          <H2 color="$gray12">
            Coin Operations
          </H2>

          {/* Statistics Card */}
          <Card bordered padding="$4">
            <Text fontSize="$5" fontWeight="bold" marginBottom="$3">
              Statistics
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
              <XStack justifyContent="space-between">
                <Text color="$gray11">Net Balance:</Text>
                <Text fontWeight="bold">{stats.netBalance}</Text>
              </XStack>
            </YStack>
          </Card>

          {/* Operation Form */}
          <Card bordered padding="$4">
            <Text fontSize="$5" fontWeight="bold" marginBottom="$3">
              Treasury Operations
            </Text>
            
            <YStack gap="$4">
              {/* Operation Type Buttons */}
              <XStack gap="$3">
                <Button
                  flex={1}
                  theme={operation === "add" ? "green" : undefined}
                  onPress={() => setOperation("add")}
                  icon={<Plus size={16} />}
                >
                  Add Coins
                </Button>
                <Button
                  flex={1}
                  theme={operation === "remove" ? "red" : undefined}
                  onPress={() => setOperation("remove")}
                  icon={<Minus size={16} />}
                >
                  Seize Coins
                </Button>
              </XStack>

              {/* Group Selection */}
              <YStack gap="$2">
                <Text fontWeight="bold">Select Guild</Text>
                <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                  <Select.Trigger width="100%" iconAfter={null}>
                    <Select.Value placeholder="Select Guild..." />
                  </Select.Trigger>

                  <Adapt when="sm" platform="touch">
                    <Sheet modal dismissOnSnapToBottom>
                      <Sheet.Frame>
                        <Sheet.ScrollView>
                          <Adapt.Contents />
                        </Sheet.ScrollView>
                      </Sheet.Frame>
                      <Sheet.Overlay animation="lazy" enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} />
                    </Sheet>
                  </Adapt>

                  <Select.Content zIndex={200000}>
                    <Select.ScrollUpButton />
                    <Select.Viewport>
                      {groups?.map((group, index) => (
                        <Select.Item key={group.id} value={group.id} index={index}>
                          <Select.ItemText>
                            {group.name} (💰 {group.coins} coins)
                          </Select.ItemText>
                        </Select.Item>
                      ))}
                    </Select.Viewport>
                    <Select.ScrollDownButton />
                  </Select.Content>
                </Select>
              </YStack>

              {/* Amount Input */}
              <YStack gap="$2">
                <Text fontWeight="bold">Treasury Amount</Text>
                <Input
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="e.g. 100"
                />
              </YStack>

              {/* Reason TextArea */}
              <YStack gap="$2">
                <Text fontWeight="bold">Justification (optional)</Text>
                <TextArea
                  value={reason}
                  onChangeText={setReason}
                  placeholder="e.g. Reward for Victory in the Tournament"
                  numberOfLines={3}
                />
              </YStack>

              {/* Warning Message */}
              {showWarning && (
                <Card backgroundColor="$red2" borderColor="$red6" bordered padding="$3">
                  <Text color="$red10">
                    ⚠️ Warning: The guild's treasury holds {currentCoins} coins, but you're trying to seize {requestedAmount} coins!
                  </Text>
                </Card>
              )}

              {/* Submit Button */}
              <Button
                onPress={handleSubmit}
                disabled={!selectedGroupId || !amount || requestedAmount <= 0 || isSubmitting}
                theme={operation === "add" ? "green" : "red"}
              >
                {isSubmitting ? (
                  operation === "add" ? "Adding..." : "Seizing..."
                ) : (
                  operation === "add" ?
                    `💰 Add ${requestedAmount} coins` :
                    `💸 Seize ${requestedAmount} coins`
                )}
              </Button>
            </YStack>
          </Card>

          {/* Groups List */}
          <Card bordered padding="$4">
            <Text fontSize="$5" fontWeight="bold" marginBottom="$3">
              Guild Treasuries
            </Text>
            <YStack gap="$3">
              {groups?.sort((a, b) => b.coins - a.coins).map((group, index) => (
                <XStack key={group.id} justifyContent="space-between" alignItems="center">
                  <XStack gap="$2" alignItems="center">
                    {index < 3 && (
                      <Text fontSize="$5">
                        {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                      </Text>
                    )}
                    <Text>{group.name}</Text>
                  </XStack>
                  <Text fontWeight="bold">💰 {group.coins}</Text>
                </XStack>
              ))}
            </YStack>
          </Card>
        </YStack>
      </ScrollView>
    </YStack>
  );
}
