import React from "react";
import { type StyleProp, type ViewStyle } from "react-native";
import { FloatingActionButton } from "~/components/common/FloatingActionButton";

interface AdminAddFabProps {
  onPress: () => void;
  accessibilityLabel: string;
  bottom?: number;
  right?: number;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function AdminAddFab({
  onPress,
  accessibilityLabel,
  bottom = 96,
  right = 20,
  disabled = false,
  style,
}: AdminAddFabProps) {
  return (
    <FloatingActionButton
      onPress={onPress}
      iconName="add"
      iconSize={32}
      activeOpacity={0.7}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      style={[
        {
          position: "absolute",
          right,
          bottom,
        },
        style,
      ]}
    />
  );
}
