import { Ionicons } from "@expo/vector-icons";
import { Alert, RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { Skeleton } from "~/components/ui/Skeleton";
import { useRewardPurchaseHistory, useUpdateMyRewardPurchaseStatus } from "~/hooks/rewards";
import { commonStyles } from "~/styles/commonStyles";
import { RewardsHistoryLoadingState } from "./RewardsHistoryLoadingState";

interface Props {
  tripId: string;
}

type PurchaseStatus = "BOUGHT" | "ACCEPTED" | "IN_DELIVERY" | "CANCELLED" | "DELIVERED";

export function shouldFetchNextPage(
  contentOffsetY: number,
  layoutMeasurementHeight: number,
  contentSizeHeight: number,
  threshold = 280,
): boolean {
  return contentOffsetY + layoutMeasurementHeight >= contentSizeHeight - threshold;
}

const statusMeta: Record<
  PurchaseStatus,
  { label: string; color: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  BOUGHT: { label: "Bought", color: "#fbbf24", icon: "receipt-outline" },
  ACCEPTED: { label: "Accepted", color: "#22c55e", icon: "checkmark-circle-outline" },
  IN_DELIVERY: { label: "In delivery", color: "#38bdf8", icon: "car-outline" },
  CANCELLED: { label: "Cancelled", color: "#ef4444", icon: "close-circle-outline" },
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
    if (shouldFetchNextPage(contentOffset.y, layoutMeasurement.height, contentSize.height)) {
      void fetchNextPage();
    }
  };

  if (isLoading) {
    return (
      <View style={commonStyles.container} testID="loading-indicator">
        <RewardsHistoryLoadingState />
        <Text style={[commonStyles.textSecondary, { marginTop: 16, textAlign: "center" }]}>
          Loading claim history...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={[
          commonStyles.container,
          { justifyContent: "center", alignItems: "center", paddingHorizontal: 24 },
        ]}
      >
        <Ionicons name="warning-outline" size={46} color="#ef4444" />
        <Text style={[commonStyles.textSecondary, { marginTop: 12, textAlign: "center" }]}>
          Failed to load claim history
        </Text>
      </View>
    );
  }

  return (
    <View style={commonStyles.container}>
      <ScrollView
        testID="rewards-scroll-view"
        style={{ flex: 1, padding: 16 }}
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
          <View style={{ justifyContent: "center", alignItems: "center", paddingVertical: 36 }}>
            <Ionicons name="time-outline" size={46} color="#6b7280" />
            <Text style={[commonStyles.textSecondary, { marginTop: 12, textAlign: "center" }]}>
              No reward claims yet
            </Text>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {purchases.map((purchase) => {
              const status = purchase.status ?? "BOUGHT";
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
                            Alert.alert("Saved", "Claim cancelled and coins refunded.");
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
                <View
                  key={purchase.id}
                  style={{
                    backgroundColor: "#0f2323",
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: "#273a3a",
                    padding: 14,
                    gap: 10,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 8,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[commonStyles.h4, { marginBottom: 4 }]}>
                        {purchase.reward?.name}
                      </Text>
                      <Text style={[commonStyles.textSecondary]}>
                        {purchase.quantity} x {purchase.reward?.coinCost} coins
                      </Text>
                    </View>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                        borderWidth: 1,
                        borderColor: statusInfo.color,
                        borderRadius: 999,
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        backgroundColor: `${statusInfo.color}20`,
                      }}
                    >
                      <Ionicons name={statusInfo.icon} size={12} color={statusInfo.color} />
                      <Text
                        style={[
                          commonStyles.label,
                          { color: statusInfo.color, letterSpacing: 0.6 },
                        ]}
                      >
                        {statusInfo.label}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Text style={[commonStyles.textSecondary, { color: "#fbbf24" }]}>
                      Total: {purchase.totalCost} coins
                    </Text>
                    <Text style={[commonStyles.textSecondary]}>
                      {new Date(purchase.purchasedAt).toLocaleDateString()}
                    </Text>
                  </View>

                  <Text style={[commonStyles.textSecondary]}>
                    Group: {purchase.group?.name ?? "Unknown"}
                  </Text>
                  {purchaserName ? (
                    <Text style={[commonStyles.textSecondary]}>Claimed by: {purchaserName}</Text>
                  ) : null}
                  {purchase.collectionMethod ? (
                    <View
                      style={{
                        borderWidth: 1,
                        borderColor: "#38bdf8",
                        borderRadius: 10,
                        backgroundColor: "rgba(56, 189, 248, 0.14)",
                        paddingHorizontal: 10,
                        paddingVertical: 8,
                        gap: 4,
                      }}
                    >
                      <Text style={[commonStyles.label, { color: "#38bdf8", letterSpacing: 0.7 }]}>
                        Pickup details
                      </Text>
                      <Text style={[commonStyles.textSecondary, { color: "#dbeafe" }]}>
                        {purchase.collectionMethod}
                      </Text>
                    </View>
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
                      <Ionicons name="hand-left-outline" size={14} color="#38bdf8" />
                      <Text style={[commonStyles.label, { color: "#38bdf8", letterSpacing: 0.7 }]}>
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
                      <Ionicons name="close-circle-outline" size={14} color="#ef4444" />
                      <Text style={[commonStyles.label, { color: "#ef4444", letterSpacing: 0.7 }]}>
                        Cancel claim
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              );
            })}

            {isFetchingNextPage ? (
              <View style={{ justifyContent: "center", alignItems: "center", paddingVertical: 12 }}>
                <Skeleton height={16} testID="loading-more-indicator" variant="line" width={120} />
                <Text style={[commonStyles.textSecondary, { marginTop: 8 }]}>
                  Loading more claim history...
                </Text>
              </View>
            ) : null}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
