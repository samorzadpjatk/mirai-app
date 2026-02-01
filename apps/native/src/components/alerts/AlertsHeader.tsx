import { View, Text, StyleSheet } from "react-native";
import { colors, spacing, typography } from "~/styles";

interface AlertsHeaderProps {
  title: string;
  subtitle: string;
}

export function AlertsHeader({ title, subtitle }: AlertsHeaderProps) {
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>{title}</Text>
      <Text style={styles.headerSubtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.xl,
  },
  headerTitle: {
    fontSize: typography.xxl,
    fontWeight: typography.bold,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: typography.sm,
    color: colors.textMuted,
  },
});
