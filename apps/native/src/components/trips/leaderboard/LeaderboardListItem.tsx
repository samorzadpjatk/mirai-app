import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { CachedImage } from "~/components/common/CachedImage";
import { borderRadius, colors, spacing, typography } from "~/styles";
import { type ThemePalette, useThemedStyles } from "~/theme/TripThemeProvider";
import { formatNumber } from "~/utils/format";
import type { RankedGroup } from "./types";

interface LeaderboardListItemProps {
  group: RankedGroup;
  onPress?: (group: RankedGroup) => void;
}

export function LeaderboardListItem({ group, onPress }: LeaderboardListItemProps) {
  const styles = useThemedStyles(makeStyles);
  return (
    <TouchableOpacity
      testID="leaderboard-item"
      style={[styles.row, group.isCurrentUserGroup && styles.rowActive]}
      activeOpacity={0.85}
      onPress={() => onPress?.(group)}
    >
      <View style={styles.rankCell}>
        <Text style={[styles.rankText, group.isCurrentUserGroup && styles.rankTextActive]}>
          {group.rank}
        </Text>
      </View>

      <View style={[styles.avatar, group.isCurrentUserGroup && styles.avatarActive]}>
        {group.image ? (
          <CachedImage
            testID="group-image"
            source={{ uri: group.image }}
            style={styles.avatarImage}
            contentFit="cover"
          />
        ) : (
          <Text style={styles.avatarText}>{group.name.charAt(0)}</Text>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.nameRow}>
          <Text style={styles.groupName}>{group.name}</Text>
          {group.isCurrentUserGroup && (
            <View style={styles.youBadge}>
              <Text style={styles.youBadgeText}>YOUR GROUP</Text>
            </View>
          )}
        </View>
        <Text style={styles.memberCount}>{group.memberCount} Members active</Text>
      </View>

      <View style={styles.scoreCell}>
        <Text style={[styles.scoreText, group.isCurrentUserGroup && styles.scoreTextActive]}>
          {formatNumber(group.coins)} pts
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const makeStyles = (palette: ThemePalette) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.lg,
      backgroundColor: "rgba(255, 255, 255, 0.05)",
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.xl,
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.05)",
    },
    rowActive: {
      backgroundColor: "rgba(0, 206, 209, 0.1)",
      borderColor: "rgba(0, 206, 209, 0.3)",
      borderLeftWidth: 4,
      borderLeftColor: palette.primary,
    },
    rankCell: {
      width: 32,
      alignItems: "center",
    },
    rankText: {
      fontSize: typography.sm,
      fontWeight: typography.bold,
      color: "rgba(255, 255, 255, 0.6)",
    },
    rankTextActive: {
      color: palette.primary,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.cardDark,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    avatarImage: {
      width: "100%",
      height: "100%",
    },
    avatarActive: {
      borderWidth: 2,
      borderColor: "rgba(0, 206, 209, 0.2)",
    },
    avatarText: {
      fontSize: typography.lg,
      fontWeight: typography.bold,
      color: colors.white,
    },
    content: {
      flex: 1,
    },
    nameRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    groupName: {
      fontSize: typography.base,
      fontWeight: typography.bold,
      color: colors.white,
    },
    youBadge: {
      backgroundColor: palette.primary,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: borderRadius.sm,
    },
    youBadgeText: {
      fontSize: 10,
      fontWeight: typography.bold,
      color: colors.backgroundDark,
      textTransform: "uppercase",
    },
    memberCount: {
      fontSize: typography.xs,
      color: "rgba(255, 255, 255, 0.4)",
      marginTop: 2,
    },
    scoreCell: {
      alignItems: "flex-end",
    },
    scoreText: {
      fontSize: typography.base,
      fontWeight: typography.bold,
      color: "rgba(255, 255, 255, 0.8)",
    },
    scoreTextActive: {
      color: palette.primary,
    },
  });
