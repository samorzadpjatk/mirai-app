import { Ionicons } from "@expo/vector-icons";
import { Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { commonStyles } from "~/styles/commonStyles";
import { getTotalCost } from "./RewardsView";
import type { RewardListItem } from "./types";

interface Props {
  visible: boolean;
  reward: RewardListItem | null;
  quantity: string;
  onClose: () => void;
  onQuantityChange: (value: string) => void;
  onConfirm: () => void;
  isPending: boolean;
}

export default function RewardPurchaseModal({
  visible,
  reward,
  quantity,
  onClose,
  onQuantityChange,
  onConfirm,
  isPending,
}: Props) {
  return (
    <Modal
      testID="purchase-modal"
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={commonStyles.container}>
        <View
          style={{
            padding: 24,
            borderBottomWidth: 1,
            borderBottomColor: "#273a3a",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text style={[commonStyles.h3]}>Claim reward</Text>
          <TouchableOpacity testID="close-purchase-modal" onPress={onClose}>
            <Ionicons name="close" size={24} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        <ScrollView style={{ padding: 24 }}>
          {reward && (
            <>
              <View style={{ marginBottom: 20 }}>
                <Text style={[commonStyles.h4, { marginBottom: 8 }]}>{reward.name}</Text>
                <Text style={[commonStyles.textSecondary, { color: "#9ca3af", marginBottom: 16 }]}>
                  {reward.description}
                </Text>

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Ionicons name="cash" size={16} color="#fbbf24" />
                    <View style={{ alignItems: "flex-start" }}>
                      <Text
                        style={[
                          commonStyles.textPrimary,
                          { color: "#fbbf24", fontSize: 14, lineHeight: 16 },
                        ]}
                      >
                        {reward.coinCost} coins / item
                      </Text>
                      {reward.originalCoinCost && (
                        <Text
                          style={[
                            commonStyles.textSecondary,
                            { color: "#9ca3af", fontSize: 11, lineHeight: 13 },
                          ]}
                        >
                          {reward.originalCoinCost}% of total points
                        </Text>
                      )}
                    </View>
                  </View>

                  <Text style={[commonStyles.textPrimary, { color: "#10b981" }]}>
                    Available: {reward.availableQuantity} pcs.
                  </Text>
                </View>
              </View>

              <View style={{ marginBottom: 20 }}>
                <Text style={[commonStyles.textSecondary, { marginBottom: 8 }]}>Quantity</Text>
                <TextInput
                  testID="quantity-input"
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
                  onChangeText={onQuantityChange}
                  keyboardType="numeric"
                />
              </View>

              <View
                style={{
                  backgroundColor: "#1f2937",
                  padding: 16,
                  borderRadius: 12,
                  marginBottom: 24,
                }}
              >
                <Text style={[commonStyles.textSecondary, { marginBottom: 8 }]}>Total cost:</Text>
                <Text style={[commonStyles.h4, { color: "#fbbf24" }]}>
                  {getTotalCost(reward.coinCost, quantity)} coins
                </Text>
              </View>

              <TouchableOpacity
                testID="confirm-purchase"
                onPress={onConfirm}
                disabled={isPending}
                style={[commonStyles.button, { marginBottom: 24 }]}
              >
                <Text style={commonStyles.buttonText}>
                  {isPending ? "Claiming..." : "Confirm claim"}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}
