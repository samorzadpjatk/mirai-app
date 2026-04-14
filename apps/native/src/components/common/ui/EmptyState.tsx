import React from "react";
import type { ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { YStack, Text } from "@mirai-app/ui";

// Ionicons icon names type
type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

interface EmptyStateProps {
  /** Icon name from Ionicons */
  icon?: IoniconName;
  /** Icon size (default: 48) */
  iconSize?: number;
  /** Icon color (default: $textSecondary) */
  iconColor?: string;
  /** Title text */
  title: string;
  /** Subtitle/description text */
  subtitle?: string;
  /** Additional container style */
  style?: ViewStyle;
  /** Whether to add opacity to icon (default: 0.5) */
  iconOpacity?: number;
}

export function EmptyState({
  icon,
  iconSize = 48,
  iconColor = "#9ca3af",
  title,
  subtitle,
  style,
  iconOpacity = 0.5,
}: EmptyStateProps) {
  return (
    <YStack alignItems="center" paddingVertical="$10" style={style}>
      {icon && (
        <YStack marginBottom="$lg" opacity={iconOpacity}>
          <Ionicons name={icon} size={iconSize} color={iconColor} />
        </YStack>
      )}
      <Text
        fontSize="$xl"
        fontWeight="700"
        color="$white"
        marginBottom="$sm"
        textAlign="center"
      >
        {title}
      </Text>
      {subtitle && (
        <Text
          fontSize="$base"
          color="$textMuted"
          textAlign="center"
          lineHeight={22}
        >
          {subtitle}
        </Text>
      )}
    </YStack>
  );
}
