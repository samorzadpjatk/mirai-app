import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
  TextInput,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useRewards, usePurchaseReward } from "~/hooks/rewards";
import { useMyGroup } from "~/hooks/groups";
import type { RewardListItem } from "./types";
import { commonStyles } from "~/styles/commonStyles";

interface Props {
  tripId: string;
}

export default function RewardsView({ tripId }: Props) {
  const router = useRouter();
  const { data: rewards, isLoading, error } = useRewards(tripId);
  const { group: currentUserGroup } = useMyGroup(tripId);
  const purchaseReward = usePurchaseReward();
  const { width: viewportWidth } = useWindowDimensions();
  const [selectedReward, setSelectedReward] = useState<RewardListItem | null>(null);
  const [previewReward, setPreviewReward] = useState<RewardListItem | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showRewardDetailsModal, setShowRewardDetailsModal] = useState(false);
  const [previewImageIndex, setPreviewImageIndex] = useState(0);

  const safeRewards: RewardListItem[] = useMemo(() => {
    const data = rewards as
      | RewardListItem[]
      | { data?: RewardListItem[] }
      | undefined;

    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.data)) return data.data;
    return [];
  }, [rewards]);

  const groupCoins = currentUserGroup?.coins ?? 0;
  const previewCarouselWidth = Math.max(260, viewportWidth - 48);

  const getRewardImages = (reward: RewardListItem): string[] => {
    if (reward.signedImageUrls && reward.signedImageUrls.length > 0) {
      return reward.signedImageUrls;
    }
    if (reward.images && reward.images.length > 0) {
      return reward.images;
    }
    if (reward.signedImageUrl) return [reward.signedImageUrl];
    if (reward.image) return [reward.image];
    return [];
  };

  const handlePurchase = async () => {
    if (!selectedReward || !quantity) return;

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 1) {
      Alert.alert("Error", "Enter a valid quantity");
      return;
    }

    const totalCost = selectedReward.coinCost * qty;
    if (totalCost > groupCoins) {
      Alert.alert("Error", "You do not have enough coins");
      return;
    }

    try {
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
    if (!currentUserGroup) {
      Alert.alert("Error", "You are not assigned to any group");
      return;
    }

    if (!reward.isEligibleToBuy) {
      Alert.alert("Error", "Only group leader can claim rewards");
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

  const previewImages = previewReward ? getRewardImages(previewReward) : [];

  if (isLoading) {
    return (
      <View style={[commonStyles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#00ced1" />
                <Text style={[commonStyles.textSecondary, { marginTop: 16 }]}>Loading rewards...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[commonStyles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Ionicons name="alert-circle" size={48} color="#ef4444" />
        <Text style={[commonStyles.textSecondary, { marginTop: 16, textAlign: "center" }]}>
          Failed to load rewards
        </Text>
      </View>
    );
  }

  if (!safeRewards || safeRewards.length === 0) {
    return (
      <View style={[commonStyles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Ionicons name="gift" size={48} color="#6b7280" />
        <Text style={[commonStyles.textSecondary, { marginTop: 16, textAlign: "center" }]}>
          No rewards available for this trip
        </Text>
      </View>
    );
  }

  return (
    <View style={commonStyles.container}>
      {/* Header with group coins */}
      <View style={{
        padding: 16,
      }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <Text style={[commonStyles.h3]}>Rewards</Text>
          <TouchableOpacity
            onPress={() => router.push({ pathname: "/trips/rewards/history", params: { tripId } })}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              borderWidth: 1,
              borderColor: "#273a3a",
              borderRadius: 999,
              paddingHorizontal: 14,
              paddingVertical: 9,
              backgroundColor: "#102424",
            }}
          >
            <Ionicons name="time-outline" size={16} color="#00ced1" />
            <Text style={[commonStyles.label, { color: "#00ced1", letterSpacing: 0.8, fontSize: 12 }]}>
              My rewards
            </Text>
          </TouchableOpacity>
        </View>
        {currentUserGroup && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Ionicons name="people" size={16} color="#00ced1" />
            <Text style={[commonStyles.textPrimary, { color: "#00ced1" }]}> 
              {currentUserGroup.name}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Ionicons name="cash" size={16} color="#fbbf24" />
              <Text style={[commonStyles.textPrimary, { color: "#fbbf24" }]}> 
                {groupCoins} coins
              </Text>
            </View>
          </View>
        )}
      </View>

      <ScrollView style={{ flex: 1, padding: 16 }}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 16 }}>
          {safeRewards.map((reward) => {
            const rewardImages = getRewardImages(reward);
            const rewardPrimaryImage = rewardImages[0] ?? null;

            return (
              <View
                key={reward.id}
                style={{
                  width: "48%",
                  backgroundColor: "#0f2323",
                  borderWidth: 1,
                  borderColor: reward.isOutOfStock ? "#ef4444" : "#273a3a",
                  borderRadius: 12,
                  padding: 16,
                }}
              >
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => openRewardDetailsModal(reward)}
              >
                {/* Reward Image */}
                {rewardPrimaryImage ? (
                  <Image
                    source={{ uri: rewardPrimaryImage }}
                    style={{
                      width: "100%",
                      aspectRatio: 1,
                      borderRadius: 8,
                      marginBottom: 12,
                    }}
                    resizeMode="cover"
                  />
                ) : (
                  <View
                    style={{
                      width: "100%",
                      aspectRatio: 1,
                      borderRadius: 8,
                      marginBottom: 12,
                      borderWidth: 1,
                      borderColor: "#273a3a",
                      backgroundColor: "#0b1a1a",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons name="gift-outline" size={36} color="#6b7280" />
                  </View>
                )}

                {/* Reward Info */}
                <View style={{ marginBottom: 12 }}>
                  <Text style={[commonStyles.h4, { marginBottom: 4 }]}>
                    {reward.name}
                  </Text>
                  <Text
                    numberOfLines={3}
                    ellipsizeMode="tail"
                    style={[commonStyles.textSecondary, { color: "#9ca3af", marginBottom: 6 }]}
                  >
                    {reward.description}
                  </Text>
                  <Text style={[commonStyles.textSecondary, { color: "#00ced1", fontSize: 11, marginBottom: 8 }]}>
                    Tap to read full description
                  </Text>

                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <Ionicons name="cash" size={16} color="#fbbf24" />
                      <Text style={[commonStyles.textPrimary, { color: "#fbbf24" }]}>
                        {reward.coinCost} coins
                      </Text>
                    </View>

                    <Text style={[commonStyles.textPrimary, {
                      color: reward.isOutOfStock ? "#ef4444" : "#10b981",
                      fontWeight: "600"
                    }]}>
                      {reward.isOutOfStock ? "Sold out" : `${reward.availableQuantity ?? 0} pcs.`}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

              {/* Purchase Button */}
              <TouchableOpacity
                onPress={() => openPurchaseModal(reward)}
                disabled={!reward.canAfford || !reward.isEligibleToBuy || reward.isOutOfStock}
                style={[
                  commonStyles.button,
                  {
                    backgroundColor: reward.canAfford && reward.isEligibleToBuy && !reward.isOutOfStock ? "#00ced1" : "#374151",
                    opacity: reward.canAfford && reward.isEligibleToBuy && !reward.isOutOfStock ? 1 : 0.5,
                  }
                ]}
              >
                <Text style={commonStyles.buttonText}>
                  {reward.isOutOfStock ? "Sold out" : 
                   !reward.isEligibleToBuy ? "Only group leader" : 
                   !reward.canAfford ? "Not enough coins" : 
                   "Claim reward"}
                </Text>
              </TouchableOpacity>
            </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Purchase Modal */}
      <Modal
        visible={showPurchaseModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPurchaseModal(false)}
      >
        <View style={commonStyles.container}>
          <View style={{
            padding: 24,
            borderBottomWidth: 1,
            borderBottomColor: "#273a3a",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <Text style={[commonStyles.h3]}>Claim reward</Text>
            <TouchableOpacity onPress={() => setShowPurchaseModal(false)}>
              <Ionicons name="close" size={24} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ padding: 24 }}>
            {selectedReward && (
              <>
                <View style={{ marginBottom: 20 }}>
                  <Text style={[commonStyles.h4, { marginBottom: 8 }]}>
                    {selectedReward.name}
                  </Text>
                  <Text style={[commonStyles.textSecondary, { color: "#9ca3af", marginBottom: 16 }]}>
                    {selectedReward.description}
                  </Text>
                  
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <Ionicons name="cash" size={16} color="#fbbf24" />
                      <Text style={[commonStyles.textPrimary, { color: "#fbbf24" }]}>
                        {selectedReward.coinCost} coins / item
                      </Text>
                    </View>
                    
                    <Text style={[commonStyles.textPrimary, { color: "#10b981" }]}>
                      Available: {selectedReward.availableQuantity} pcs.
                    </Text>
                  </View>
                </View>

                <View style={{ marginBottom: 20 }}>
                  <Text style={[commonStyles.textSecondary, { marginBottom: 8 }]}>
                    Quantity
                  </Text>
                  <TextInput
                    style={{
                      backgroundColor: "#0f2323",
                      borderWidth: 1,
                      borderColor: "#273a3a",
                      borderRadius: 12,
                      padding: 12,
                      color: "#fff",
                    }}
                    placeholder="1"
                    placeholderTextColor="#6b7280"
                    value={quantity}
                    onChangeText={setQuantity}
                    keyboardType="numeric"
                  />
                </View>

                <View style={{
                  backgroundColor: "#1f2937",
                  padding: 16,
                  borderRadius: 12,
                  marginBottom: 24,
                }}>
                  <Text style={[commonStyles.textSecondary, { marginBottom: 8 }]}>
                    Total cost:
                  </Text>
                  <Text style={[commonStyles.h4, { color: "#fbbf24" }]}>
                    {selectedReward.coinCost * (parseInt(quantity, 10) || 1)} coins
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={handlePurchase}
                  disabled={purchaseReward.isPending}
                  style={[commonStyles.button, { marginBottom: 24 }]}
                >
                  <Text style={commonStyles.buttonText}>
                    {purchaseReward.isPending ? "Claiming..." : "Confirm claim"}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Reward Details Modal */}
      <Modal
        visible={showRewardDetailsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowRewardDetailsModal(false)}
      >
        <View style={commonStyles.container}>
          <View style={{
            padding: 24,
            borderBottomWidth: 1,
            borderBottomColor: "#273a3a",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <Text style={[commonStyles.h3]}>Reward details</Text>
            <TouchableOpacity onPress={() => setShowRewardDetailsModal(false)}>
              <Ionicons name="close" size={24} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ padding: 24 }}>
            {previewReward ? (
              <>
                {previewImages.length > 0 ? (
                  <View style={{ width: previewCarouselWidth, alignSelf: "center", marginBottom: 16 }}>
                    <ScrollView
                      horizontal
                      pagingEnabled
                      showsHorizontalScrollIndicator={false}
                      onMomentumScrollEnd={(event) => {
                        const nextIndex = Math.round(
                          event.nativeEvent.contentOffset.x / previewCarouselWidth,
                        );
                        setPreviewImageIndex(nextIndex);
                      }}
                    >
                      {previewImages.map((imageUri, index) => (
                        <Image
                          key={`${imageUri}-${index}`}
                          source={{ uri: imageUri }}
                          style={{
                            width: previewCarouselWidth,
                            aspectRatio: 1.2,
                            borderRadius: 12,
                            backgroundColor: "#0f2323",
                          }}
                          resizeMode="cover"
                        />
                      ))}
                    </ScrollView>
                    {previewImages.length > 1 ? (
                      <View style={{ flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 10 }}>
                        {previewImages.map((_, index) => (
                          <View
                            key={`dot-${index}`}
                            style={{
                              width: 7,
                              height: 7,
                              borderRadius: 999,
                              backgroundColor: index === previewImageIndex ? "#00ced1" : "#4b5563",
                            }}
                          />
                        ))}
                      </View>
                    ) : null}
                  </View>
                ) : null}

                <Text style={[commonStyles.h3, { marginBottom: 8 }]}>
                  {previewReward.name}
                </Text>
                <Text style={[commonStyles.textPrimary, { color: "#e5e7eb", lineHeight: 22, marginBottom: 20 }]}>
                  {previewReward.description}
                </Text>

                <View style={{
                  backgroundColor: "#1f2937",
                  padding: 16,
                  borderRadius: 12,
                  marginBottom: 20,
                  gap: 8,
                }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={commonStyles.textSecondary}>Price</Text>
                    <Text style={[commonStyles.textPrimary, { color: "#fbbf24" }]}>
                      {previewReward.coinCost} coins
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={commonStyles.textSecondary}>Availability</Text>
                    <Text style={[commonStyles.textPrimary, {
                      color: previewReward.isOutOfStock ? "#ef4444" : "#10b981",
                    }]}>
                      {previewReward.isOutOfStock
                        ? "Sold out"
                        : `${previewReward.availableQuantity ?? 0} pcs.`}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => {
                    setShowRewardDetailsModal(false);
                    openPurchaseModal(previewReward);
                  }}
                  disabled={!previewReward.canAfford || !previewReward.isEligibleToBuy || previewReward.isOutOfStock}
                  style={[
                    commonStyles.button,
                    {
                      backgroundColor:
                        previewReward.canAfford &&
                        previewReward.isEligibleToBuy &&
                        !previewReward.isOutOfStock
                          ? "#00ced1"
                          : "#374151",
                      opacity:
                        previewReward.canAfford &&
                        previewReward.isEligibleToBuy &&
                        !previewReward.isOutOfStock
                          ? 1
                          : 0.5,
                      marginBottom: 24,
                    },
                  ]}
                >
                  <Text style={commonStyles.buttonText}>
                    {previewReward.isOutOfStock
                      ? "Sold out"
                      : !previewReward.isEligibleToBuy
                        ? "Only group leader"
                        : !previewReward.canAfford
                          ? "Not enough coins"
                          : "Claim reward"}
                  </Text>
                </TouchableOpacity>
              </>
            ) : null}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
