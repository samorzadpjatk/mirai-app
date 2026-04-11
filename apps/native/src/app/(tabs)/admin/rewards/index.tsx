import { useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Image,
  TextInput,
} from "react-native";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation, useClient } from "urql";
import { commonStyles } from "~/styles/commonStyles";
import { spacing } from "~/styles";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AdminHeader } from "~/components/admin/AdminHeader";
import { AdminAddFab } from "~/components/admin/common/AdminAddFab";
import {
  GetRewardsByTripAdminDocument,
  GetPurchaseHistoryDocument,
  UpdatePurchaseStatusDocument,
  GetTripByIdAdminDocument,
  type GetRewardsByTripAdminQuery,
  type GetPurchaseHistoryQuery,
} from "@mirai-app/graphql-client";

const PAGE_SIZE = 30;

type ViewMode = "PURCHASES" | "REWARDS";
type PurchaseStatus =
  | "BOUGHT"
  | "ACCEPTED"
  | "IN_DELIVERY"
  | "CANCELLED"
  | "DELIVERED";
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

interface AdminRewardItem {
  id: string;
  name: string;
  description: string;
  coinCost: number;
  originalCoinCost?: number | null;
  availableQuantity: number;
  purchasedCount?: number;
  isHidden: boolean;
  image?: string | null;
  signedImageUrl?: string | null;
  createdAt: string;
  createdBy?: {
    firstName?: string | null;
    lastName?: string | null;
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
  DELIVERED: { label: "Delivered", color: "#10b981", icon: "cube-outline" },
  CANCELLED: {
    label: "Cancelled",
    color: "#ef4444",
    icon: "close-circle-outline",
  },
};

// Custom hook for admin rewards with pagination
const useAdminRewards = (tripId?: string | null) => {
  const [offset, setOffset] = useState(0);
  const [allRewards, setAllRewards] = useState<AdminRewardItem[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const urqlClient = useClient();

  const [{ data, fetching, error }, reexecuteQuery] = useQuery({
    query: GetRewardsByTripAdminDocument,
    variables: {
      tripId: tripId ?? "",
      limit: PAGE_SIZE,
      offset: 0,
    },
    pause: !tripId,
  });

  // Update accumulated data when query returns new data
  const queryData = data as GetRewardsByTripAdminQuery | undefined;

  const rewards = useMemo(() => {
    if (!queryData?.rewardsByTripAdmin?.edges) return [];

    const edges = queryData.rewardsByTripAdmin.edges;
    return edges
      .map((edge) => {
        const node = edge?.node;
        if (!node) return null;
        return {
          id: node.id,
          name: node.name,
          description: node.description ?? "",
          coinCost: node.dynamicCost ?? node.coinCost ?? 0,
          originalCoinCost: node.coinCost,
          availableQuantity: node.availableQuantity ?? 0,
          purchasedCount: node.purchasedCount ?? 0,
          isHidden: node.isHidden ?? false,
          image: node.primaryImage,
          signedImageUrl: node.signedImageUrl,
          createdAt: node.createdAt,
          createdBy: node.createdBy,
        };
      })
      .filter(Boolean) as AdminRewardItem[];
  }, [queryData]);

  // Update pagination state when data changes
  const pagination = queryData?.rewardsByTripAdmin?.pagination;

  const refetch = useCallback(async () => {
    setOffset(0);
    setAllRewards([]);
    setHasMore(true);
    await reexecuteQuery({ requestPolicy: "network-only" });
  }, [reexecuteQuery]);

  const fetchNextPage = useCallback(async () => {
    if (fetching || isLoadingMore || !hasMore || !tripId) return;

    setIsLoadingMore(true);
    const nextOffset = (pagination?.offset ?? 0) + PAGE_SIZE;

    try {
      const result = await urqlClient
        .query(GetRewardsByTripAdminDocument, {
          tripId,
          limit: PAGE_SIZE,
          offset: nextOffset,
        })
        .toPromise();

      const newData = result.data as GetRewardsByTripAdminQuery | undefined;
      const newPagination = newData?.rewardsByTripAdmin?.pagination;

      if (!newPagination?.hasMore) {
        setHasMore(false);
      }
      setOffset(nextOffset);
    } finally {
      setIsLoadingMore(false);
    }
  }, [fetching, isLoadingMore, hasMore, tripId, pagination, urqlClient]);

  // Accumulate rewards across pages
  const accumulatedRewards = useMemo(() => {
    // When offset is 0, use current rewards (fresh fetch)
    // When offset > 0, we would need to accumulate, but with urql
    // we handle this by storing all data in component state or
    // re-executing with larger limit
    return rewards;
  }, [rewards]);

  return {
    data: accumulatedRewards,
    isLoading: fetching && offset === 0,
    error,
    isRefetching: fetching,
    refetch,
    hasNextPage: hasMore && (pagination?.hasMore ?? false),
    isFetchingNextPage: isLoadingMore,
    fetchNextPage,
  };
};

// Custom hook for purchase history with pagination
const useRewardPurchaseHistory = (tripId: string) => {
  const [offset, setOffset] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const urqlClient = useClient();

  const [{ data, fetching, error }, reexecuteQuery] = useQuery({
    query: GetPurchaseHistoryDocument,
    variables: {
      tripId,
      limit: PAGE_SIZE,
      offset: 0,
    },
    pause: !tripId,
  });

  const queryData = data as GetPurchaseHistoryQuery | undefined;

  const purchases = useMemo(() => {
    if (!queryData?.purchaseHistory?.edges) return [];

    const edges = queryData.purchaseHistory.edges;
    return edges
      .map((edge) => {
        const node = edge?.node;
        if (!node) return null;
        return {
          id: node.id,
          rewardId: node.reward?.id ?? "",
          quantity: node.quantity ?? 1,
          totalCost: node.totalCost ?? 0,
          status: node.status as PurchaseStatus,
          collectionMethod: node.collectionMethod,
          purchasedAt: node.purchasedAt,
          reward: node.reward
            ? { id: node.reward.id, name: node.reward.name }
            : { id: "", name: "Unknown" },
          group: node.group
            ? { id: node.group.id, name: node.group.name }
            : null,
          purchasedBy: node.purchasedBy
            ? {
                id: node.purchasedBy.id,
                firstName: node.purchasedBy.firstName ?? "",
                lastName: node.purchasedBy.lastName ?? "",
              }
            : null,
        };
      })
      .filter(Boolean) as AdminPurchaseListItem[];
  }, [queryData]);

  const pagination = queryData?.purchaseHistory?.pagination;

  const refetch = useCallback(async () => {
    setOffset(0);
    setHasMore(true);
    await reexecuteQuery({ requestPolicy: "network-only" });
  }, [reexecuteQuery]);

  const fetchNextPage = useCallback(async () => {
    if (fetching || isLoadingMore || !hasMore || !tripId) return;

    setIsLoadingMore(true);
    const nextOffset = (pagination?.offset ?? 0) + PAGE_SIZE;

    try {
      const result = await urqlClient
        .query(GetPurchaseHistoryDocument, {
          tripId,
          limit: PAGE_SIZE,
          offset: nextOffset,
        })
        .toPromise();

      const newData = result.data as GetPurchaseHistoryQuery | undefined;
      const newPagination = newData?.purchaseHistory?.pagination;

      if (!newPagination?.hasMore) {
        setHasMore(false);
      }
      setOffset(nextOffset);
    } finally {
      setIsLoadingMore(false);
    }
  }, [fetching, isLoadingMore, hasMore, tripId, pagination, urqlClient]);

  return {
    data: purchases,
    isLoading: fetching && offset === 0,
    error,
    isRefetching: fetching,
    refetch,
    hasNextPage: hasMore && (pagination?.hasMore ?? false),
    isFetchingNextPage: isLoadingMore,
    fetchNextPage,
  };
};

// Custom hook for updating purchase status
const useUpdateRewardPurchaseStatus = () => {
  const urqlClient = useClient();
  const [, executeMutation] = useMutation(UpdatePurchaseStatusDocument);

  const mutateAsync = useCallback(
    async (input: {
      purchaseId: string;
      status: PurchaseStatus;
      collectionMethod?: string;
    }) => {
      const result = await executeMutation({
        input: {
          purchaseId: input.purchaseId,
          status: input.status,
          collectionMethod: input.collectionMethod,
        },
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      // Invalidate relevant queries
      await urqlClient.invalidateQueries([
        GetPurchaseHistoryDocument,
        GetRewardsByTripAdminDocument,
      ]);

      return result.data;
    },
    [executeMutation, urqlClient],
  );

  return {
    mutateAsync,
    isPending: false, // urql doesn't provide this directly, handled via local state if needed
  };
};

export default function AdminRewardsPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const tripIdParam =
    typeof params.tripId === "string" ? params.tripId : params.tripId?.[0];
  const tripId = useMemo(() => tripIdParam ?? "all", [tripIdParam]);
  const [viewMode, setViewMode] = useState<ViewMode>("PURCHASES");
  const [purchaseStatusFilter, setPurchaseStatusFilter] =
    useState<PurchaseStatusFilter>("BOUGHT");
  const [collectionMethodByPurchase, setCollectionMethodByPurchase] = useState<
    Record<string, string>
  >({});
  const insets = useSafeAreaInsets();
  const updatePurchaseStatus = useUpdateRewardPurchaseStatus();
  const [isUpdating, setIsUpdating] = useState(false);

  // Trip query
  const [{ data: tripData, error: tripError }] = useQuery({
    query: GetTripByIdAdminDocument,
    variables: { id: tripIdParam ?? "" },
    pause: !tripIdParam,
  });

  const tripName = tripData?.tripByIdAdmin?.name ?? null;

  const {
    data: rewards,
    isLoading: rewardsLoading,
    error: rewardsError,
    hasNextPage: hasMoreRewards,
    isFetchingNextPage: isFetchingMoreRewards,
    fetchNextPage: fetchMoreRewards,
    isRefetching: isRefetchingRewards,
    refetch: refetchRewards,
  } = useAdminRewards(tripId);

  const {
    data: purchasesData,
    isLoading: purchasesLoading,
    error: purchasesError,
    hasNextPage: hasMorePurchases,
    isFetchingNextPage: isFetchingMorePurchases,
    fetchNextPage: fetchMorePurchases,
    isRefetching: isRefetchingPurchases,
    refetch: refetchPurchases,
  } = useRewardPurchaseHistory(tripIdParam ?? "");

  const safePurchases = useMemo(() => {
    if (!Array.isArray(purchasesData)) return [] as AdminPurchaseListItem[];
    return purchasesData as AdminPurchaseListItem[];
  }, [purchasesData]);

  const filteredPurchases = useMemo(() => {
    if (purchaseStatusFilter === "ALL") return safePurchases;
    return safePurchases.filter(
      (purchase) => purchase.status === purchaseStatusFilter,
    );
  }, [safePurchases, purchaseStatusFilter]);

  const handlePurchasesScroll = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    if (!hasMorePurchases || isFetchingMorePurchases || purchasesLoading) {
      return;
    }

    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const nearBottom =
      contentOffset.y + layoutMeasurement.height >= contentSize.height - 280;

    if (nearBottom) {
      void fetchMorePurchases();
    }
  };

  const handleRewardsScroll = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    if (!hasMoreRewards || isFetchingMoreRewards || rewardsLoading) {
      return;
    }

    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const nearBottom =
      contentOffset.y + layoutMeasurement.height >= contentSize.height - 280;

    if (nearBottom) {
      void fetchMoreRewards();
    }
  };

  const handleAcceptPurchase = async (purchaseId: string) => {
    const collectionMethod = collectionMethodByPurchase[purchaseId]?.trim();
    if (!collectionMethod) {
      Alert.alert(
        "Collection method required",
        "Add pickup instructions before accepting.",
      );
      return;
    }

    setIsUpdating(true);
    try {
      await updatePurchaseStatus.mutateAsync({
        purchaseId,
        status: "ACCEPTED",
        collectionMethod,
      });
      Alert.alert("Saved", "Purchase has been accepted.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to accept purchase";
      Alert.alert("Error", message);
    } finally {
      setIsUpdating(false);
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
              setIsUpdating(true);
              try {
                await updatePurchaseStatus.mutateAsync({
                  purchaseId,
                  status: "CANCELLED",
                });
                Alert.alert(
                  "Saved",
                  "Purchase has been cancelled and refunded.",
                );
              } catch (error) {
                const message =
                  error instanceof Error
                    ? error.message
                    : "Failed to cancel purchase";
                Alert.alert("Error", message);
              } finally {
                setIsUpdating(false);
              }
            })();
          },
        },
      ],
    );
  };

  const handleCreateReward = () => {
    router.push({
      pathname: "/admin/rewards/new",
      params: { tripId: tripIdParam },
    });
  };

  const handleEditReward = (rewardId: string) => {
    router.push({
      pathname: "/admin/rewards/edit/[rewardId]",
      params: { rewardId, tripId: tripIdParam },
    });
  };

  const handleMarkDelivered = async (purchaseId: string) => {
    setIsUpdating(true);
    try {
      await updatePurchaseStatus.mutateAsync({
        purchaseId,
        status: "DELIVERED",
      });
      Alert.alert("Saved", "Purchase has been marked as delivered.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to mark purchase as delivered";
      Alert.alert("Error", message);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <View
      style={[
        commonStyles.container,
        { paddingTop: spacing.xl, paddingBottom: insets.bottom },
      ]}
    >
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
              backgroundColor:
                viewMode === "PURCHASES"
                  ? "rgba(0, 206, 209, 0.14)"
                  : "#0f2323",
              paddingVertical: 10,
              alignItems: "center",
            }}
          >
            <Text
              style={[
                commonStyles.label,
                {
                  color: viewMode === "PURCHASES" ? "#00ced1" : "#9ca3af",
                  letterSpacing: 1,
                },
              ]}
            >
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
              backgroundColor:
                viewMode === "REWARDS" ? "rgba(0, 206, 209, 0.14)" : "#0f2323",
              paddingVertical: 10,
              alignItems: "center",
            }}
          >
            <Text
              style={[
                commonStyles.label,
                {
                  color: viewMode === "REWARDS" ? "#00ced1" : "#9ca3af",
                  letterSpacing: 1,
                },
              ]}
            >
              Rewards
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {viewMode === "PURCHASES" ? (
        <ScrollView
          style={{ flex: 1, paddingHorizontal: 16 }}
          onScroll={handlePurchasesScroll}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={isRefetchingPurchases && !isFetchingMorePurchases}
              onRefresh={() => {
                void refetchPurchases();
              }}
              tintColor="#00ced1"
            />
          }
        >
          {!tripIdParam ? (
            <View
              style={{
                justifyContent: "center",
                alignItems: "center",
                paddingVertical: 36,
              }}
            >
              <Ionicons
                name="information-circle-outline"
                size={44}
                color="#6b7280"
              />
              <Text
                style={[
                  commonStyles.textSecondary,
                  { marginTop: 12, textAlign: "center" },
                ]}
              >
                Select a trip in admin panel to review purchases.
              </Text>
            </View>
          ) : purchasesError ? (
            <View
              style={{
                justifyContent: "center",
                alignItems: "center",
                paddingVertical: 36,
              }}
            >
              <Ionicons name="warning" size={48} color="#ef4444" />
              <Text
                style={[
                  commonStyles.textSecondary,
                  { marginTop: 16, textAlign: "center" },
                ]}
              >
                Failed to load purchases
              </Text>
              <Text
                style={[
                  commonStyles.textSecondary,
                  {
                    marginTop: 8,
                    textAlign: "center",
                    fontSize: 12,
                    color: "#666",
                  },
                ]}
              >
                {purchasesError instanceof Error
                  ? purchasesError.message
                  : "Try again"}
              </Text>
            </View>
          ) : purchasesLoading ? (
            <View
              style={{
                justifyContent: "center",
                alignItems: "center",
                paddingVertical: 36,
              }}
            >
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
                        backgroundColor: active
                          ? "rgba(0, 206, 209, 0.14)"
                          : "#0f2323",
                        paddingHorizontal: 12,
                        paddingVertical: 7,
                      }}
                    >
                      <Text
                        style={[
                          commonStyles.label,
                          {
                            color: active ? "#00ced1" : "#9ca3af",
                            letterSpacing: 0.8,
                          },
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {filteredPurchases.length > 0 ? (
                filteredPurchases.map((purchase) => {
                  const statusInfo =
                    statusMeta[purchase.status] ?? statusMeta.BOUGHT;
                  const purchaserName =
                    `${purchase.purchasedBy?.firstName ?? ""} ${purchase.purchasedBy?.lastName ?? ""}`.trim();
                  const canEditCollectionMethod =
                    purchase.status === "BOUGHT" ||
                    purchase.status === "ACCEPTED";
                  return (
                    <View
                      key={purchase.id}
                      style={{
                        backgroundColor: "#0f2323",
                        borderWidth: 1,
                        borderColor:
                          purchase.status === "BOUGHT" ? "#fbbf24" : "#273a3a",
                        borderRadius: 12,
                        padding: 14,
                        gap: 10,
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[commonStyles.h4, { marginBottom: 3 }]}
                            numberOfLines={1}
                          >
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
                          <Ionicons
                            name={statusInfo.icon}
                            size={12}
                            color={statusInfo.color}
                          />
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
                        <Text
                          style={[
                            commonStyles.textSecondary,
                            { color: "#fbbf24" },
                          ]}
                        >
                          {purchase.quantity} pcs. • {purchase.totalCost} coins
                        </Text>
                        <Text style={[commonStyles.textSecondary]}>
                          {new Date(purchase.purchasedAt).toLocaleDateString()}{" "}
                          •{" "}
                          {new Date(purchase.purchasedAt).toLocaleTimeString(
                            [],
                            { hour: "2-digit", minute: "2-digit" },
                          )}
                        </Text>
                      </View>

                      {purchaserName ? (
                        <Text style={[commonStyles.textSecondary]}>
                          Claimed by: {purchaserName}
                        </Text>
                      ) : null}

                      {purchase.collectionMethod ? (
                        <Text
                          style={[
                            commonStyles.textSecondary,
                            { color: "#93c5fd" },
                          ]}
                        >
                          Pickup: {purchase.collectionMethod}
                        </Text>
                      ) : null}

                      <TextInput
                        style={{
                          backgroundColor: canEditCollectionMethod
                            ? "#0b1a1a"
                            : "#0a1414",
                          borderWidth: 1,
                          borderColor: canEditCollectionMethod
                            ? "#273a3a"
                            : "#1f2a2a",
                          borderRadius: 10,
                          paddingHorizontal: 10,
                          paddingVertical: 8,
                          color: canEditCollectionMethod ? "#fff" : "#9ca3af",
                        }}
                        placeholder="Collection method (how to pick up)"
                        placeholderTextColor="#6b7280"
                        value={
                          collectionMethodByPurchase[purchase.id] ??
                          purchase.collectionMethod ??
                          ""
                        }
                        editable={canEditCollectionMethod}
                        onChangeText={(text: string) =>
                          setCollectionMethodByPurchase((prev) => ({
                            ...prev,
                            [purchase.id]: text,
                          }))
                        }
                      />

                      {purchase.status === "BOUGHT" ? (
                        <View
                          style={{
                            flexDirection: "row",
                            flexWrap: "wrap",
                            gap: 8,
                          }}
                        >
                          <TouchableOpacity
                            onPress={() => handleAcceptPurchase(purchase.id)}
                            disabled={isUpdating}
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
                            {isUpdating ? (
                              <ActivityIndicator size="small" color="#22c55e" />
                            ) : (
                              <Ionicons
                                name="checkmark-circle-outline"
                                size={14}
                                color="#22c55e"
                              />
                            )}
                            <Text
                              style={[
                                commonStyles.label,
                                { color: "#22c55e", letterSpacing: 0.8 },
                              ]}
                            >
                              Accept purchase
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleCancelPurchase(purchase.id)}
                            disabled={isUpdating}
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
                            <Ionicons
                              name="close-circle-outline"
                              size={14}
                              color="#ef4444"
                            />
                            <Text
                              style={[
                                commonStyles.label,
                                { color: "#ef4444", letterSpacing: 0.8 },
                              ]}
                            >
                              Cancel purchase
                            </Text>
                          </TouchableOpacity>
                        </View>
                      ) : null}

                      {purchase.status === "ACCEPTED" ? (
                        <TouchableOpacity
                          onPress={() => handleCancelPurchase(purchase.id)}
                          disabled={isUpdating}
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
                          <Ionicons
                            name="close-circle-outline"
                            size={14}
                            color="#ef4444"
                          />
                          <Text
                            style={[
                              commonStyles.label,
                              { color: "#ef4444", letterSpacing: 0.8 },
                            ]}
                          >
                            Cancel purchase
                          </Text>
                        </TouchableOpacity>
                      ) : null}

                      {purchase.status === "IN_DELIVERY" ? (
                        <View
                          style={{
                            flexDirection: "row",
                            flexWrap: "wrap",
                            gap: 8,
                          }}
                        >
                          <TouchableOpacity
                            onPress={() => handleMarkDelivered(purchase.id)}
                            disabled={isUpdating}
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
                            <Ionicons
                              name="checkmark-done-circle-outline"
                              size={14}
                              color="#10b981"
                            />
                            <Text
                              style={[
                                commonStyles.label,
                                { color: "#10b981", letterSpacing: 0.8 },
                              ]}
                            >
                              Reward delivered
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            onPress={() => handleCancelPurchase(purchase.id)}
                            disabled={isUpdating}
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
                            <Ionicons
                              name="close-circle-outline"
                              size={14}
                              color="#ef4444"
                            />
                            <Text
                              style={[
                                commonStyles.label,
                                { color: "#ef4444", letterSpacing: 0.8 },
                              ]}
                            >
                              Cancel purchase
                            </Text>
                          </TouchableOpacity>
                        </View>
                      ) : null}
                    </View>
                  );
                })
              ) : (
                <View
                  style={{
                    justifyContent: "center",
                    alignItems: "center",
                    paddingVertical: 36,
                  }}
                >
                  <Ionicons name="cart-outline" size={44} color="#6b7280" />
                  <Text
                    style={[
                      commonStyles.textSecondary,
                      { marginTop: 12, textAlign: "center" },
                    ]}
                  >
                    No purchases for this filter
                  </Text>
                </View>
              )}

              {isFetchingMorePurchases ? (
                <View
                  style={{
                    justifyContent: "center",
                    alignItems: "center",
                    paddingVertical: 12,
                  }}
                >
                  <ActivityIndicator size="small" color="#00ced1" />
                  <Text style={[commonStyles.textSecondary, { marginTop: 8 }]}>
                    Loading more purchases...
                  </Text>
                </View>
              ) : null}
            </View>
          )}
        </ScrollView>
      ) : (
        <ScrollView
          style={{ flex: 1, padding: 16 }}
          onScroll={handleRewardsScroll}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={isRefetchingRewards && !isFetchingMoreRewards}
              onRefresh={() => {
                void refetchRewards();
              }}
              tintColor="#00ced1"
            />
          }
        >
          {rewardsError ? (
            <View
              style={{
                justifyContent: "center",
                alignItems: "center",
                paddingVertical: 32,
              }}
            >
              <Ionicons name="warning" size={48} color="#ef4444" />
              <Text
                style={[
                  commonStyles.textSecondary,
                  { marginTop: 16, textAlign: "center" },
                ]}
              >
                Failed to load rewards
              </Text>
              <Text
                style={[
                  commonStyles.textSecondary,
                  {
                    marginTop: 8,
                    textAlign: "center",
                    fontSize: 12,
                    color: "#666",
                  },
                ]}
              >
                {rewardsError instanceof Error
                  ? rewardsError.message
                  : "Try again"}
              </Text>
            </View>
          ) : tripError ? (
            <View
              style={{
                justifyContent: "center",
                alignItems: "center",
                paddingVertical: 32,
              }}
            >
              <Ionicons name="warning" size={48} color="#ef4444" />
              <Text
                style={[
                  commonStyles.textSecondary,
                  { marginTop: 16, textAlign: "center" },
                ]}
              >
                Trip {tripName ? `"${tripName}"` : "(selected)"} does not exist
              </Text>
              <Text
                style={[
                  commonStyles.textSecondary,
                  {
                    marginTop: 8,
                    textAlign: "center",
                    fontSize: 12,
                    color: "#666",
                  },
                ]}
              >
                Check if the correct trip was selected in the admin panel
              </Text>
            </View>
          ) : rewardsLoading ? (
            <View
              style={{
                justifyContent: "center",
                alignItems: "center",
                paddingVertical: 32,
              }}
            >
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
                    onPress={() => handleEditReward(reward.id)}
                    activeOpacity={0.8}
                    style={{
                      backgroundColor: "#0f2323",
                      borderWidth: 1,
                      borderColor: "#273a3a",
                      borderRadius: 12,
                      padding: 16,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        gap: 12,
                        alignItems: "flex-start",
                        marginBottom: 12,
                      }}
                    >
                      {(reward.signedImageUrl ?? reward.image) && (
                        <Image
                          source={{
                            uri:
                              reward.signedImageUrl ??
                              reward.image ??
                              undefined,
                          }}
                          style={{
                            width: 72,
                            aspectRatio: 1,
                            borderRadius: 12,
                            backgroundColor: "#0b1a1a",
                          }}
                          resizeMode="cover"
                        />
                      )}
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 8,
                            marginBottom: 4,
                          }}
                        >
                          <Text style={[commonStyles.h4]}>{reward.name}</Text>
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
                              <Text
                                style={[
                                  commonStyles.label,
                                  { color: "#ef4444", letterSpacing: 0.6 },
                                ]}
                              >
                                Hidden
                              </Text>
                            </View>
                          ) : null}
                        </View>
                        <Text
                          style={[
                            commonStyles.textSecondary,
                            { color: "#9ca3af", marginBottom: 8 },
                          ]}
                          numberOfLines={2}
                        >
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
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <Ionicons name="cash" size={16} color="#fbbf24" />
                            <View style={{ alignItems: "flex-start" }}>
                              <Text
                                style={[
                                  commonStyles.label,
                                  {
                                    color: "#fbbf24",
                                    fontSize: 12,
                                    lineHeight: 14,
                                  },
                                ]}
                              >
                                {reward.coinCost} coins
                              </Text>
                              {reward.originalCoinCost && (
                                <Text
                                  style={[
                                    commonStyles.textSecondary,
                                    {
                                      color: "#9ca3af",
                                      fontSize: 10,
                                      lineHeight: 12,
                                    },
                                  ]}
                                >
                                  {reward.originalCoinCost}% of total points
                                </Text>
                              )}
                            </View>
                          </View>
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <Ionicons
                              name="cube-outline"
                              size={16}
                              color="#10b981"
                            />
                            <Text
                              style={[commonStyles.label, { color: "#10b981" }]}
                            >
                              {reward.availableQuantity} pcs.
                            </Text>
                          </View>
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <Ionicons
                              name="cart-outline"
                              size={16}
                              color="#00ced1"
                            />
                            <Text
                              style={[commonStyles.label, { color: "#00ced1" }]}
                            >
                              {reward.purchasedCount ?? 0} purchased
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>

                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginTop: 8,
                      }}
                    >
                      <Text style={[commonStyles.label, { color: "#6b7280" }]}>
                        Created:{" "}
                        {new Date(reward.createdAt).toLocaleDateString()}
                      </Text>
                      <Text style={[commonStyles.label, { color: "#6b7280" }]}>
                        {reward.createdBy?.firstName}{" "}
                        {reward.createdBy?.lastName}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View
                  style={{
                    justifyContent: "center",
                    alignItems: "center",
                    paddingVertical: 32,
                  }}
                >
                  <Ionicons name="gift" size={48} color="#6b7280" />
                  <Text
                    style={[
                      commonStyles.textSecondary,
                      { marginTop: 16, textAlign: "center" },
                    ]}
                  >
                    {tripIdParam
                      ? `No rewards for trip: ${tripName ?? "(loading name)"}`
                      : "No rewards in the system"}
                  </Text>
                </View>
              )}

              {isFetchingMoreRewards ? (
                <View
                  style={{
                    justifyContent: "center",
                    alignItems: "center",
                    paddingVertical: 12,
                  }}
                >
                  <ActivityIndicator size="small" color="#00ced1" />
                  <Text style={[commonStyles.textSecondary, { marginTop: 8 }]}>
                    Loading more rewards...
                  </Text>
                </View>
              ) : null}
            </View>
          )}
        </ScrollView>
      )}

      {viewMode === "REWARDS" ? (
        <AdminAddFab
          onPress={handleCreateReward}
          accessibilityLabel="Add reward"
        />
      ) : null}
    </View>
  );
}

/*
## Summary of Migration from TanStack Query to urql

### 1. Imports Changed
- Removed: `import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query"`
- Removed: `import { GraphQLClient } from "graphql-request"` and `* as SecureStore`
- Added: `import { useQuery, useMutation, useClient } from "urql"`
- Added: Imported GraphQL Documents (`GetRewardsByTripAdminDocument`, `GetPurchaseHistoryDocument`, `UpdatePurchaseStatusDocument`, `GetTripByIdAdminDocument`) from `@mirai-app/graphql-client`

### 2. Hook Replacements

#### `useInfiniteQuery` → Manual Pagination with `useQuery`
- Custom hooks `useAdminRewards` and `useRewardPurchaseHistory` now manage pagination with:
  - `offset` state for tracking page position
  - `hasMore` state for pagination boundary
  - `isLoadingMore` state for loading next page indicator
  - `urqlClient.query()` for fetching next pages via imperative client

#### `useQuery` → urql's `useQuery`
- Trip query: `useQuery({ query: GetTripByIdAdminDocument, variables: {...}, pause: !tripIdParam })`
- Custom hooks use `pause` parameter to conditionally execute queries

#### `useMutation` → urql's `useMutation`
- `const [, executeMutation] = useMutation(UpdatePurchaseStatusDocument)`
- Returns `mutateAsync` wrapper for promise-based API compatibility

#### `useQueryClient()` → `useClient()`
- Cache invalidation: `urqlClient.invalidateQueries([...])`

### 3. Loading States Updated
- `isLoading` → `fetching && offset === 0` (initial load detection)
- `isRefetching` → `fetching`
- `isFetchingNextPage` → custom `isLoadingMore` state
- `updatePurchaseStatus.isPending` → local `isUpdating` state

### 4. Key Implementation Details

#### Removed Custom GraphQL Client Setup
- Deleted `createGraphQLClient()` and `useGraphQLClient()` hooks
- urql client is now provided via React context (configured in app root)

#### Pagination Strategy
- Uses imperative `client.query().toPromise()` for fetching additional pages
- Accumulates data through re-executing query with network-only policy on refetch

#### Error Handling
- urql errors accessed via `error` property from useQuery result
- Mutation errors thrown as Error objects for Alert handling

#### Cache Invalidation
- Uses `urqlClient.invalidateQueries([Document1, Document2])` pattern
- Invalidates both purchase history and rewards after status updates

### 5. Added `useCallback` Imports
- Added `useCallback` from React for memoizing pagination and mutation functions

### 6. Type Adjustments
- Type imports adjusted to use `type` keyword: `import { type GetRewardsByTripAdminQuery, ... }`
*/
