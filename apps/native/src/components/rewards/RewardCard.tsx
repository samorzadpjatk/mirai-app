import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";
import { CachedImage } from "~/components/common/CachedImage";
import { WoodTexture } from "~/components/common/WoodTexture";
import { colors, commonStyles } from "~/styles";
import { useTripTheme } from "~/theme/TripThemeProvider";
import {
  getRewardAvailabilityColor,
  getRewardAvailabilityText,
  getRewardBorderColor,
  getRewardButtonState,
  getRewardImages,
  getRewardShadowProps,
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
  const { palette } = useTripTheme();
  const rewardImages = getRewardImages(reward);
  const rewardPrimaryImage = rewardImages[0] ?? null;
  const buttonState = getRewardButtonState(
    reward.canAfford,
    reward.isEligibleToBuy,
    reward.isOutOfStock,
    isTripPast,
    palette,
  );

  return (
    <View
      testID={`reward-card-${reward.id}`}
      style={{
        width: "100%",
        backgroundColor: colors.cardBackground,
        borderWidth: 2,
        borderColor: getRewardBorderColor(justRefreshed, reward.isOutOfStock),
        borderRadius: 12,
        padding: 16,
        ...getRewardShadowProps(justRefreshed),
      }}
    >
      <WoodTexture radius={12} />
      <TouchableOpacity activeOpacity={0.85} onPress={() => onPress(reward)}>
        {rewardPrimaryImage ? (
          <CachedImage
            source={{ uri: rewardPrimaryImage }}
            style={{
              width: "100%",
              aspectRatio: 1,
              borderRadius: 8,
              marginBottom: 12,
            }}
            contentFit="cover"
          />
        ) : (
          <View
            style={{
              width: "100%",
              aspectRatio: 1,
              borderRadius: 8,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: colors.cardBorder,
              backgroundColor: colors.inputBackground,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="gift-outline" size={36} color={colors.gray500} />
          </View>
        )}

        <View style={{ marginBottom: 12 }}>
          <Text style={[commonStyles.h4, { marginBottom: 4 }]}>{reward.name}</Text>
          <Text
            numberOfLines={3}
            ellipsizeMode="tail"
            style={[commonStyles.textSecondary, { color: colors.textSecondary, marginBottom: 6 }]}
          >
            {reward.description}
          </Text>
          <Text
            style={[
              commonStyles.textSecondary,
              { color: palette.primary, fontSize: 11, marginBottom: 8 },
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
              <Ionicons name="cash" size={16} color={colors.amber400} />
              <View style={{ alignItems: "flex-start" }}>
                <Text
                  style={[
                    commonStyles.textPrimary,
                    { color: colors.amber400, fontSize: 12, lineHeight: 14 },
                  ]}
                >
                  {reward.coinCost} coins
                </Text>
                {reward.originalCoinCost && (
                  <Text
                    style={[
                      commonStyles.textSecondary,
                      { color: colors.textSecondary, fontSize: 10, lineHeight: 12 },
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
