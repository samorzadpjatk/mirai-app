import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { borderRadius, colors, shadows, spacing, typography } from "~/styles";

interface PrimaryLoadingButtonProps {
  label: string;
  isLoading: boolean;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  activeOpacity?: number;
}

export function PrimaryLoadingButton({
  label,
  isLoading,
  onPress,
  disabled = false,
  style,
  textStyle,
  activeOpacity = 0.9,
}: PrimaryLoadingButtonProps) {
  const isDisabled = isLoading || disabled;

  return (
    <TouchableOpacity
      style={[styles.button, shadows.primaryGlow, style]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={activeOpacity}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={colors.backgroundDark} />
      ) : (
        <Text style={[styles.buttonText, textStyle]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontSize: typography.base,
    fontWeight: typography.bold,
    color: colors.backgroundDark,
  },
});
