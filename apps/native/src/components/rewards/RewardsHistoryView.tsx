import React from "react";
import {
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from "react-native";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  useRewardPurchaseHistory,
  useUpdateMyRewardPurchaseStatus,
} from "~/hooks/rewards";
import { YStack, XStack, Text, Card } from "@mirai-app/ui";

interface Props {
  tripId: string;
}

type PurchaseStatus =
  | "BOUGHT"
  | "ACCEPTED"
  | "IN_DELIVERY"
  | "CANCELLED"
  | "DELIVERED";

const statusMeta: Record<
  PurchaseStatus,
  { label: string; color: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  BOUGHT: { label: "Bought", color: "#fbbf24", icon: "receipt-outline" },
  ACCEPTED: {
    label: "Accepted",
    color: "#22c55e",
    icon: "checkmark-circle-outline",
  },
  IN_DELIVERY: { label: "In delivery", color: "#38bdf8", icon: "car-outline" },
  CANCELLED: {
    label: "Cancelled",
    color: "#ef4444",
    icon: "close-circle-outline",
  },
  DELIVERED: { label: "Delivered", color: "#10b981", icon: "cube-outline" },
};

export default function RewardsHistoryView({ tripId }: Props) {
  const {
    data,
    isLoading,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    isRefetching,
    refetch,
  } = useRewardPurchaseHistory(tripId);
  const updateMyPurchaseStatus = useUpdateMyRewardPurchaseStatus();

  const purchases = Array.isArray(data) ? data : [];

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!hasNextPage || isFetchingNextPage || isLoading) {
      return;
    }

    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const nearBottom =
      contentOffset.y + layoutMeasurement.height >= contentSize.height - 280;

    if (nearBottom) {
      void fetchNextPage();
    }
  };

  if (isLoading) {
    return (
      <YStack
        flex={1}
        backgroundColor="#17181c"
        justifyContent="center"
        alignItems="center"
      >
        <ActivityIndicator size="large" color="#00ced1" />
        <Text color="#9ca3af" marginTop="$4">
          Loading claim history...
        </Text>
      </YStack>
    );
  }

  if (error) {
    return (
      <YStack
        flex={1}
        backgroundColor="#17181c"
        justifyContent="center"
        alignItems="center"
        paddingHorizontal="$6"
      >
        <Ionicons name="warning-outline" size={46} color="#ef4444" />
        <Text color="#9ca3af" marginTop="$3" textAlign="center">
          No reward claims yet
        </Text>
      </YStack>
    );
  }

  return (
    <YStack flex={1} backgroundColor="#17181c">
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16 }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching && !isFetchingNextPage}
            onRefresh={() => {
              void refetch();
            }}
            tintColor="#00ced1"
          />
        }
      >
        {purchases.length === 0 ? (
          <YStack
            justifyContent="center"
            alignItems="center"
            paddingVertical="$9"
          >
            <Ionicons name="time-outline" size={46} color="#6b7280" />
            <Text color="#9ca3af" marginTop="$3" textAlign="center">
              No reward claims yet
            </Text>
          </YStack>
        ) : (
          <YStack gap="$3">
            {purchases.map((purchase) => {
              const status = (purchase.status ?? "BOUGHT") as PurchaseStatus;
              const statusInfo = statusMeta[status] ?? statusMeta.BOUGHT;
              const purchaserName =
                `${purchase.purchasedBy?.firstName ?? ""} ${purchase.purchasedBy?.lastName ?? ""}`.trim();
              const isUpdating = updateMyPurchaseStatus.isPending;

              const handlePickup = async () => {
                try {
                  await updateMyPurchaseStatus.mutateAsync({
                    purchaseId: purchase.id,
                    status: "IN_DELIVERY",
                  });
                  Alert.alert("Saved", "Status changed to in delivery.");
                } catch (mutationError) {
                  const message =
                    mutationError instanceof Error
                      ? mutationError.message
                      : "Failed to update status";
                  Alert.alert("Error", message);
                }
              };

              const handleCancel = () => {
                Alert.alert(
                  "Cancel claim",
                  "Do you want to cancel this claim and get coins back?",
                  [
                    { text: "No", style: "cancel" },
                    {
                      text: "Yes, cancel",
                      style: "destructive",
                      onPress: () => {
                        updateMyPurchaseStatus
                          .mutateAsync({
                            purchaseId: purchase.id,
                            status: "CANCELLED",
                          })
                          .then(() => {
                            Alert.alert(
                              "Saved",
                              "Claim cancelled and coins refunded.",
                            );
                          })
                          .catch((mutationError) => {
                            const message =
                              mutationError instanceof Error
                                ? mutationError.message
                                : "Failed to cancel claim";
                            Alert.alert("Error", message);
                          });
                      },
                    },
                  ],
                );
              };

              return (
                <Card
                  key={purchase.id}
                  backgroundColor="#0f2323"
                  borderRadius="$3"
                  borderWidth={1}
                  borderColor="#273a3a"
                  padding={14}
                  gap={10}
                >
                  <XStack
                    justifyContent="space-between"
                    alignItems="flex-start"
                    gap="$2"
                  >
                    <YStack flex={1}>
                      <Text
                        fontSize="$4"
                        fontWeight="bold"
                        color="white"
                        marginBottom="$1"
                      >
                        {purchase.reward?.name}
                      </Text>
                      <Text fontSize="$3" color="#9ca3af">
                        {purchase.quantity} x {purchase.reward?.coinCost} coins
                      </Text>
                    </YStack>
                    <XStack
                      alignItems="center"
                      gap="$1"
                      borderWidth={1}
                      borderRadius={999}
                      paddingHorizontal="$2"
                      paddingVertical="$1"
                      style={{
                        borderColor: statusInfo.color,
                        backgroundColor: `${statusInfo.color}20`,
                      }}
                    >
                      <Ionicons
                        name={statusInfo.icon}
                        size={12}
                        color={statusInfo.color}
                      />
                      <Text
                        fontSize={10}
                        fontWeight="bold"
                        style={{ color: statusInfo.color }}
                        letterSpacing={0.6}
                        textTransform="uppercase"
                      >
                        {statusInfo.label}
                      </Text>
                    </XStack>
                  </XStack>

                  <XStack justifyContent="space-between" alignItems="center">
                    <Text fontSize="$3" color="#fbbf24">
                      Total: {purchase.totalCost} coins
                    </Text>
                    <Text fontSize="$3" color="#9ca3af">
                      {new Date(purchase.purchasedAt).toLocaleDateString()}
                    </Text>
                  </XStack>

                  <Text fontSize="$3" color="#9ca3af">
                    Group: {purchase.group?.name ?? "Unknown"}
                  </Text>
                  {purchaserName ? (
                    <Text fontSize="$3" color="#9ca3af">
                      Claimed by: {purchaserName}
                    </Text>
                  ) : null}
                  {purchase.collectionMethod ? (
                    <Card
                      borderWidth={1}
                      borderColor="#38bdf8"
                      borderRadius="$3"
                      backgroundColor="rgba(56, 189, 248, 0.14)"
                      paddingHorizontal={10}
                      paddingVertical="$2"
                      gap="$1"
                    >
                      <Text
                        fontSize={10}
                        fontWeight="bold"
                        color="#38bdf8"
                        letterSpacing={0.7}
                        textTransform="uppercase"
                      >
                        Pickup details
                      </Text>
                      <Text fontSize="$3" color="#dbeafe">
                        {purchase.collectionMethod}
                      </Text>
                    </Card>
                  ) : null}

                  {status === "ACCEPTED" ? (
                    <TouchableOpacity
                      onPress={handlePickup}
                      disabled={isUpdating}
                      style={{
                        alignSelf: "flex-start",
                        borderWidth: 1,
                        borderColor: "#38bdf8",
                        borderRadius: 999,
                        backgroundColor: "rgba(56, 189, 248, 0.16)",
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                        opacity: isUpdating ? 0.6 : 1,
                      }}
                    >
                      <Ionicons
                        name="hand-left-outline"
                        size={14}
                        color="#38bdf8"
                      />
                      <Text
                        fontSize={10}
                        fontWeight="bold"
                        color="#38bdf8"
                        letterSpacing={0.7}
                        textTransform="uppercase"
                      >
                        I want to pick up
                      </Text>
                    </TouchableOpacity>
                  ) : null}

                  {status === "BOUGHT" ? (
                    <TouchableOpacity
                      onPress={handleCancel}
                      disabled={isUpdating}
                      style={{
                        alignSelf: "flex-start",
                        borderWidth: 1,
                        borderColor: "#ef4444",
                        borderRadius: 999,
                        backgroundColor: "rgba(239, 68, 68, 0.14)",
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                        opacity: isUpdating ? 0.6 : 1,
                      }}
                    >
                      <Ionicons
                        name="close-circle-outline"
                        size={14}
                        color="#ef4444"
                      />
                      <Text
                        fontSize={10}
                        fontWeight="bold"
                        color="#ef4444"
                        letterSpacing={0.7}
                        textTransform="uppercase"
                      >
                        Cancel claim
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </Card>
              );
            })}

            {isFetchingNextPage ? (
              <YStack
                justifyContent="center"
                alignItems="center"
                paddingVertical="$3"
              >
                <ActivityIndicator size="small" color="#00ced1" />
                <Text color="#9ca3af" marginTop="$2">
                  Loading more claim history...
                </Text>
              </YStack>
            ) : null}
          </YStack>
        )}
      </ScrollView>
    </YStack>
  );
}
