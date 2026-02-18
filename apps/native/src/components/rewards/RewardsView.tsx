import React, { useState } from "react";
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
import { useRewards, usePurchaseReward } from "~/hooks/rewards";
import { useGroups } from "~/hooks/groups";
import { commonStyles } from "~/styles/commonStyles";
import type { RewardListItem } from "./types";

interface Props {
  tripId: string;
}

export default function RewardsView({ tripId }: Props) {
  const { data: rewards, isLoading, error } = useRewards(tripId);
  const { data: groups } = useGroups(tripId);
  const purchaseReward = usePurchaseReward();
  const [selectedReward, setSelectedReward] = useState<RewardListItem | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  const userGroup = groups?.find(g => g.participants.some(p => p.role === "LEADER"));
  const groupCoins = userGroup?.coins || 0;

  const handlePurchase = async () => {
    if (!selectedReward || !quantity) return;

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty < 1) {
      Alert.alert("Błąd", "Podaj prawidłową ilość");
      return;
    }

    const totalCost = selectedReward.coinCost * qty;
    if (totalCost > groupCoins) {
      Alert.alert("Błąd", "Nie masz wystarczającej liczby monet");
      return;
    }

    try {
      await purchaseReward.mutateAsync({
        rewardId: selectedReward.id,
        quantity: qty,
      });
      
      Alert.alert("Sukces", `Zakupiono ${qty}x ${selectedReward.name}`);
      setShowPurchaseModal(false);
      setQuantity("1");
      setSelectedReward(null);
    } catch (error) {
      Alert.alert("Błąd", "Nie udało się zakupić nagrody");
    }
  };

  const openPurchaseModal = (reward: RewardListItem) => {
    if (!userGroup) {
      Alert.alert("Błąd", "Tylko lider grupy może zakupić nagrody");
      return;
    }
    setSelectedReward(reward);
    setShowPurchaseModal(true);
  };

  if (isLoading) {
    return (
      <View style={[commonStyles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#00ced1" />
                <Text style={[commonStyles.textSecondary, { marginTop: 16 }]}>Ładowanie nagród...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[commonStyles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Ionicons name="alert-circle" size={48} color="#ef4444" />
        <Text style={[commonStyles.textSecondary, { marginTop: 16, textAlign: "center" }]}>
          Nie udało się załadować nagród
        </Text>
      </View>
    );
  }

  if (!rewards || rewards.length === 0) {
    return (
      <View style={[commonStyles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Ionicons name="gift" size={48} color="#6b7280" />
        <Text style={[commonStyles.textSecondary, { marginTop: 16, textAlign: "center" }]}>
          Brak dostępnych nagród dla tej wycieczki
        </Text>
      </View>
    );
  }

  return (
    <View style={commonStyles.container}>
      {/* Header with group coins */}
      <View style={{
        backgroundColor: "#0f2323",
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#273a3a",
      }}>
        <Text style={[commonStyles.h3, { marginBottom: 8 }]}>Nagrody</Text>
        {userGroup && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Ionicons name="people" size={16} color="#00ced1" />
            <Text style={[commonStyles.textPrimary, { color: "#00ced1" }]}>
              {userGroup.name}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Ionicons name="cash" size={16} color="#fbbf24" />
              <Text style={[commonStyles.textPrimary, { color: "#fbbf24" }]}>
                {groupCoins} monet
              </Text>
            </View>
          </View>
        )}
      </View>

      <ScrollView style={{ flex: 1, padding: 16 }}>
        <View style={{ gap: 16 }}>
          {rewards.map((reward) => (
            <View
              key={reward.id}
              style={{
                backgroundColor: "#0f2323",
                borderWidth: 1,
                borderColor: reward.isOutOfStock ? "#ef4444" : "#273a3a",
                borderRadius: 12,
                padding: 16,
              }}
            >
              {/* Reward Image */}
              {reward.image && (
                <Image
                  source={{ uri: reward.image }}
                  style={{
                    width: "100%",
                    height: 120,
                    borderRadius: 8,
                    marginBottom: 12,
                  }}
                  resizeMode="cover"
                />
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
                      {reward.coinCost} monet
                    </Text>
                  </View>
                  
                  <Text style={[commonStyles.textPrimary, { 
                    color: reward.isOutOfStock ? "#ef4444" : "#10b981",
                    fontWeight: "600"
                  }]}>
                    {reward.isOutOfStock ? "Wyprzedane" : `${reward.availableQuantity} szt.`}
                  </Text>
                </View>
              </View>

              {/* Purchase Button */}
              <TouchableOpacity
                onPress={() => openPurchaseModal(reward)}
                disabled={!reward.canAfford || reward.isOutOfStock}
                style={[
                  commonStyles.button,
                  {
                    backgroundColor: reward.canAfford && !reward.isOutOfStock ? "#00ced1" : "#374151",
                    opacity: reward.canAfford && !reward.isOutOfStock ? 1 : 0.5,
                  }
                ]}
              >
                <Text style={commonStyles.buttonText}>
                  {reward.isOutOfStock ? "Wyprzedane" : 
                   !reward.canAfford ? "Brak monet" : 
                   "Kup nagrodę"}
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
            <Text style={[commonStyles.h3]}>Kup nagrodę</Text>
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
                        {selectedReward.coinCost} monet / sztuka
                      </Text>
                    </View>
                    
                    <Text style={[commonStyles.textPrimary, { color: "#10b981" }]}>
                      Dostępne: {selectedReward.availableQuantity} szt.
                    </Text>
                  </View>
                </View>

                <View style={{ marginBottom: 20 }}>
                  <Text style={[commonStyles.textSecondary, { marginBottom: 8 }]}>
                    Ilość
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
                    Całkowity koszt:
                  </Text>
                  <Text style={[commonStyles.h4, { color: "#fbbf24" }]}>
                    {selectedReward.coinCost * (parseInt(quantity) || 1)} monet
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={handlePurchase}
                  disabled={purchaseReward.isPending}
                  style={[commonStyles.button, { marginBottom: 24 }]}
                >
                  <Text style={commonStyles.buttonText}>
                    {purchaseReward.isPending ? "Kupowanie..." : "Potwierdź zakup"}
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
