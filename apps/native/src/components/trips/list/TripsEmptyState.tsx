import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "~/styles";
import { type ThemePalette, useThemedStyles } from "~/theme/TripThemeProvider";

interface TripsEmptyStateProps {
  title: string;
  subtitle: string;
}

export function TripsEmptyState({ title, subtitle }: TripsEmptyStateProps) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateText}>{title}</Text>
      <Text style={styles.emptyStateSubtext}>{subtitle}</Text>
    </View>
  );
}

function makeStyles(palette: ThemePalette) {
  return StyleSheet.create({
    emptyState: {
      alignItems: "center",
      paddingVertical: spacing.xxxl * 2,
    },
    emptyStateText: {
      fontSize: typography.xl,
      fontWeight: typography.bold,
      color: colors.white,
      marginBottom: spacing.sm,
    },
    emptyStateSubtext: {
      fontSize: typography.base,
      color: palette.textSecondary,
    },
  });
}
