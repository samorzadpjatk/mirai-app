import { View, Text, ScrollView, TouchableOpacity, Image, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { commonStyles } from "~/styles/commonStyles";
import {
  getRewardAvailabilityColor,
  getRewardAvailabilityText,
  getRewardButtonState,
} from "./RewardsView";
import type { RewardListItem } from "./types";

interface Props {
  visible: boolean;
  reward: RewardListItem | null;
  images: string[];
  carouselWidth: number;
  imageIndex: number;
  onClose: () => void;
  onPurchase: (reward: RewardListItem) => void;
  onImageIndexChange: (index: number) => void;
  isTripPast: boolean;
}

export default function RewardDetailsModal({
  visible,
  reward,
  images,
  carouselWidth,
  imageIndex,
  onClose,
  onPurchase,
  onImageIndexChange,
  isTripPast,
}: Props) {
  if (!reward) return null;

  const buttonState = getRewardButtonState(
    reward.canAfford,
    reward.isEligibleToBuy,
    reward.isOutOfStock,
    isTripPast,
  );

  return (
    <Modal
      testID="reward-details-modal"
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
          <Text style={[commonStyles.h3]}>Reward details</Text>
          <TouchableOpacity testID="close-details-modal" onPress={onClose}>
            <Ionicons name="close" size={24} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        <ScrollView style={{ padding: 24 }}>
          {images.length > 0 ? (
            <View style={{ width: carouselWidth, alignSelf: "center", marginBottom: 16 }}>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(event) => {
                  const nextIndex = Math.round(event.nativeEvent.contentOffset.x / carouselWidth);
                  onImageIndexChange(nextIndex);
                }}
              >
                {images.map((imageUri, index) => (
                  <Image
                    key={`${imageUri}-${index}`}
                    source={{ uri: imageUri }}
                    style={{
                      width: carouselWidth,
                      aspectRatio: 1.2,
                      borderRadius: 12,
                      backgroundColor: "#0f2323",
                    }}
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>
              {images.length > 1 ? (
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "center",
                    gap: 6,
                    marginTop: 10,
                  }}
                >
                  {images.map((_, index) => (
                    <View
                      key={`dot-${index}`}
                      testID={`image-dot-${index}`}
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: 999,
                        backgroundColor: index === imageIndex ? "#00ced1" : "#4b5563",
                      }}
                    />
                  ))}
                </View>
              ) : null}
            </View>
          ) : null}

          <Text style={[commonStyles.h3, { marginBottom: 8 }]}>{reward.name}</Text>
          <Text
            style={[
              commonStyles.textPrimary,
              { color: "#e5e7eb", lineHeight: 22, marginBottom: 20 },
            ]}
          >
            {reward.description}
          </Text>

          <View
            style={{
              backgroundColor: "#1f2937",
              padding: 16,
              borderRadius: 12,
              marginBottom: 20,
              gap: 8,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text style={commonStyles.textSecondary}>Price</Text>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={[commonStyles.textPrimary, { color: "#fbbf24" }]}>
                  {reward.coinCost} coins
                </Text>
                {reward.originalCoinCost && (
                  <Text style={[commonStyles.textSecondary, { color: "#9ca3af", fontSize: 11 }]}>
                    {reward.originalCoinCost}% of total points
                  </Text>
                )}
              </View>
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text style={commonStyles.textSecondary}>Availability</Text>
              <Text
                style={[
                  commonStyles.textPrimary,
                  {
                    color: getRewardAvailabilityColor(reward.isOutOfStock),
                  },
                ]}
              >
                {getRewardAvailabilityText(reward.isOutOfStock, reward.availableQuantity)}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            testID="details-purchase-button"
            onPress={() => {
              onClose();
              onPurchase(reward);
            }}
            disabled={buttonState.disabled}
            style={[
              commonStyles.button,
              {
                backgroundColor: buttonState.backgroundColor,
                opacity: buttonState.opacity,
                marginBottom: 24,
              },
            ]}
          >
            <Text style={commonStyles.buttonText}>{buttonState.text}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}
