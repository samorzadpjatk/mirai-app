import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, TouchableOpacity, type StyleProp, type ViewStyle } from "react-native";
import { colors } from "~/styles";

interface FloatingActionButtonProps {
  onPress: () => void;
  iconName: keyof typeof Ionicons.glyphMap;
  accessibilityLabel: string;
  iconSize?: number;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  activeOpacity?: number;
  testID?: string;
}

export function FloatingActionButton({
  onPress,
  iconName,
  accessibilityLabel,
  iconSize = 32,
  disabled = false,
  style,
  activeOpacity = 0.7,
  testID,
}: FloatingActionButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[styles.button, disabled && styles.buttonDisabled, style]}
      activeOpacity={activeOpacity}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
    >
      <Ionicons name={iconName} size={iconSize} color={colors.backgroundDark} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
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
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
