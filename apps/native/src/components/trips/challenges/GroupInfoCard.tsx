import { StyleSheet, Text, View } from "react-native";
import { WoodTexture } from "~/components/common/WoodTexture";
import { borderRadius, colors, spacing, typography } from "~/styles";
import { type ThemePalette, useThemedStyles } from "~/theme/TripThemeProvider";

interface GroupInfoCardProps {
  groupName: string;
  position?: number;
  totalGroups?: number;
  pointsDifference?: number;
  targetPosition?: number;
  targetGroupName?: string;
  completedChallengesCount?: number;
  totalChallengesCount?: number;
}

export function GroupInfoCard({
  groupName,
  position,
  totalGroups,
  pointsDifference,
  targetPosition,
  targetGroupName,
  completedChallengesCount,
  totalChallengesCount,
}: GroupInfoCardProps) {
  const styles = useThemedStyles(makeStyles);
  const isLeading = position === 1;
  const deltaPoints = pointsDifference ?? 0;
  let targetLabel: string | null = null;
  if (typeof targetPosition === "number" && targetGroupName) {
    targetLabel = `#${targetPosition} ${targetGroupName}`;
  } else if (targetGroupName) {
    targetLabel = targetGroupName;
  } else if (typeof targetPosition === "number") {
    targetLabel = `#${targetPosition}`;
  }
  const pointsContext = isLeading
    ? targetLabel
      ? `Przewaga ${deltaPoints} pkt nad ${targetLabel}`
      : "Prowadzicie w tabeli"
    : targetLabel
      ? `Brakuje ${deltaPoints} pkt do ${targetLabel}`
      : "Brakuje do wyższej pozycji";

  return (
    <View style={styles.container}>
      <WoodTexture radius={borderRadius.xl} />
      <View style={styles.topRow}>
        <View style={styles.header}>
          <Text style={styles.label}>Your Group</Text>
          <Text style={styles.name} numberOfLines={1}>
            {groupName}
          </Text>
        </View>
        <View style={styles.positionBadge}>
          <Text style={styles.positionBadgeText}>
            #{position ?? "-"} / {totalGroups ?? 0}
          </Text>
        </View>
      </View>

      <View style={styles.pointsRow}>
        <Text style={[styles.pointsValue, isLeading ? styles.leadingValue : styles.behindValue]}>
          {deltaPoints} pts
        </Text>
        <Text style={styles.pointsMeta}>{pointsContext}</Text>
      </View>

      <View style={styles.progressRow}>
        <Text style={styles.progressLabel}>Challenges done</Text>
        <View style={styles.progressValueRow}>
          <Text style={styles.progressValue}>{completedChallengesCount ?? 0}</Text>
          <Text style={styles.progressValueSuffix}>/ {totalChallengesCount ?? 0}</Text>
        </View>
      </View>
    </View>
  );
}

const makeStyles = (palette: ThemePalette) =>
  StyleSheet.create({
    container: {
      marginBottom: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      backgroundColor: palette.cardDark,
      borderRadius: borderRadius.xl,
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.05)",
    },
    topRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
    },
    header: {
      flex: 1,
    },
    label: {
      fontSize: 9,
      fontWeight: typography.bold,
      color: colors.textMuted,
      textTransform: "uppercase",
      letterSpacing: 1.4,
      marginBottom: 2,
    },
    name: {
      fontSize: 16,
      fontWeight: typography.bold,
      color: colors.white,
      letterSpacing: -0.2,
    },
    positionBadge: {
      borderRadius: borderRadius.full,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderWidth: 1,
      borderColor: "rgba(0, 206, 209, 0.38)",
      backgroundColor: "rgba(0, 206, 209, 0.14)",
    },
    positionBadgeText: {
      color: palette.primary,
      fontSize: 11,
      fontWeight: typography.bold,
    },
    pointsRow: {
      marginTop: spacing.xs,
      flexDirection: "row",
      alignItems: "baseline",
      gap: spacing.xs,
    },
    pointsValue: {
      fontSize: 16,
      fontWeight: typography.bold,
    },
    pointsMeta: {
      flex: 1,
      fontSize: 12,
      fontWeight: typography.medium,
      color: colors.textMuted,
    },
    progressRow: {
      marginTop: spacing.xs,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    progressLabel: {
      fontSize: 11,
      fontWeight: typography.bold,
      color: colors.textMuted,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    progressValueRow: {
      flexDirection: "row",
      alignItems: "baseline",
      gap: 4,
    },
    progressValue: {
      fontSize: 16,
      fontWeight: typography.bold,
      color: palette.primary,
    },
    leadingValue: {
      color: "#10b981",
    },
    behindValue: {
      color: "#ef4444",
    },
    progressValueSuffix: {
      fontSize: 11,
      fontWeight: typography.bold,
      color: "rgba(0, 206, 209, 0.7)",
      textTransform: "uppercase",
    },
  });
