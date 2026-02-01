import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "~/styles";

interface TripsEmptyStateProps {
  title: string;
  subtitle: string;
}

export function TripsEmptyState({ title, subtitle }: TripsEmptyStateProps) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateText}>{title}</Text>
      <Text style={styles.emptyStateSubtext}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
    color: colors.textSecondary,
  },
});
