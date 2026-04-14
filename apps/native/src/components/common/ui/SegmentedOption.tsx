import type { StyleProp, ViewStyle } from "react-native";
import { Button, Text } from "@mirai-app/ui";

interface SegmentedOptionProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

export function SegmentedOption({
  label,
  selected,
  onPress,
  style,
  disabled = false,
}: SegmentedOptionProps) {
  return (
    <Button
      onPress={onPress}
      disabled={disabled}
      chromeless
      flex={1}
      backgroundColor={selected ? "rgba(0, 206, 209, 0.1)" : "$backgroundDark"}
      borderRadius="$md"
      borderWidth={1}
      borderColor={selected ? "$primary" : "$borderDark"}
      paddingVertical="$sm"
      paddingHorizontal="$md"
      alignItems="center"
      opacity={disabled ? 0.5 : 1}
      style={style}
    >
      <Text
        fontSize="$sm"
        color={selected ? "$primary" : "$textSecondary"}
        fontWeight={selected ? "600" : "500"}
      >
        {label}
      </Text>
    </Button>
  );
}
