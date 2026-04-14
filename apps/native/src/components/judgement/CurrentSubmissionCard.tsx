import { type ViewStyle } from "react-native";
import Animated, { type AnimatedStyle } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { XStack, YStack } from "tamagui";
import { type Submission } from "~/stores/judgement";
import { formatDate, getInitials } from "~/utils/validation";
import { SubmissionAssetPreview } from "~/components/judgement/SubmissionAssetPreview";
import { Text, colorTokens } from "@mirai-app/ui";

const CurrentSubmissionCard = ({
  submission,
  maxCardHeight,
  cardStyle,
  approveStampStyle,
  rejectStampStyle,
}: {
  submission: Submission;
  maxCardHeight: number;
  cardStyle: AnimatedStyle<ViewStyle>;
  approveStampStyle: AnimatedStyle<ViewStyle>;
  rejectStampStyle: AnimatedStyle<ViewStyle>;
}) => {
  return (
    <Animated.View
      style={[
        {
          backgroundColor: colorTokens.cardDark,
          borderRadius: 16,
          padding: 24,
          borderWidth: 1,
          borderColor: colorTokens.borderWhite5,
          overflow: "hidden",
          maxHeight: maxCardHeight,
        },
        cardStyle,
      ]}
    >
      {/* Approve Stamp */}
      <Animated.View
        style={[
          {
            position: "absolute",
            top: 40,
            right: 20,
            paddingVertical: 8,
            paddingHorizontal: 24,
            borderWidth: 4,
            borderRadius: 8,
            borderColor: colorTokens.success,
            transform: [{ rotate: "-15deg" }],
            opacity: 0.9,
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
          },
          approveStampStyle,
        ]}
      >
        <Ionicons name="checkmark" size={18} color={colorTokens.primary} />
        <Text
          fontSize={24}
          fontWeight="bold"
          color={colorTokens.success}
          textTransform="uppercase"
          letterSpacing={2}
        >
          APPROVE
        </Text>
      </Animated.View>

      {/* Reject Stamp */}
      <Animated.View
        style={[
          {
            position: "absolute",
            top: 40,
            left: 20,
            paddingVertical: 8,
            paddingHorizontal: 24,
            borderWidth: 4,
            borderRadius: 8,
            borderColor: colorTokens.danger,
            transform: [{ rotate: "-15deg" }],
            opacity: 0.9,
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
          },
          rejectStampStyle,
        ]}
      >
        <Ionicons name="close" size={18} color={colorTokens.red400} />
        <Text
          fontSize={24}
          fontWeight="bold"
          color={colorTokens.danger}
          textTransform="uppercase"
          letterSpacing={2}
        >
          REJECT
        </Text>
      </Animated.View>

      <XStack
        alignItems="center"
        justifyContent="space-between"
        marginBottom="$md"
      >
        <YStack
          width={40}
          height={40}
          borderRadius={20}
          backgroundColor={colorTokens.primaryOpacity10}
          alignItems="center"
          justifyContent="center"
          overflow="hidden"
        >
          {submission.group.image ? (
            <Image
              source={{ uri: submission.group.image }}
              style={{ width: 40, height: 40, borderRadius: 20 }}
              contentFit="cover"
            />
          ) : (
            <Text variant="h5" color="primary">
              {getInitials(submission.group.name)}
            </Text>
          )}
        </YStack>
        <XStack alignItems="center" gap="$sm">
          <Text variant="h5" color="default">
            {submission.group.name}
          </Text>
          <Text variant="caption" color="muted">
            Submitted {formatDate(submission.createdAt)}
          </Text>
        </XStack>
      </XStack>

      <SubmissionAssetPreview submission={submission} />

      {submission.textContent && submission.textContent.trim().length > 0 && (
        <YStack marginTop="$md">
          <Text variant="body" color="default" numberOfLines={6}>
            {submission.textContent}
          </Text>
        </YStack>
      )}

      {(submission.latitude !== null || submission.longitude !== null) && (
        <XStack alignItems="center" gap="$sm" marginTop="$md">
          <Ionicons name="location" size={16} color={colorTokens.primary} />
          <Text variant="bodySmall" color="muted">
            {submission.latitude?.toFixed(5) ?? "—"},{" "}
            {submission.longitude?.toFixed(5) ?? "—"}
          </Text>
        </XStack>
      )}
    </Animated.View>
  );
};

export { CurrentSubmissionCard };
