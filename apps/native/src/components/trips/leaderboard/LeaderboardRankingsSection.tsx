import { StyleSheet, Text, View } from "react-native";
import { borderRadius, spacing, typography } from "~/styles";
import { type ThemePalette, useThemedStyles } from "~/theme/TripThemeProvider";
import { LeaderboardListItem } from "./LeaderboardListItem";
import type { RankedGroup } from "./types";

interface LeaderboardRankingsSectionProps {
  groups: RankedGroup[];
  onPressGroup?: (group: RankedGroup) => void;
}

export function LeaderboardRankingsSection({
  groups,
  onPressGroup,
}: LeaderboardRankingsSectionProps) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View testID="leaderboard-rankings-section" style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Full Rankings</Text>
        <Text style={styles.subtitle}>Global Standings</Text>
      </View>

      <View style={styles.list}>
        {groups.map((group) => (
          <LeaderboardListItem key={group.id} group={group} onPress={onPressGroup} />
        ))}
      </View>

      {groups.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No groups yet</Text>
          <Text style={styles.emptySubtitle}>Groups will appear here as they join the trip</Text>
        </View>
      )}
    </View>
  );
}

const makeStyles = (palette: ThemePalette) =>
  StyleSheet.create({
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
      color: palette.white,
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
      color: palette.textMuted,
      textAlign: "center",
    },
    emptySubtitle: {
      fontSize: typography.sm,
      color: palette.textMuted,
      textAlign: "center",
      marginTop: spacing.sm,
    },
  });
