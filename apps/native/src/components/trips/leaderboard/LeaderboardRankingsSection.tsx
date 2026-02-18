import { StyleSheet, Text, View } from "react-native";
import { borderRadius, colors, spacing, typography } from "~/styles";
import type { RankedGroup } from "./types";
import { LeaderboardListItem } from "./LeaderboardListItem";

interface LeaderboardRankingsSectionProps {
  groups: RankedGroup[];
  onPressGroup?: (group: RankedGroup) => void;
}

export function LeaderboardRankingsSection({
  groups,
  onPressGroup,
}: LeaderboardRankingsSectionProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Full Rankings</Text>
        <Text style={styles.subtitle}>Global Standings</Text>
      </View>

      <View style={styles.list}>
        {groups.map((group) => (
          <LeaderboardListItem
            key={group.id}
            group={group}
            onPress={onPressGroup}
          />
        ))}
      </View>

      {groups.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No groups yet</Text>
          <Text style={styles.emptySubtitle}>
            Groups will appear here as they join the trip
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(28, 31, 33, 0.3)",
    borderTopLeftRadius: borderRadius.xl * 2.5,
    borderTopRightRadius: borderRadius.xl * 2.5,
    marginTop: -spacing.lg,
    borderTopWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  title: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.white,
  },
  subtitle: {
    fontSize: typography.xs,
    fontWeight: typography.medium,
    color: "rgba(255, 255, 255, 0.4)",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  list: {
    gap: spacing.md,
  },
  emptyState: {
    padding: spacing.xl * 2,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.textMuted,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: typography.sm,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.sm,
  },
});
