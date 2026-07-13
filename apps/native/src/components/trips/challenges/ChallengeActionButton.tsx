import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { borderRadius, colors, spacing, typography } from "~/styles";
import { type ThemePalette, useThemedStyles } from "~/theme/TripThemeProvider";

interface ChallengeActionButtonProps {
  isLoading: boolean;
  onPress: () => void;
  label?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
}

export function ChallengeActionButton({
  isLoading,
  onPress,
  label,
  iconName = "camera",
  disabled = false,
}: ChallengeActionButtonProps) {
  const styles = useThemedStyles(makeStyles);
  const buttonLabel = label ?? (isLoading ? "Loading..." : "Take Challenge Photo");
  const isDisabled = isLoading || disabled;
  const iconColor = isDisabled ? colors.textMuted : colors.backgroundDark;
  const textColor = isDisabled ? colors.textMuted : colors.backgroundDark;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      style={[styles.button, isLoading && styles.buttonLoading, disabled && styles.buttonDisabled]}
    >
      <Ionicons name={iconName} size={24} color={iconColor} />
      <Text style={[styles.buttonText, { color: textColor }]}>{buttonLabel}</Text>
    </TouchableOpacity>
  );
}

const makeStyles = (palette: ThemePalette) =>
  StyleSheet.create({
    button: {
      backgroundColor: palette.primary,
      borderRadius: borderRadius.xl,
      padding: spacing.lg,
      marginBottom: spacing.md,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.md,
      shadowColor: palette.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      opacity: 1,
    },
    buttonLoading: {
      opacity: 0.7,
    },
    buttonDisabled: {
      backgroundColor: colors.surfaceDark,
      shadowOpacity: 0,
      opacity: 0.75,
    },
    buttonText: {
      fontSize: typography.lg,
      fontWeight: typography.bold,
      color: colors.backgroundDark,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
  });
