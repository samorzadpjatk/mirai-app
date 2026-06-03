import { View, Text, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { commonStyles } from "~/styles/commonStyles";
import {
  getRewardImages,
  getRewardBorderColor,
  getRewardShadowProps,
  getRewardButtonState,
  getRewardAvailabilityText,
  getRewardAvailabilityColor,
} from "./RewardsView";
import type { RewardListItem } from "./types";

interface Props {
  reward: RewardListItem;
  justRefreshed: boolean;
  isTripPast: boolean;
  onPress: (reward: RewardListItem) => void;
  onPurchasePress: (reward: RewardListItem) => void;
}

export default function RewardCard({
  reward,
  justRefreshed,
  isTripPast,
  onPress,
  onPurchasePress,
}: Props) {
  const rewardImages = getRewardImages(reward);
  const rewardPrimaryImage = rewardImages[0] ?? null;
  const buttonState = getRewardButtonState(
    reward.canAfford,
    reward.isEligibleToBuy,
    reward.isOutOfStock,
    isTripPast,
  );

  return (
    <View
      testID={`reward-card-${reward.id}`}
      style={{
        width: "48%",
        backgroundColor: "#0f2323",
        borderWidth: 2,
        borderColor: getRewardBorderColor(justRefreshed, reward.isOutOfStock),
        borderRadius: 12,
        padding: 16,
        ...getRewardShadowProps(justRefreshed),
      }}
    >
      <TouchableOpacity activeOpacity={0.85} onPress={() => onPress(reward)}>
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

        <View style={{ marginBottom: 12 }}>
          <Text style={[commonStyles.h4, { marginBottom: 4 }]}>{reward.name}</Text>
          <Text
            numberOfLines={3}
            ellipsizeMode="tail"
            style={[commonStyles.textSecondary, { color: "#9ca3af", marginBottom: 6 }]}
          >
            {reward.description}
          </Text>
          <Text
            style={[
              commonStyles.textSecondary,
              { color: "#00ced1", fontSize: 11, marginBottom: 8 },
            ]}
          >
            Tap to read full description
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
                    { color: "#fbbf24", fontSize: 12, lineHeight: 14 },
                  ]}
                >
                  {reward.coinCost} coins
                </Text>
                {reward.originalCoinCost && (
                  <Text
                    style={[
                      commonStyles.textSecondary,
                      { color: "#9ca3af", fontSize: 10, lineHeight: 12 },
                    ]}
                  >
                    {reward.originalCoinCost}% of total points
                  </Text>
                )}
              </View>
            </View>

            <Text
              style={[
                commonStyles.textPrimary,
                {
                  color: getRewardAvailabilityColor(reward.isOutOfStock),
                  fontWeight: "600",
                },
              ]}
            >
              {getRewardAvailabilityText(reward.isOutOfStock, reward.availableQuantity)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        testID={`purchase-button-${reward.id}`}
        onPress={() => onPurchasePress(reward)}
        disabled={buttonState.disabled}
        style={[
          commonStyles.button,
          {
            backgroundColor: buttonState.backgroundColor,
            opacity: buttonState.opacity,
          },
        ]}
      >
        <Text style={commonStyles.buttonText}>{buttonState.text}</Text>
      </TouchableOpacity>
    </View>
  );
}
