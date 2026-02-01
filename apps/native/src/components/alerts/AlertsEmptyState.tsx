import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography } from "~/styles";

interface AlertsEmptyStateProps {
  title: string;
  message: string;
}

export function AlertsEmptyState({ title, message }: AlertsEmptyStateProps) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="alert-circle" size={48} color={colors.textMuted} />
      </View>
      <Text style={styles.emptyStateTitle}>{title}</Text>
      <Text style={styles.emptyStateText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyState: {
    alignItems: "center",
    paddingVertical: spacing.xxl * 2,
  },
  emptyIcon: {
    marginBottom: spacing.lg,
    opacity: 0.5,
  },
  emptyStateTitle: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.white,
    marginBottom: spacing.sm,
  },
  emptyStateText: {
    fontSize: typography.base,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 22,
  },
});
