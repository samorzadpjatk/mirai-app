import { Ionicons } from "@expo/vector-icons";
import { Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { colors, commonStyles } from "~/styles";
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
            borderBottomColor: colors.cardBorder,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text style={[commonStyles.h3]}>Claim reward</Text>
          <TouchableOpacity testID="close-purchase-modal" onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={{ padding: 24 }}>
          {reward && (
            <>
              <View style={{ marginBottom: 20 }}>
                <Text style={[commonStyles.h4, { marginBottom: 8 }]}>{reward.name}</Text>
                <Text
                  style={[
                    commonStyles.textSecondary,
                    { color: colors.textSecondary, marginBottom: 16 },
                  ]}
                >
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
                    <Ionicons name="cash" size={16} color={colors.amber400} />
                    <View style={{ alignItems: "flex-start" }}>
                      <Text
                        style={[
                          commonStyles.textPrimary,
                          { color: colors.amber400, fontSize: 14, lineHeight: 16 },
                        ]}
                      >
                        {reward.coinCost} coins / item
                      </Text>
                      {reward.originalCoinCost && (
                        <Text
                          style={[
                            commonStyles.textSecondary,
                            { color: colors.textSecondary, fontSize: 11, lineHeight: 13 },
                          ]}
                        >
                          {reward.originalCoinCost}% of total points
                        </Text>
                      )}
                    </View>
                  </View>

                  <Text style={[commonStyles.textPrimary, { color: colors.statusCompleted }]}>
                    Available: {reward.availableQuantity} pcs.
                  </Text>
                </View>
              </View>

              <View style={{ marginBottom: 20 }}>
                <Text style={[commonStyles.textSecondary, { marginBottom: 8 }]}>Quantity</Text>
                <TextInput
                  testID="quantity-input"
                  style={{
                    backgroundColor: colors.cardBackground,
                    borderWidth: 1,
                    borderColor: colors.cardBorder,
                    borderRadius: 12,
                    padding: 12,
                    color: colors.white,
                  }}
                  placeholder="1"
                  placeholderTextColor={colors.gray500}
                  value={quantity}
                  onChangeText={onQuantityChange}
                  keyboardType="numeric"
                />
              </View>

              <View
                style={{
                  backgroundColor: colors.gray800,
                  padding: 16,
                  borderRadius: 12,
                  marginBottom: 24,
                }}
              >
                <Text style={[commonStyles.textSecondary, { marginBottom: 8 }]}>Total cost:</Text>
                <Text style={[commonStyles.h4, { color: colors.amber400 }]}>
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
