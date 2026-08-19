import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { borderRadius, colors, spacing, typography } from "~/styles";
import { type ThemePalette, useThemedStyles } from "~/theme/TripThemeProvider";

interface GroupNotFoundStateProps {
  onGoBack: () => void;
}

export function GroupNotFoundState({ onGoBack }: GroupNotFoundStateProps) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.container}>
      <Text style={styles.errorText}>Group not found</Text>
      <TouchableOpacity onPress={onGoBack} style={styles.backButton}>
        <Text style={styles.backButtonText}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const makeStyles = (palette: ThemePalette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundDark,
      justifyContent: "center",
      alignItems: "center",
    },
    errorText: {
      fontSize: typography.lg,
      color: palette.textMuted,
      marginBottom: spacing.lg,
    },
    backButton: {
      backgroundColor: palette.primary,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.md,
    },
    backButtonText: {
      fontSize: typography.base,
      fontWeight: typography.bold,
      color: colors.backgroundDark,
    },
  });
