import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "~/styles";

interface TripsHeaderProps {
  title: string;
  subtitle: string;
}

export function TripsHeader({ title, subtitle }: TripsHeaderProps) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.xxxl,
    fontWeight: typography.bold,
    color: colors.white,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.base,
    color: colors.textSecondary,
  },
});
