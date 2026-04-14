import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { XStack, YStack } from "tamagui";
import { Text, colorTokens } from "@mirai-app/ui";

const ActionBar = ({
  disabled,
  onReject,
  onApprove,
}: {
  disabled: boolean;
  onReject: () => void;
  onApprove: () => void;
}) => {
  return (
    <XStack
      alignItems="center"
      justifyContent="center"
      gap="$xl"
      paddingVertical="$lg"
      paddingHorizontal="$lg"
    >
      <TouchableOpacity onPress={onReject} disabled={disabled}>
        <YStack
          width={64}
          height={64}
          borderRadius={32}
          alignItems="center"
          justifyContent="center"
          backgroundColor={colorTokens.dangerOpacity15}
          borderWidth={2}
          borderColor={colorTokens.danger}
          opacity={disabled ? 0.5 : 1}
        >
          <Ionicons name="close" size={28} color={colorTokens.white} />
        </YStack>
      </TouchableOpacity>

      <XStack alignItems="center" gap="$xs" opacity={0.7}>
        <Ionicons
          name="swap-horizontal"
          size={16}
          color={colorTokens.textSecondary}
        />
        <Text variant="bodySmall" color="muted">
          Swipe to decide
        </Text>
      </XStack>

      <TouchableOpacity onPress={onApprove} disabled={disabled}>
        <YStack
          width={64}
          height={64}
          borderRadius={32}
          alignItems="center"
          justifyContent="center"
          backgroundColor={colorTokens.successOpacity12}
          borderWidth={2}
          borderColor={colorTokens.success}
          opacity={disabled ? 0.5 : 1}
        >
          <Ionicons
            name="checkmark"
            size={28}
            color={colorTokens.backgroundDark}
          />
        </YStack>
      </TouchableOpacity>
    </XStack>
  );
};

export { ActionBar };
