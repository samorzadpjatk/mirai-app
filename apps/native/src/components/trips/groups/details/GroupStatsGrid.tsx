import { StyleSheet, Text, View } from "react-native";
import { borderRadius, colors, spacing, typography } from "~/styles";

interface GroupStatsGridProps {
  membersCount: number;
  points: number;
  code: string;
}

export function GroupStatsGrid({
  membersCount,
  points,
  code,
}: GroupStatsGridProps) {
  return (
    <View style={styles.statsGrid}>
      <View style={styles.statCard}>
        <Text style={styles.statLabel}>Members</Text>
        <Text style={styles.statValue}>{membersCount}</Text>
      </View>

      <View style={styles.statCard}>
        <Text style={styles.statLabel}>Points</Text>
        <Text style={[styles.statValue, { color: colors.primary }]}>
          {points.toLocaleString()}
        </Text>
      </View>

      <View style={styles.statCard}>
        <Text style={styles.statLabel}>Code</Text>
        <Text style={[styles.statValue, styles.statValueCode]}>{code}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  statsGrid: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.cardDark,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  statLabel: {
    fontSize: 10,
    fontWeight: typography.bold,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.white,
    lineHeight: typography.xl,
  },
  statValueCode: {
    color: colors.accentMagenta,
    fontSize: typography.base,
  },
});
