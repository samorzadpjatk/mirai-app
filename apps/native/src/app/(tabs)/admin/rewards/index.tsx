import { useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useTRPC } from "@integral-2025-app/trpc/client";
import { useLocalSearchParams } from "expo-router";
import { commonStyles } from "~/styles/commonStyles";
import { spacing } from "~/styles";
import { useAppSafeAreaInsets } from "~/contexts/SafeAreaInsetsContext";
import { AdminHeader } from "~/components/admin/AdminHeader";
import { AdminAddFab } from "~/components/admin/common/AdminAddFab";
import AdminRewardsModal from "~/components/admin/rewards/AdminRewardsModal";
import AdminRewardDetailModal from "~/components/admin/rewards/AdminRewardDetailModal";
import { useAdminRewards, useUpdateRewardPurchaseStatus } from "~/hooks/rewards";
import { useQuery } from "@tanstack/react-query";

type ViewMode = "PURCHASES" | "REWARDS";
type PurchaseStatus = "BOUGHT" | "ACCEPTED" | "IN_DELIVERY" | "CANCELLED" | "DELIVERED";
type PurchaseStatusFilter = "ALL" | PurchaseStatus;

interface AdminPurchaseListItem {
  id: string;
  rewardId: string;
  quantity: number;
  totalCost: number;
  status: PurchaseStatus;
  collectionMethod?: string | null;
  purchasedAt: Date | string;
  reward: {
    id: string;
    name: string;
  };
  group: {
    id: string;
    name: string;
  } | null;
  purchasedBy: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
}

const statusOptions: { value: PurchaseStatusFilter; label: string }[] = [
  { value: "BOUGHT", label: "Pending" },
  { value: "ALL", label: "All" },
  { value: "ACCEPTED", label: "Accepted" },
  { value: "IN_DELIVERY", label: "In Delivery" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
];

const statusMeta: Record<PurchaseStatus, { label: string; color: string; icon: keyof typeof Ionicons.glyphMap }> = {
  BOUGHT: { label: "Bought", color: "#fbbf24", icon: "receipt-outline" },
  ACCEPTED: { label: "Accepted", color: "#22c55e", icon: "checkmark-circle-outline" },
  IN_DELIVERY: { label: "In delivery", color: "#38bdf8", icon: "car-outline" },
  DELIVERED: { label: "Delivered", color: "#10b981", icon: "cube-outline" },
  CANCELLED: { label: "Cancelled", color: "#ef4444", icon: "close-circle-outline" },
};

export default function AdminRewardsPage() {
  const trpc = useTRPC();
  const params = useLocalSearchParams();
  const tripIdParam =
    typeof params.tripId === "string" ? params.tripId : params.tripId?.[0];
  const tripId = useMemo(() => tripIdParam ?? "all", [tripIdParam]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRewardId, setSelectedRewardId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("PURCHASES");
  const [purchaseStatusFilter, setPurchaseStatusFilter] =
    useState<PurchaseStatusFilter>("BOUGHT");
  const [collectionMethodByPurchase, setCollectionMethodByPurchase] = useState<Record<string, string>>({});
  const insets = useAppSafeAreaInsets();
  const updatePurchaseStatus = useUpdateRewardPurchaseStatus();
  const tripQueryOptions = trpc.trip.getByIdAdmin.queryOptions({ id: tripIdParam ?? "" });
  const purchaseHistoryQueryOptions = trpc.reward.getPurchaseHistory.queryOptions({
    tripId: tripIdParam ?? "",
  });

  const { data: trip, error: tripError } = useQuery({
    ...tripQueryOptions,
    enabled: Boolean(tripIdParam),
  });

  const tripName = trip?.name ?? null;

  const {
    data: rewards,
    isLoading: rewardsLoading,
    error: rewardsError,
  } = useAdminRewards(tripId);

  const {
    data: purchasesData,
    isLoading: purchasesLoading,
    error: purchasesError,
  } = useQuery({
    ...purchaseHistoryQueryOptions,
    enabled: Boolean(tripIdParam),
  });

  const safePurchases = useMemo(() => {
    if (!Array.isArray(purchasesData)) return [] as AdminPurchaseListItem[];
    return purchasesData as AdminPurchaseListItem[];
  }, [purchasesData]);

  const filteredPurchases = useMemo(() => {
    if (purchaseStatusFilter === "ALL") return safePurchases;
    return safePurchases.filter((purchase) => purchase.status === purchaseStatusFilter);
  }, [safePurchases, purchaseStatusFilter]);

  const handleAcceptPurchase = async (purchaseId: string) => {
    const collectionMethod = collectionMethodByPurchase[purchaseId]?.trim();
    if (!collectionMethod) {
      Alert.alert("Collection method required", "Add pickup instructions before accepting.");
      return;
    }

    try {
      await updatePurchaseStatus.mutateAsync({
        purchaseId,
        status: "ACCEPTED",
        collectionMethod,
      });
      Alert.alert("Saved", "Purchase has been accepted.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to accept purchase";
      Alert.alert("Error", message);
    }
  };

  const handleCancelPurchase = (purchaseId: string) => {
    Alert.alert(
      "Cancel purchase",
      "This will cancel the purchase and refund coins to the group. Continue?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, cancel",
          style: "destructive",
          onPress: () => {
            void (async () => {
              try {
                await updatePurchaseStatus.mutateAsync({
                  purchaseId,
                  status: "CANCELLED",
                });
                Alert.alert("Saved", "Purchase has been cancelled and refunded.");
              } catch (error) {
                const message = error instanceof Error ? error.message : "Failed to cancel purchase";
                Alert.alert("Error", message);
              }
            })();
          },
        },
      ],
    );
  };

  const handleMarkDelivered = async (purchaseId: string) => {
    try {
      await updatePurchaseStatus.mutateAsync({
        purchaseId,
        status: "DELIVERED",
      });
      Alert.alert("Saved", "Purchase has been marked as delivered.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to mark purchase as delivered";
      Alert.alert("Error", message);
    }
  };

  return (
    <View style={[commonStyles.container, { paddingTop: spacing.xl, paddingBottom: insets.bottom }]}>
      <StatusBar style="light" />
      <AdminHeader
        title="Rewards"
        subtitle={
          tripName
            ? `Rewards for trip: ${tripName}`
            : tripIdParam
              ? "Rewards for the selected trip"
              : "All rewards in the system"
        }
      />

      <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity
            onPress={() => setViewMode("PURCHASES")}
            style={{
              flex: 1,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: viewMode === "PURCHASES" ? "#00ced1" : "#273a3a",
              backgroundColor: viewMode === "PURCHASES" ? "rgba(0, 206, 209, 0.14)" : "#0f2323",
              paddingVertical: 10,
              alignItems: "center",
            }}
          >
            <Text style={[commonStyles.label, { color: viewMode === "PURCHASES" ? "#00ced1" : "#9ca3af", letterSpacing: 1 }]}>
              Purchases
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setViewMode("REWARDS")}
            style={{
              flex: 1,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: viewMode === "REWARDS" ? "#00ced1" : "#273a3a",
              backgroundColor: viewMode === "REWARDS" ? "rgba(0, 206, 209, 0.14)" : "#0f2323",
              paddingVertical: 10,
              alignItems: "center",
            }}
          >
            <Text style={[commonStyles.label, { color: viewMode === "REWARDS" ? "#00ced1" : "#9ca3af", letterSpacing: 1 }]}>
              Rewards
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {viewMode === "PURCHASES" ? (
        <ScrollView style={{ flex: 1, paddingHorizontal: 16 }}>
          {!tripIdParam ? (
            <View style={{ justifyContent: "center", alignItems: "center", paddingVertical: 36 }}>
              <Ionicons name="information-circle-outline" size={44} color="#6b7280" />
              <Text style={[commonStyles.textSecondary, { marginTop: 12, textAlign: "center" }]}>
                Select a trip in admin panel to review purchases.
              </Text>
            </View>
          ) : purchasesError ? (
            <View style={{ justifyContent: "center", alignItems: "center", paddingVertical: 36 }}>
              <Ionicons name="warning" size={48} color="#ef4444" />
              <Text style={[commonStyles.textSecondary, { marginTop: 16, textAlign: "center" }]}>
                Failed to load purchases
              </Text>
              <Text style={[commonStyles.textSecondary, { marginTop: 8, textAlign: "center", fontSize: 12, color: "#666" }]}>
                {purchasesError instanceof Error ? purchasesError.message : "Try again"}
              </Text>
            </View>
          ) : purchasesLoading ? (
            <View style={{ justifyContent: "center", alignItems: "center", paddingVertical: 36 }}>
              <Text style={[commonStyles.textSecondary, { color: "#9ca3af" }]}>
                Loading purchases...
              </Text>
            </View>
          ) : (
            <View style={{ gap: 12, paddingBottom: 20 }}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, paddingBottom: 8 }}
              >
                {statusOptions.map((option) => {
                  const active = purchaseStatusFilter === option.value;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() => setPurchaseStatusFilter(option.value)}
                      style={{
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: active ? "#00ced1" : "#273a3a",
                        backgroundColor: active ? "rgba(0, 206, 209, 0.14)" : "#0f2323",
                        paddingHorizontal: 12,
                        paddingVertical: 7,
                      }}
                    >
                      <Text style={[commonStyles.label, { color: active ? "#00ced1" : "#9ca3af", letterSpacing: 0.8 }]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {filteredPurchases.length > 0 ? (
                filteredPurchases.map((purchase) => {
                  const statusInfo = statusMeta[purchase.status] ?? statusMeta.BOUGHT;
                  const purchaserName =
                    `${purchase.purchasedBy?.firstName ?? ""} ${purchase.purchasedBy?.lastName ?? ""}`.trim();
                  const canEditCollectionMethod =
                    purchase.status === "BOUGHT" || purchase.status === "ACCEPTED";
                  return (
                    <View
                      key={purchase.id}
                      style={{
                        backgroundColor: "#0f2323",
                        borderWidth: 1,
                        borderColor: purchase.status === "BOUGHT" ? "#fbbf24" : "#273a3a",
                        borderRadius: 12,
                        padding: 14,
                        gap: 10,
                      }}
                    >
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                        <View style={{ flex: 1 }}>
                          <Text style={[commonStyles.h4, { marginBottom: 3 }]} numberOfLines={1}>
                            {purchase.reward?.name ?? "Unknown reward"}
                          </Text>
                          <Text style={[commonStyles.textSecondary]}>
                            Group: {purchase.group?.name ?? "Unknown"}
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
                          <Text style={[commonStyles.label, { color: statusInfo.color, letterSpacing: 0.6 }]}>
                            {statusInfo.label}
                          </Text>
                        </View>
                      </View>

                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                        <Text style={[commonStyles.textSecondary, { color: "#fbbf24" }]}>
                          {purchase.quantity} pcs. • {purchase.totalCost} coins
                        </Text>
                        <Text style={[commonStyles.textSecondary]}>
                          {new Date(purchase.purchasedAt).toLocaleDateString()} • {new Date(purchase.purchasedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </Text>
                      </View>

                      {purchaserName ? (
                        <Text style={[commonStyles.textSecondary]}>
                          Claimed by: {purchaserName}
                        </Text>
                      ) : null}

                      {purchase.collectionMethod ? (
                        <Text style={[commonStyles.textSecondary, { color: "#93c5fd" }]}>
                          Pickup: {purchase.collectionMethod}
                        </Text>
                      ) : null}

                      <TextInput
                        style={{
                          backgroundColor: canEditCollectionMethod ? "#0b1a1a" : "#0a1414",
                          borderWidth: 1,
                          borderColor: canEditCollectionMethod ? "#273a3a" : "#1f2a2a",
                          borderRadius: 10,
                          paddingHorizontal: 10,
                          paddingVertical: 8,
                          color: canEditCollectionMethod ? "#fff" : "#9ca3af",
                        }}
                        placeholder="Collection method (how to pick up)"
                        placeholderTextColor="#6b7280"
                        value={collectionMethodByPurchase[purchase.id] ?? purchase.collectionMethod ?? ""}
                        editable={canEditCollectionMethod}
                        onChangeText={(text) =>
                          setCollectionMethodByPurchase((prev) => ({
                            ...prev,
                            [purchase.id]: text,
                          }))
                        }
                      />

                      {purchase.status === "BOUGHT" ? (
                        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                          <TouchableOpacity
                            onPress={() => handleAcceptPurchase(purchase.id)}
                            disabled={updatePurchaseStatus.isPending}
                            style={{
                              alignSelf: "flex-start",
                              borderRadius: 999,
                              borderWidth: 1,
                              borderColor: "#22c55e",
                              paddingHorizontal: 12,
                              paddingVertical: 7,
                              backgroundColor: "rgba(34, 197, 94, 0.14)",
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            {updatePurchaseStatus.isPending ? (
                              <ActivityIndicator size="small" color="#22c55e" />
                            ) : (
                              <Ionicons name="checkmark-circle-outline" size={14} color="#22c55e" />
                            )}
                            <Text style={[commonStyles.label, { color: "#22c55e", letterSpacing: 0.8 }]}>
                              Accept purchase
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleCancelPurchase(purchase.id)}
                            disabled={updatePurchaseStatus.isPending}
                            style={{
                              alignSelf: "flex-start",
                              borderRadius: 999,
                              borderWidth: 1,
                              borderColor: "#ef4444",
                              paddingHorizontal: 12,
                              paddingVertical: 7,
                              backgroundColor: "rgba(239, 68, 68, 0.14)",
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <Ionicons name="close-circle-outline" size={14} color="#ef4444" />
                            <Text style={[commonStyles.label, { color: "#ef4444", letterSpacing: 0.8 }]}>
                              Cancel purchase
                            </Text>
                          </TouchableOpacity>
                        </View>
                      ) : null}

                      {purchase.status === "ACCEPTED" ? (
                        <TouchableOpacity
                          onPress={() => handleCancelPurchase(purchase.id)}
                          disabled={updatePurchaseStatus.isPending}
                          style={{
                            alignSelf: "flex-start",
                            borderRadius: 999,
                            borderWidth: 1,
                            borderColor: "#ef4444",
                            paddingHorizontal: 12,
                            paddingVertical: 7,
                            backgroundColor: "rgba(239, 68, 68, 0.14)",
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <Ionicons name="close-circle-outline" size={14} color="#ef4444" />
                          <Text style={[commonStyles.label, { color: "#ef4444", letterSpacing: 0.8 }]}>
                            Cancel purchase
                          </Text>
                        </TouchableOpacity>
                      ) : null}

                      {purchase.status === "IN_DELIVERY" ? (
                        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                          <TouchableOpacity
                            onPress={() => handleMarkDelivered(purchase.id)}
                            disabled={updatePurchaseStatus.isPending}
                            style={{
                              alignSelf: "flex-start",
                              borderRadius: 999,
                              borderWidth: 1,
                              borderColor: "#10b981",
                              paddingHorizontal: 12,
                              paddingVertical: 7,
                              backgroundColor: "rgba(16, 185, 129, 0.14)",
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <Ionicons name="checkmark-done-circle-outline" size={14} color="#10b981" />
                            <Text style={[commonStyles.label, { color: "#10b981", letterSpacing: 0.8 }]}>
                              Reward delivered
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            onPress={() => handleCancelPurchase(purchase.id)}
                            disabled={updatePurchaseStatus.isPending}
                            style={{
                              alignSelf: "flex-start",
                              borderRadius: 999,
                              borderWidth: 1,
                              borderColor: "#ef4444",
                              paddingHorizontal: 12,
                              paddingVertical: 7,
                              backgroundColor: "rgba(239, 68, 68, 0.14)",
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <Ionicons name="close-circle-outline" size={14} color="#ef4444" />
                            <Text style={[commonStyles.label, { color: "#ef4444", letterSpacing: 0.8 }]}>
                              Cancel purchase
                            </Text>
                          </TouchableOpacity>
                        </View>
                      ) : null}
                    </View>
                  );
                })
              ) : (
                <View style={{ justifyContent: "center", alignItems: "center", paddingVertical: 36 }}>
                  <Ionicons name="cart-outline" size={44} color="#6b7280" />
                  <Text style={[commonStyles.textSecondary, { marginTop: 12, textAlign: "center" }]}>
                    No purchases for this filter
                  </Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      ) : (
        <ScrollView style={{ flex: 1, padding: 16 }}>
          {rewardsError ? (
            <View style={{ justifyContent: "center", alignItems: "center", paddingVertical: 32 }}>
              <Ionicons name="warning" size={48} color="#ef4444" />
              <Text style={[commonStyles.textSecondary, { marginTop: 16, textAlign: "center" }]}>Failed to load rewards</Text>
              <Text style={[commonStyles.textSecondary, { marginTop: 8, textAlign: "center", fontSize: 12, color: "#666" }]}>
                {rewardsError instanceof Error ? rewardsError.message : "Try again"}
              </Text>
            </View>
          ) : tripError ? (
            <View style={{ justifyContent: "center", alignItems: "center", paddingVertical: 32 }}>
              <Ionicons name="warning" size={48} color="#ef4444" />
              <Text style={[commonStyles.textSecondary, { marginTop: 16, textAlign: "center" }]}>
                Trip {tripName ? `"${tripName}"` : "(selected)"} does not exist
              </Text>
              <Text style={[commonStyles.textSecondary, { marginTop: 8, textAlign: "center", fontSize: 12, color: "#666" }]}>
                Check if the correct trip was selected in the admin panel
              </Text>
            </View>
          ) : rewardsLoading ? (
            <View style={{ justifyContent: "center", alignItems: "center", paddingVertical: 32 }}>
              <Text style={[commonStyles.textSecondary, { color: "#9ca3af" }]}>
                Loading rewards...
              </Text>
            </View>
          ) : (
            <View style={{ gap: 16 }}>
              {rewards && rewards.length > 0 ? (
                rewards.map((reward) => (
                  <TouchableOpacity
                    key={reward.id}
                    onPress={() => setSelectedRewardId(reward.id)}
                    activeOpacity={0.8}
                    style={{
                      backgroundColor: "#0f2323",
                      borderWidth: 1,
                      borderColor: "#273a3a",
                      borderRadius: 12,
                      padding: 16,
                    }}
                  >
                    <View style={{ flexDirection: "row", gap: 12, alignItems: "flex-start", marginBottom: 12 }}>
                      {(reward.signedImageUrl ?? reward.image) && (
                        <Image
                          source={{ uri: reward.signedImageUrl ?? reward.image ?? undefined }}
                          style={{ width: 72, aspectRatio: 1, borderRadius: 12, backgroundColor: "#0b1a1a" }}
                          resizeMode="cover"
                        />
                      )}
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <Text style={[commonStyles.h4]}>
                            {reward.name}
                          </Text>
                          {reward.isHidden ? (
                            <View
                              style={{
                                borderWidth: 1,
                                borderColor: "#ef4444",
                                borderRadius: 999,
                                paddingHorizontal: 8,
                                paddingVertical: 2,
                                backgroundColor: "rgba(239, 68, 68, 0.12)",
                              }}
                            >
                              <Text style={[commonStyles.label, { color: "#ef4444", letterSpacing: 0.6 }]}>
                                Hidden
                              </Text>
                            </View>
                          ) : null}
                        </View>
                        <Text style={[commonStyles.textSecondary, { color: "#9ca3af", marginBottom: 8 }]} numberOfLines={2}>
                          {reward.description}
                        </Text>
                        <View
                          style={{
                            flexDirection: "row",
                            gap: 16,
                            flexWrap: "wrap",
                            rowGap: 8,
                          }}
                        >
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                            <Ionicons name="cash" size={16} color="#fbbf24" />
                            <Text style={[commonStyles.label, { color: "#fbbf24" }]}>
                              {reward.coinCost} coins
                            </Text>
                          </View>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                            <Ionicons name="cube-outline" size={16} color="#10b981" />
                            <Text style={[commonStyles.label, { color: "#10b981" }]}>
                              {reward.availableQuantity} pcs.
                            </Text>
                          </View>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                            <Ionicons name="cart-outline" size={16} color="#00ced1" />
                            <Text style={[commonStyles.label, { color: "#00ced1" }]}>
                              {reward.purchasedCount ?? 0} purchased
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>

                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                      <Text style={[commonStyles.label, { color: "#6b7280" }]}>
                        Created: {new Date(reward.createdAt).toLocaleDateString()}
                      </Text>
                      <Text style={[commonStyles.label, { color: "#6b7280" }]}>
                        {reward.createdBy?.firstName} {reward.createdBy?.lastName}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={{ justifyContent: "center", alignItems: "center", paddingVertical: 32 }}>
                  <Ionicons name="gift" size={48} color="#6b7280" />
                  <Text style={[commonStyles.textSecondary, { marginTop: 16, textAlign: "center" }]}>
                    {tripIdParam
                      ? `No rewards for trip: ${tripName ?? "(loading name)"}`
                      : "No rewards in the system"}
                  </Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      )}

      {viewMode === "REWARDS" ? (
        <AdminAddFab
          onPress={() => setShowCreateModal(true)}
          accessibilityLabel="Add reward"
        />
      ) : null}

      <AdminRewardsModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        tripId={tripId}
      />
      {selectedRewardId && (
        <AdminRewardDetailModal
          rewardId={selectedRewardId}
          onClose={() => setSelectedRewardId(null)}
        />
      )}
    </View>
  );
}
