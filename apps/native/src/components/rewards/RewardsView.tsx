import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { useMyGroup } from "~/hooks/groups";
import { usePurchaseReward, useRewards } from "~/hooks/rewards";
import { useTripDetails } from "~/hooks/trips";
import { colors, commonStyles } from "~/styles";
import { type ThemePalette, useTripTheme } from "~/theme/TripThemeProvider";
import RewardCard from "./RewardCard";
import RewardDetailsModal from "./RewardDetailsModal";
import RewardPurchaseModal from "./RewardPurchaseModal";
import { RewardsLoadingState } from "./RewardsLoadingState";
import type { RewardListItem } from "./types";

interface Props {
  tripId: string;
}

export function extractSafeRewards(rewards: unknown): RewardListItem[] {
  const data = rewards as RewardListItem[] | undefined;
  if (Array.isArray(data)) return data;
  return [];
}

export interface RewardImageSource {
  signedImageUrls?: string[] | null;
  images?: string[] | null;
  signedImageUrl?: string | null;
  image?: string | null;
}

export function getRewardImages(reward: RewardImageSource): string[] {
  if (reward.signedImageUrls && reward.signedImageUrls.length > 0) {
    return reward.signedImageUrls;
  }
  if (reward.images && reward.images.length > 0) {
    return reward.images;
  }
  if (reward.signedImageUrl) return [reward.signedImageUrl];
  if (reward.image) return [reward.image];
  return [];
}

export interface RewardButtonState {
  disabled: boolean;
  text: string;
  backgroundColor: string;
  opacity: number;
}

export function getRewardButtonState(
  canAfford: boolean,
  isEligibleToBuy: boolean,
  isOutOfStock: boolean,
  isTripPast: boolean,
  palette: ThemePalette = colors,
): RewardButtonState {
  const enabled = canAfford && isEligibleToBuy && !isOutOfStock && !isTripPast;
  let text: string;
  if (isTripPast) {
    text = "Trip ended";
  } else if (isOutOfStock) {
    text = "Sold out";
  } else if (!isEligibleToBuy) {
    text = "Only group leader";
  } else if (canAfford) {
    text = "Claim reward";
  } else {
    text = "Not enough coins";
  }
  return {
    disabled: !enabled,
    text,
    backgroundColor: enabled ? palette.primary : colors.gray700,
    opacity: enabled ? 1 : 0.5,
  };
}

export function getRewardBorderColor(justRefreshed: boolean, isOutOfStock: boolean): string {
  if (justRefreshed && !isOutOfStock) return colors.statusCompleted;
  if (isOutOfStock) return colors.danger;
  return colors.cardBorder;
}

export function getRewardShadowProps(justRefreshed: boolean): {
  shadowColor: string;
  shadowOffset: { width: number; height: number } | undefined;
  shadowOpacity: number;
  shadowRadius: number;
} {
  return {
    shadowColor: justRefreshed ? colors.statusCompleted : "transparent",
    shadowOffset: justRefreshed ? { width: 0, height: 0 } : undefined,
    shadowOpacity: justRefreshed ? 0.3 : 0,
    shadowRadius: justRefreshed ? 4 : 0,
  };
}

export function getRewardAvailabilityText(
  isOutOfStock: boolean,
  availableQuantity: number | null | undefined,
): string {
  return isOutOfStock ? "Sold out" : `${availableQuantity ?? 0} pcs.`;
}

export function getRewardAvailabilityColor(isOutOfStock: boolean): string {
  return isOutOfStock ? colors.danger : colors.statusCompleted;
}

export function getTotalCost(coinCost: number, quantity: string): number {
  return coinCost * (Number.parseInt(quantity, 10) || 1);
}

export function isValidQuantity(quantity: string): boolean {
  const qty = Number.parseInt(quantity, 10);
  return !Number.isNaN(qty) && qty >= 1;
}

export function getPurchaseModalError(
  currentUserGroup: unknown,
  isEligibleToBuy: boolean,
): string | null {
  if (!currentUserGroup) return "You are not assigned to any group";
  if (!isEligibleToBuy) return "Only group leader can claim rewards";
  return null;
}

export function getPurchaseValidationError(
  quantity: string,
  coinCost: number,
  groupCoins: number,
): string | null {
  if (!isValidQuantity(quantity)) return "Enter a valid quantity";
  const totalCost = getTotalCost(coinCost, quantity);
  if (totalCost > groupCoins) return "You do not have enough coins";
  return null;
}

export default function RewardsView({ tripId }: Props) {
  const router = useRouter();
  const { palette } = useTripTheme();
  const queryClient = useQueryClient();
  const { data: rewards, isLoading, error, refetch } = useRewards(tripId);
  const { group: currentUserGroup } = useMyGroup(tripId);
  const { isTripPast } = useTripDetails(tripId);
  const purchaseReward = usePurchaseReward();
  const { width: viewportWidth } = useWindowDimensions();
  const [selectedReward, setSelectedReward] = useState<RewardListItem | null>(null);
  const [previewReward, setPreviewReward] = useState<RewardListItem | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showRewardDetailsModal, setShowRewardDetailsModal] = useState(false);
  const [previewImageIndex, setPreviewImageIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [justRefreshed, setJustRefreshed] = useState(false);

  const safeRewards = useMemo(() => extractSafeRewards(rewards), [rewards]);

  const groupCoins = currentUserGroup?.coins ?? 0;
  const previewCarouselWidth = Math.max(260, viewportWidth - 48);
  const previewImages = previewReward ? getRewardImages(previewReward) : [];

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
      await queryClient.invalidateQueries({ queryKey: [["group"]] });
      await queryClient.invalidateQueries({ queryKey: [["reward"]] });
      setLastRefreshTime(new Date());
      setJustRefreshed(true);
      setTimeout(() => setJustRefreshed(false), 2000);
      Alert.alert("Updated", "Reward pricing has been refreshed", [
        { text: "OK", style: "default" },
      ]);
    } catch {
      Alert.alert("Error", "Failed to refresh rewards");
    } finally {
      setRefreshing(false);
    }
  };

  const handlePurchase = async () => {
    if (!selectedReward || !quantity) return;
    const error = getPurchaseValidationError(quantity, selectedReward.coinCost, groupCoins);
    if (error) {
      Alert.alert("Error", error);
      return;
    }

    try {
      const qty = Number.parseInt(quantity, 10);
      await purchaseReward.mutateAsync({
        rewardId: selectedReward.id,
        quantity: qty,
      });

      Alert.alert("Success", `Claimed ${qty}x ${selectedReward.name}`);
      setShowPurchaseModal(false);
      setQuantity("1");
      setSelectedReward(null);
    } catch {
      Alert.alert("Error", "Failed to claim reward");
    }
  };

  const openPurchaseModal = (reward: RewardListItem) => {
    const error = getPurchaseModalError(currentUserGroup, reward.isEligibleToBuy);
    if (error) {
      Alert.alert("Error", error);
      return;
    }

    setSelectedReward(reward);
    setQuantity("1");
    setShowPurchaseModal(true);
  };

  const openRewardDetailsModal = (reward: RewardListItem) => {
    setPreviewReward(reward);
    setPreviewImageIndex(0);
    setShowRewardDetailsModal(true);
  };

  if (isLoading) {
    return (
      <View style={commonStyles.container} testID="loading-indicator">
        <RewardsLoadingState />
        <Text style={[commonStyles.textSecondary, { marginTop: 16, textAlign: "center" }]}>
          Loading rewards...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[commonStyles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Ionicons name="alert-circle" size={48} color={colors.danger} />
        <Text style={[commonStyles.textSecondary, { marginTop: 16, textAlign: "center" }]}>
          Failed to load rewards
        </Text>
      </View>
    );
  }

  if (!safeRewards || safeRewards.length === 0) {
    return (
      <View style={[commonStyles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Ionicons name="gift" size={48} color={colors.gray500} />
        <Text style={[commonStyles.textSecondary, { marginTop: 16, textAlign: "center" }]}>
          No rewards available for this trip
        </Text>
      </View>
    );
  }

  return (
    <View style={commonStyles.container}>
      <View style={{ padding: 16 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={[commonStyles.h3]}>Rewards</Text>
            {lastRefreshTime && !refreshing && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Ionicons name="refresh" size={14} color={colors.statusCompleted} />
                <Text
                  style={[
                    commonStyles.textSecondary,
                    { color: colors.statusCompleted, fontSize: 11 },
                  ]}
                >
                  Updated{" "}
                  {lastRefreshTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            onPress={() => router.push({ pathname: "/trips/rewards/history", params: { tripId } })}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              borderWidth: 1,
              borderColor: colors.cardBorder,
              borderRadius: 999,
              paddingHorizontal: 12,
              paddingVertical: 6,
            }}
          >
            <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
            <Text style={[commonStyles.textSecondary, { fontSize: 12 }]}>History</Text>
          </TouchableOpacity>
        </View>

        {currentUserGroup && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Ionicons name="people" size={16} color={palette.primary} />
            <Text style={[commonStyles.textPrimary, { color: palette.primary }]}>
              {currentUserGroup.name}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Ionicons name="cash" size={16} color={colors.amber400} />
              <Text style={[commonStyles.textPrimary, { color: colors.amber400 }]}>
                {groupCoins} coins
              </Text>
            </View>
          </View>
        )}
      </View>

      <ScrollView
        testID="rewards-scroll-view"
        style={{ flex: 1, padding: 16 }}
        contentContainerStyle={{ paddingBottom: 96 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={palette.primary}
            colors={[palette.primary]}
          />
        }
      >
        <View
          style={{
            gap: 16,
          }}
        >
          {safeRewards.map((reward) => (
            <RewardCard
              key={reward.id}
              reward={reward}
              justRefreshed={justRefreshed}
              isTripPast={isTripPast ?? false}
              onPress={openRewardDetailsModal}
              onPurchasePress={openPurchaseModal}
            />
          ))}
        </View>
      </ScrollView>

      <RewardPurchaseModal
        visible={showPurchaseModal}
        reward={selectedReward}
        quantity={quantity}
        onClose={() => setShowPurchaseModal(false)}
        onQuantityChange={setQuantity}
        onConfirm={handlePurchase}
        isPending={purchaseReward.isPending}
      />

      <RewardDetailsModal
        visible={showRewardDetailsModal}
        reward={previewReward}
        images={previewImages}
        carouselWidth={previewCarouselWidth}
        imageIndex={previewImageIndex}
        onClose={() => setShowRewardDetailsModal(false)}
        onPurchase={openPurchaseModal}
        onImageIndexChange={setPreviewImageIndex}
        isTripPast={isTripPast ?? false}
      />
    </View>
  );
}
