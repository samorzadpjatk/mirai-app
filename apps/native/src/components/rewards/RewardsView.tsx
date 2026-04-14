import React, { useMemo, useState } from "react";
import {
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
  TextInput,
  ActivityIndicator,
  useWindowDimensions,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useClient } from "urql";
import { useRewards, usePurchaseReward } from "~/hooks/rewards";
import { useMyGroup } from "~/hooks/groups";
import { useTripDetails } from "~/hooks/trips";
import type { RewardListItem } from "./types";
import { clientLogger } from "@mirai-app/shared";
import { YStack, XStack, Text, Button, Card } from "@mirai-app/ui";

interface Props {
  tripId: string;
}

// Inline GraphQL document for cache invalidation
const GroupDocument = `
  query GetGroup($tripId: String!) {
    myGroup(tripId: $tripId) {
      id
      name
      coins
    }
  }
`;

const RewardsDocument = `
  query GetRewards($tripId: String!) {
    rewards(tripId: $tripId) {
      id
      name
      description
      coinCost
      originalCoinCost
      availableQuantity
      isOutOfStock
      canAfford
      isEligibleToBuy
      image
      images
      signedImageUrl
      signedImageUrls
    }
  }
`;

export default function RewardsView({ tripId }: Props) {
  const router = useRouter();
  const client = useClient();
  const { data: rewards, isLoading, error, refetch } = useRewards(tripId);
  const { group: currentUserGroup } = useMyGroup(tripId);
  const { isTripPast } = useTripDetails(tripId);
  const purchaseReward = usePurchaseReward();
  const { width: viewportWidth } = useWindowDimensions();
  const [selectedReward, setSelectedReward] = useState<RewardListItem | null>(
    null,
  );
  const [previewReward, setPreviewReward] = useState<RewardListItem | null>(
    null,
  );
  const [quantity, setQuantity] = useState("1");
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showRewardDetailsModal, setShowRewardDetailsModal] = useState(false);
  const [previewImageIndex, setPreviewImageIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [justRefreshed, setJustRefreshed] = useState(false);

  const safeRewards: RewardListItem[] = useMemo(() => {
    // The useRewards hook returns data directly, not wrapped in an object
    const data = rewards as RewardListItem[] | undefined;

    if (Array.isArray(data)) return data;
    return [];
  }, [rewards]);

  const groupCoins = currentUserGroup?.coins ?? 0;
  const previewCarouselWidth = Math.max(260, viewportWidth - 48);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Refresh rewards data to get updated dynamic pricing
      await refetch();

      // Also refresh group data to get updated coin balance using urql client.invalidate
      await client.invalidate(GroupDocument);

      // Invalidate any reward-related queries to ensure fresh data
      await client.invalidate(RewardsDocument);

      // Update last refresh time and trigger animation
      setLastRefreshTime(new Date());
      setJustRefreshed(true);

      // Remove the animation indicator after 2 seconds
      setTimeout(() => setJustRefreshed(false), 2000);

      // Show subtle success message
      Alert.alert("Updated", "Reward pricing has been refreshed", [
        { text: "OK", style: "default" },
      ]);
    } catch (error) {
      clientLogger.error("Failed to refresh rewards:", { error });
      Alert.alert("Error", "Failed to refresh rewards");
    } finally {
      setRefreshing(false);
    }
  };

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
      <YStack
        flex={1}
        backgroundColor="#17181c"
        justifyContent="center"
        alignItems="center"
      >
        <ActivityIndicator size="large" color="#00ced1" />
        <Text color="white" marginTop="$4">
          Loading rewards...
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
        <Ionicons name="alert-circle" size={48} color="#ef4444" />
        <Text color="#9ca3af" marginTop="$4" textAlign="center">
          Failed to load rewards
        </Text>
      </YStack>
    );
  }

  if (!safeRewards || safeRewards.length === 0) {
    return (
      <YStack
        flex={1}
        backgroundColor="#17181c"
        justifyContent="center"
        alignItems="center"
      >
        <Ionicons name="gift" size={48} color="#6b7280" />
        <Text color="#9ca3af" marginTop="$4" textAlign="center">
          No rewards available for this trip
        </Text>
      </YStack>
    );
  }

  return (
    <YStack flex={1} backgroundColor="#17181c">
      {/* Header with group coins */}
      <YStack padding="$4">
        <XStack
          alignItems="center"
          justifyContent="space-between"
          marginBottom="$2"
        >
          <XStack alignItems="center" gap="$2">
            <Text fontSize="$6" fontWeight="bold" color="white">
              Rewards
            </Text>
            {refreshing && <ActivityIndicator size="small" color="#00ced1" />}
            {lastRefreshTime && !refreshing && (
              <XStack alignItems="center" gap="$1">
                <Ionicons name="refresh" size={14} color="#10b981" />
                <Text fontSize={11} color="#10b981">
                  Updated{" "}
                  {lastRefreshTime.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </XStack>
            )}
          </XStack>
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/trips/rewards/history",
                params: { tripId },
              })
            }
          >
            <XStack
              alignItems="center"
              gap="$2"
              borderWidth={1}
              borderColor="#273a3a"
              borderRadius={999}
              paddingHorizontal="$3"
              paddingVertical={6}
            >
              <Ionicons name="time-outline" size={14} color="#9ca3af" />
              <Text fontSize={12} color="#9ca3af">
                History
              </Text>
            </XStack>
          </TouchableOpacity>
        </XStack>

        {currentUserGroup && (
          <XStack alignItems="center" gap="$2">
            <Ionicons name="people" size={16} color="#00ced1" />
            <Text color="#00ced1">{currentUserGroup.name}</Text>
            <XStack alignItems="center" gap="$1">
              <Ionicons name="cash" size={16} color="#fbbf24" />
              <Text color="#fbbf24">{groupCoins} coins</Text>
            </XStack>
          </XStack>
        )}
      </YStack>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#00ced1"
            colors={["#00ced1"]}
          />
        }
      >
        <XStack flexWrap="wrap" justifyContent="space-between" rowGap={16}>
          {safeRewards.map((reward) => {
            const rewardImages = getRewardImages(reward);
            const rewardPrimaryImage = rewardImages[0] ?? null;

            return (
              <YStack
                key={reward.id}
                width="48%"
                backgroundColor="#0f2323"
                borderWidth={2}
                borderColor={
                  justRefreshed && !reward.isOutOfStock
                    ? "#10b981"
                    : reward.isOutOfStock
                      ? "#ef4444"
                      : "#273a3a"
                }
                borderRadius={12}
                padding={16}
                style={{
                  shadowColor: justRefreshed ? "#10b981" : "transparent",
                  shadowOffset: justRefreshed
                    ? { width: 0, height: 0 }
                    : undefined,
                  shadowOpacity: justRefreshed ? 0.3 : 0,
                  shadowRadius: justRefreshed ? 4 : 0,
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
                    <YStack
                      width="100%"
                      aspectRatio={1}
                      borderRadius={8}
                      marginBottom={12}
                      borderWidth={1}
                      borderColor="#273a3a"
                      backgroundColor="#0b1a1a"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Ionicons name="gift-outline" size={36} color="#6b7280" />
                    </YStack>
                  )}

                  {/* Reward Info */}
                  <YStack marginBottom={12}>
                    <Text
                      fontSize="$4"
                      fontWeight="bold"
                      color="white"
                      marginBottom="$1"
                    >
                      {reward.name}
                    </Text>
                    <Text
                      numberOfLines={3}
                      ellipsizeMode="tail"
                      fontSize="$3"
                      color="#9ca3af"
                      marginBottom={6}
                    >
                      {reward.description}
                    </Text>
                    <Text fontSize={11} color="#00ced1" marginBottom="$2">
                      Tap to read full description
                    </Text>

                    <XStack justifyContent="space-between" alignItems="center">
                      <XStack alignItems="center" gap="$1">
                        <Ionicons name="cash" size={16} color="#fbbf24" />
                        <YStack alignItems="flex-start">
                          <Text fontSize={12} color="#fbbf24" lineHeight={14}>
                            {reward.coinCost} coins
                          </Text>
                          {reward.originalCoinCost && (
                            <Text fontSize={10} color="#9ca3af" lineHeight={12}>
                              {reward.originalCoinCost}% of total points
                            </Text>
                          )}
                        </YStack>
                      </XStack>

                      <Text
                        fontWeight="600"
                        color={reward.isOutOfStock ? "#ef4444" : "#10b981"}
                      >
                        {reward.isOutOfStock
                          ? "Sold out"
                          : `${reward.availableQuantity ?? 0} pcs.`}
                      </Text>
                    </XStack>
                  </YStack>
                </TouchableOpacity>

                {/* Purchase Button */}
                <Button
                  
                  onPress={() => openPurchaseModal(reward)}
                  disabled={
                    !reward.canAfford ||
                    !reward.isEligibleToBuy ||
                    reward.isOutOfStock ||
                    isTripPast
                  }
                  backgroundColor={
                    reward.canAfford &&
                    reward.isEligibleToBuy &&
                    !reward.isOutOfStock &&
                    !isTripPast
                      ? "#00ced1"
                      : "#374151"
                  }
                  opacity={
                    reward.canAfford &&
                    reward.isEligibleToBuy &&
                    !reward.isOutOfStock &&
                    !isTripPast
                      ? 1
                      : 0.5
                  }
                >
                  {isTripPast
                    ? "Trip ended"
                    : reward.isOutOfStock
                      ? "Sold out"
                      : !reward.isEligibleToBuy
                        ? "Only group leader"
                        : !reward.canAfford
                          ? "Not enough coins"
                          : "Claim reward"}
                </Button>
              </YStack>
            );
          })}
        </XStack>
      </ScrollView>

      {/* Purchase Modal */}
      <Modal
        visible={showPurchaseModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPurchaseModal(false)}
      >
        <YStack flex={1} backgroundColor="#17181c">
          <XStack
            padding="$6"
            borderBottomWidth={1}
            borderBottomColor="#273a3a"
            justifyContent="space-between"
            alignItems="center"
          >
            <Text fontSize="$6" fontWeight="bold" color="white">
              Claim reward
            </Text>
            <TouchableOpacity onPress={() => setShowPurchaseModal(false)}>
              <Ionicons name="close" size={24} color="#9ca3af" />
            </TouchableOpacity>
          </XStack>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 24 }}
          >
            {selectedReward && (
              <>
                <YStack marginBottom="$5">
                  <Text
                    fontSize="$5"
                    fontWeight="bold"
                    color="white"
                    marginBottom="$2"
                  >
                    {selectedReward.name}
                  </Text>
                  <Text fontSize="$3" color="#9ca3af" marginBottom="$4">
                    {selectedReward.description}
                  </Text>

                  <XStack justifyContent="space-between" alignItems="center">
                    <XStack alignItems="center" gap="$1">
                      <Ionicons name="cash" size={16} color="#fbbf24" />
                      <YStack alignItems="flex-start">
                        <Text fontSize="$4" color="#fbbf24" lineHeight={16}>
                          {selectedReward.coinCost} coins / item
                        </Text>
                        {selectedReward.originalCoinCost && (
                          <Text fontSize={11} color="#9ca3af" lineHeight={13}>
                            {selectedReward.originalCoinCost}% of total points
                          </Text>
                        )}
                      </YStack>
                    </XStack>

                    <Text color="#10b981">
                      Available: {selectedReward.availableQuantity} pcs.
                    </Text>
                  </XStack>
                </YStack>

                <YStack marginBottom="$5">
                  <Text fontSize="$3" color="#9ca3af" marginBottom="$2">
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
                </YStack>

                <Card
                  backgroundColor="#1f2937"
                  padding="$4"
                  borderRadius="$3"
                  marginBottom="$6"
                >
                  <Text fontSize="$3" color="#9ca3af" marginBottom="$2">
                    Total cost:
                  </Text>
                  <Text fontSize="$6" fontWeight="bold" color="#fbbf24">
                    {selectedReward.coinCost * (parseInt(quantity, 10) || 1)}{" "}
                    coins
                  </Text>
                </Card>

                <Button
                  
                  onPress={handlePurchase}
                  disabled={purchaseReward.isPending}
                  
                  marginBottom="$6"
                >
                  {purchaseReward.isPending ? "Claiming..." : "Confirm claim"}
                </Button>
              </>
            )}
          </ScrollView>
        </YStack>
      </Modal>

      {/* Reward Details Modal */}
      <Modal
        visible={showRewardDetailsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowRewardDetailsModal(false)}
      >
        <YStack flex={1} backgroundColor="#17181c">
          <XStack
            padding="$6"
            borderBottomWidth={1}
            borderBottomColor="#273a3a"
            justifyContent="space-between"
            alignItems="center"
          >
            <Text fontSize="$6" fontWeight="bold" color="white">
              Reward details
            </Text>
            <TouchableOpacity onPress={() => setShowRewardDetailsModal(false)}>
              <Ionicons name="close" size={24} color="#9ca3af" />
            </TouchableOpacity>
          </XStack>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 24 }}
          >
            {previewReward ? (
              <>
                {previewImages.length > 0 ? (
                  <YStack
                    width={previewCarouselWidth}
                    alignSelf="center"
                    marginBottom="$4"
                  >
                    <ScrollView
                      horizontal
                      pagingEnabled
                      showsHorizontalScrollIndicator={false}
                      onMomentumScrollEnd={(event) => {
                        const nextIndex = Math.round(
                          event.nativeEvent.contentOffset.x /
                            previewCarouselWidth,
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
                      <XStack
                        justifyContent="center"
                        gap={6}
                        marginTop={10}
                      >
                        {previewImages.map((_, index) => (
                          <YStack
                            key={`dot-${index}`}
                            width={7}
                            height={7}
                            borderRadius={999}
                            backgroundColor={
                              index === previewImageIndex
                                ? "#00ced1"
                                : "#4b5563"
                            }
                          />
                        ))}
                      </XStack>
                    ) : null}
                  </YStack>
                ) : null}

                <Text
                  fontSize="$6"
                  fontWeight="bold"
                  color="white"
                  marginBottom="$2"
                >
                  {previewReward.name}
                </Text>
                <Text
                  fontSize="$4"
                  color="#d1d5db"
                  lineHeight={22}
                  marginBottom="$5"
                >
                  {previewReward.description}
                </Text>

                <Card
                  backgroundColor="#1f2937"
                  padding="$4"
                  borderRadius="$3"
                  marginBottom="$5"
                  gap="$2"
                >
                  <XStack justifyContent="space-between" alignItems="center">
                    <Text fontSize="$3" color="#9ca3af">
                      Price
                    </Text>
                    <YStack alignItems="flex-end">
                      <Text fontSize="$4" color="#fbbf24">
                        {previewReward.coinCost} coins
                      </Text>
                      {previewReward.originalCoinCost && (
                        <Text fontSize={11} color="#9ca3af">
                          {previewReward.originalCoinCost}% of total points
                        </Text>
                      )}
                    </YStack>
                  </XStack>
                  <XStack justifyContent="space-between" alignItems="center">
                    <Text fontSize="$3" color="#9ca3af">
                      Availability
                    </Text>
                    <Text
                      fontSize="$4"
                      color={previewReward.isOutOfStock ? "#ef4444" : "#10b981"}
                    >
                      {previewReward.isOutOfStock
                        ? "Sold out"
                        : `${previewReward.availableQuantity ?? 0} pcs.`}
                    </Text>
                  </XStack>
                </Card>

                <Button
                  
                  onPress={() => {
                    setShowRewardDetailsModal(false);
                    openPurchaseModal(previewReward);
                  }}
                  disabled={
                    !previewReward.canAfford ||
                    !previewReward.isEligibleToBuy ||
                    previewReward.isOutOfStock ||
                    isTripPast
                  }
                  backgroundColor={
                    previewReward.canAfford &&
                    previewReward.isEligibleToBuy &&
                    !previewReward.isOutOfStock &&
                    !isTripPast
                      ? "#00ced1"
                      : "#374151"
                  }
                  opacity={
                    previewReward.canAfford &&
                    previewReward.isEligibleToBuy &&
                    !previewReward.isOutOfStock &&
                    !isTripPast
                      ? 1
                      : 0.5
                  }
                  marginBottom="$6"
                >
                  {isTripPast
                    ? "Trip ended"
                    : previewReward.isOutOfStock
                      ? "Sold out"
                      : !previewReward.isEligibleToBuy
                        ? "Only group leader"
                        : !previewReward.canAfford
                          ? "Not enough coins"
                          : "Claim reward"}
                </Button>
              </>
            ) : null}
          </ScrollView>
        </YStack>
      </Modal>
    </YStack>
  );
}
