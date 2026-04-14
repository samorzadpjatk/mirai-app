import React from "react";
import { Ionicons } from "@expo/vector-icons";
import type { TextStyle, ViewStyle } from "react-native";
import { Button, Text, XStack, YStack } from "@mirai-app/ui";

export type FilterChipIcon = keyof typeof Ionicons.glyphMap;

export interface FilterChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: FilterChipIcon;
  secondaryIcon?: FilterChipIcon;
  count?: number;
  disabled?: boolean;
  accessibilityLabel?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  countPillStyle?: ViewStyle;
  countTextStyle?: TextStyle;
}

export const FilterChip: React.FC<FilterChipProps> = ({
  label,
  selected = false,
  onPress,
  icon,
  secondaryIcon,
  count,
  disabled = false,
  accessibilityLabel,
  style,
  textStyle,
  countPillStyle,
  countTextStyle,
}) => {
  const hasCount = typeof count === "number";

  return (
    <Button
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={onPress}
      chromeless
      minHeight={34}
      paddingHorizontal="$md"
      paddingVertical="$xs"
      borderRadius="$full"
      borderWidth={1}
      borderColor={selected ? "$primary" : "$borderWhite10"}
      backgroundColor={
        selected ? "$primaryOpacity20" : "$backgroundDarkOpacity50"
      }
      opacity={disabled ? 0.6 : 1}
      style={style}
    >
      <XStack alignItems="center" gap="$xs" flexShrink={1}>
        {icon ? (
          <Ionicons
            name={icon}
            size={14}
            color={selected ? "#00ced1" : "#9ca3af"}
          />
        ) : null}
        {secondaryIcon ? (
          <Ionicons
            name={secondaryIcon}
            size={14}
            color={selected ? "#00ced1" : "#9ca3af"}
          />
        ) : null}
        <Text
          color={selected ? "$primary" : "$textSecondary"}
          fontSize="$sm"
          fontWeight="600"
          textTransform="none"
          letterSpacing={0.4}
          style={textStyle}
        >
          {label}
        </Text>
      </XStack>

      {hasCount ? (
        <YStack
          minWidth={24}
          paddingHorizontal="$xs"
          paddingVertical={2}
          borderRadius="$full"
          borderWidth={1}
          borderColor={selected ? "$primary" : "$borderWhite10"}
          backgroundColor={
            selected ? "$primaryOpacity20" : "$backgroundDarkOpacity80"
          }
          alignItems="center"
          justifyContent="center"
          style={countPillStyle}
        >
          <Text
            color={selected ? "$primary" : "$white"}
            fontWeight="700"
            fontSize="$xs"
            style={countTextStyle}
          >
            {count}
          </Text>
        </YStack>
      ) : null}
    </Button>
  );
};
