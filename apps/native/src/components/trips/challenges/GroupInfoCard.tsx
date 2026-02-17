import { StyleSheet, Text, View } from "react-native";
import { borderRadius, colors, spacing, typography } from "~/styles";

interface GroupInfoCardProps {
  groupName: string;
  position?: number;
  totalGroups?: number;
  pointsDifference?: number;
  completedChallengesCount?: number;
  totalChallengesCount?: number;
}

export function GroupInfoCard({
  groupName,
  position,
  totalGroups,
  pointsDifference,
  completedChallengesCount,
  totalChallengesCount,
}: GroupInfoCardProps) {
  const isLeading = position === 1;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Your Group</Text>
        <Text style={styles.name}>{groupName}</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Position</Text>
          <View style={styles.statValueRow}>
            <Text style={styles.statValue}>{position ?? "-"}</Text>
            <Text style={styles.statValueSuffix}>/ {totalGroups ?? 0}</Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>
            {isLeading ? "Leading By" : "Behind By"}
          </Text>
          <View style={styles.statValueRow}>
            <Text
              style={[
                styles.statValue,
                isLeading ? styles.leadingValue : styles.behindValue,
              ]}
            >
              {pointsDifference ?? 0}
            </Text>
            <Text style={styles.statUnit}>pts</Text>
          </View>
        </View>
      </View>

      <View style={styles.progressCard}>
        <Text style={styles.progressLabel}>Challenges done</Text>
        <Text style={styles.progressValue}>
          {completedChallengesCount ?? 0}
          <Text style={styles.progressValueSuffix}> / {totalChallengesCount ?? 0}</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xl * 2,
    padding: spacing.xl,
    backgroundColor: colors.cardDark,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  header: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 10,
    fontWeight: typography.bold,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 4,
  },
  name: {
    fontSize: 24,
    fontWeight: typography.bold,
    color: colors.white,
    letterSpacing: -0.5,
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: "rgba(39, 41, 53, 0.5)",
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  statLabel: {
    fontSize: 10,
    fontWeight: typography.bold,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 4,
  },
  statValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: typography.bold,
    color: colors.primary,
  },
  statValueSuffix: {
    fontSize: 10,
    fontWeight: typography.bold,
    color: "rgba(0, 206, 209, 0.7)",
    textTransform: "uppercase",
  },
  statUnit: {
    fontSize: 10,
    fontWeight: typography.bold,
    color: colors.textMuted,
    textTransform: "uppercase",
  },
  leadingValue: {
    color: "#10b981",
  },
  behindValue: {
    color: "#ef4444",
  },
  progressCard: {
    marginTop: spacing.md,
    backgroundColor: "rgba(39, 41, 53, 0.5)",
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: typography.bold,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 4,
  },
  progressValue: {
    fontSize: 24,
    fontWeight: typography.bold,
    color: colors.primary,
  },
  progressValueSuffix: {
    fontSize: 12,
    fontWeight: typography.bold,
    color: "rgba(0, 206, 209, 0.7)",
    textTransform: "uppercase",
  },
});
