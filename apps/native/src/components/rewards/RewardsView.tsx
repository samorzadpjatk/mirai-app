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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@integral-2025-app/auth/client";
import { useRouter } from "expo-router";
import { useRewards, usePurchaseReward } from "~/hooks/rewards";
import { useGroups } from "~/hooks/groups";
import type { RewardListItem } from "./types";
import type { GroupListItem } from "../trips/groups/types";
import { commonStyles } from "~/styles/commonStyles";

interface Props {
  tripId: string;
}

export default function RewardsView({ tripId }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const { data: rewards, isLoading, error } = useRewards(tripId);
  const { groups } = useGroups(tripId);
  const purchaseReward = usePurchaseReward();
  const [selectedReward, setSelectedReward] = useState<RewardListItem | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  const safeRewards: RewardListItem[] = useMemo(() => {
    const data = rewards as
      | RewardListItem[]
      | { data?: RewardListItem[] }
      | undefined;

    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.data)) return data.data;
    return [];
  }, [rewards]);

  type RawGroup = Partial<GroupListItem> & {
    participants?: unknown[];
    coins?: number;
    organizer?: GroupListItem["organizer"];
    groups?: GroupListItem[];
  };

  const safeGroups: GroupListItem[] = useMemo(() => {
    const rawGroups = Array.isArray(groups)
      ? (groups as RawGroup[])
      : ((groups as { groups?: RawGroup[] } | undefined)?.groups ?? []);

    return rawGroups
      .filter((g): g is Required<Pick<RawGroup, 'id' | 'name' | 'code'>> & RawGroup => 
        g.id !== undefined && g.name !== undefined && g.code !== undefined
      )
      .map((g) => ({
        ...g,
        participantCount: g.participantCount ?? g.participants?.length ?? 0,
        coins: g.coins ?? 0,
        organizer: g.organizer ?? null,
      }));
  }, [groups]);

  const organizerGroup = useMemo(
    () => safeGroups.find((g) => g.organizer?.authUserId === user?.authUserId),
    [safeGroups, user?.authUserId],
  );
  const groupCoins = organizerGroup?.coins ?? 0;

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
    if (!organizerGroup) {
      Alert.alert("Error", "Only group leader can claim rewards");
      return;
    }
    setSelectedReward(reward);
    setShowPurchaseModal(true);
  };

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
        {organizerGroup && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Ionicons name="people" size={16} color="#00ced1" />
            <Text style={[commonStyles.textPrimary, { color: "#00ced1" }]}> 
              {organizerGroup.name}
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
          {safeRewards.map((reward) => (
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
              {/* Reward Image */}
              {(reward.signedImageUrl ?? reward.image) ? (
                <Image
                  source={{ uri: reward.signedImageUrl ?? reward.image ?? undefined }}
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
                <Text style={[commonStyles.textSecondary, { color: "#9ca3af", marginBottom: 8 }]}>
                  {reward.description}
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
          ))}
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
    </View>
  );
}
