import { Ionicons } from "@expo/vector-icons";
import {
  type StyleProp,
  StyleSheet,
  Text,
  type TextStyle,
  TouchableOpacity,
  type ViewStyle,
} from "react-native";
import { borderRadius, colors, spacing, typography } from "~/styles";
import { type ThemePalette, useThemedStyles } from "~/theme/TripThemeProvider";

interface PrimaryAddButtonProps {
  onPress: () => void;
  label?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  activeOpacity?: number;
  testID?: string;
}

export function PrimaryAddButton({
  onPress,
  label = "Add New",
  disabled = false,
  style,
  textStyle,
  activeOpacity = 0.9,
  testID = "primary-add-button",
}: PrimaryAddButtonProps) {
  const styles = useThemedStyles(makeStyles);
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[styles.button, disabled && styles.buttonDisabled, style]}
      activeOpacity={activeOpacity}
      accessibilityRole="button"
      accessibilityLabel={label}
      testID={testID}
    >
      <Ionicons name="add-circle" size={24} color={colors.backgroundDark} />
      <Text style={[styles.buttonText, textStyle]}>{label}</Text>
    </TouchableOpacity>
  );
}

function makeStyles(palette: ThemePalette) {
  return StyleSheet.create({
    button: {
      backgroundColor: palette.primary,
      borderRadius: borderRadius.lg,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.md,
      shadowColor: palette.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      minWidth: 120,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    buttonText: {
      fontSize: 14,
      fontWeight: typography.bold,
      color: colors.backgroundDark,
      letterSpacing: 0.5,
      textTransform: "uppercase",
    },
  });
}
