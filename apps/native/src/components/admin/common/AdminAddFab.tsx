import React from "react";
import { TouchableOpacity, type StyleProp, type ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "~/styles";

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
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        {
          position: "absolute",
          right,
          bottom,
          width: 58,
          height: 58,
          borderRadius: 999,
          backgroundColor: colors.primary,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.35,
          shadowRadius: 16,
          elevation: 8,
          opacity: disabled ? 0.6 : 1,
        },
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Ionicons name="add" size={32} color={colors.backgroundDark} />
    </TouchableOpacity>
  );
}
