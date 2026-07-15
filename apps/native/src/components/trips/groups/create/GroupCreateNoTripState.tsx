import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, spacing, typography } from "~/styles";
import { type ThemePalette, useThemedStyles } from "~/theme/TripThemeProvider";

interface GroupCreateNoTripStateProps {
  onGoBack: () => void;
}

export function GroupCreateNoTripState({ onGoBack }: GroupCreateNoTripStateProps) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.container}>
      <Text style={styles.errorText}>No trip selected</Text>
      <TouchableOpacity onPress={onGoBack}>
        <Text style={styles.linkText}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const makeStyles = (palette: ThemePalette) =>
  StyleSheet.create({
    container: {
      justifyContent: "center",
      alignItems: "center",
      flex: 1,
      backgroundColor: colors.backgroundDark,
    },
    errorText: {
      fontSize: typography.lg,
      color: colors.textMuted,
      marginBottom: spacing.lg,
    },
    linkText: {
      color: palette.primary,
      fontWeight: typography.bold,
    },
  });
