import { ActivityIndicator } from "react-native";
import { Button, Text, XStack } from "@mirai-app/ui";
import type { StyleProp, TextStyle, ViewStyle } from "react-native";

interface PrimaryLoadingButtonProps {
  label: string;
  isLoading: boolean;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function PrimaryLoadingButton({
  label,
  isLoading,
  onPress,
  disabled = false,
  style,
  textStyle,
}: PrimaryLoadingButtonProps) {
  const isDisabled = isLoading || disabled;

  return (
    <Button
      onPress={onPress}
      disabled={isDisabled}
      backgroundColor="$primary"
      paddingVertical="$lg"
      borderRadius="$xl"
      alignItems="center"
      justifyContent="center"
      pressStyle={{ scale: 0.98 }}
      style={style}
    >
      <XStack alignItems="center" justifyContent="center">
        {isLoading ? (
          <ActivityIndicator size="small" color="#17181c" />
        ) : (
          <Text
            fontSize="$base"
            fontWeight="700"
            color="$backgroundDark"
            style={textStyle}
          >
            {label}
          </Text>
        )}
      </XStack>
    </Button>
  );
}
