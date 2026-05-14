import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { borderRadius, colors, spacing, typography } from "~/styles";
import { formatNumber } from "~/utils/format";
import type { RankedGroup } from "./types";

const MEDAL_COLORS = {
  gold: "#FFCC00",
  silver: "#BFBFBF",
  bronze: "#B36F2E",
};

interface PodiumPlaceProps {
  group?: RankedGroup;
  position: 1 | 2 | 3;
  onPressGroup?: (group: RankedGroup) => void;
}

function PodiumPlace({ group, position, onPressGroup }: PodiumPlaceProps) {
  if (!group) {
    return (
      <View style={styles.podiumColumn}>
        <View style={styles.emptyAvatar} />
        <View style={[styles.emptyPodium, position === 1 && styles.emptyPodiumTall]} />
      </View>
    );
  }

  const medalColor =
    position === 1 ? MEDAL_COLORS.gold : position === 2 ? MEDAL_COLORS.silver : MEDAL_COLORS.bronze;
  const avatarSize = position === 1 ? 80 : position === 2 ? 64 : 56;
  const podiumHeight = position === 1 ? 176 : position === 2 ? 128 : 96;
  const borderColor = position === 1 ? "rgba(255, 204, 0, 0.3)" : "rgba(255, 255, 255, 0.1)";

  return (
    <TouchableOpacity
      style={styles.podiumColumn}
      activeOpacity={0.85}
      onPress={() => onPressGroup?.(group)}
    >
      <View style={styles.avatarContainer}>
        <View
          style={[
            styles.avatar,
            {
              width: avatarSize,
              height: avatarSize,
              borderRadius: avatarSize / 2,
              borderColor: medalColor,
            },
            position === 1 && styles.avatarGlow,
          ]}
        >
          {group.image ? (
            <Image source={{ uri: group.image }} style={styles.avatarImage} resizeMode="cover" />
          ) : (
            <Text style={[styles.avatarText, { color: medalColor }]}>{group.name.charAt(0)}</Text>
          )}
        </View>

        {position === 1 && (
          <View style={styles.crownIcon}>
            <Ionicons name="ribbon" size={30} color={MEDAL_COLORS.gold} />
          </View>
        )}

        <View style={[styles.rankBadge, { backgroundColor: medalColor }]}>
          <Text style={styles.rankBadgeText}>
            {position === 1 ? "1ST" : position === 2 ? "2ND" : "3RD"}
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.podium,
          {
            height: podiumHeight,
            borderColor,
          },
        ]}
      >
        <Ionicons
          name="trophy"
          size={position === 1 ? 32 : 24}
          color={medalColor}
          style={styles.medalIcon}
        />
        <Text
          style={[
            styles.podiumName,
            position === 1 ? styles.podiumNameLarge : styles.podiumNameSmall,
          ]}
          numberOfLines={1}
        >
          {group.name}
        </Text>
        <Text
          style={[
            styles.podiumScore,
            position === 1 ? styles.podiumScoreLarge : styles.podiumScoreSmall,
          ]}
        >
          {formatNumber(group.coins)} pts
        </Text>
      </View>
    </TouchableOpacity>
  );
}

interface LeaderboardPodiumProps {
  topThree: RankedGroup[];
  onPressGroup?: (group: RankedGroup) => void;
}

export function LeaderboardPodium({ topThree, onPressGroup }: LeaderboardPodiumProps) {
  return (
    <View style={styles.container}>
      <View style={styles.podiumRow}>
        <PodiumPlace group={topThree[1]} position={2} onPressGroup={onPressGroup} />
        <View style={styles.firstPlaceOffset}>
          <PodiumPlace group={topThree[0]} position={1} onPressGroup={onPressGroup} />
        </View>
        <PodiumPlace group={topThree[2]} position={3} onPressGroup={onPressGroup} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl * 3,
    paddingBottom: spacing.xl,
    position: "relative",
  },
  podiumRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: spacing.md,
    height: 280,
  },
  firstPlaceOffset: {
    transform: [{ translateY: -16 }],
  },
  podiumColumn: {
    flex: 1,
    alignItems: "center",
  },
  emptyAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    marginBottom: spacing.md,
  },
  emptyPodium: {
    width: "100%",
    height: 96,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
  },
  emptyPodiumTall: {
    height: 176,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: spacing.md,
  },
  avatar: {
    borderWidth: 2,
    backgroundColor: colors.cardDark,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarGlow: {
    shadowColor: MEDAL_COLORS.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: typography.bold,
  },
  crownIcon: {
    position: "absolute",
    top: -24,
    left: "50%",
    transform: [{ translateX: -15 }],
  },
  rankBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  rankBadgeText: {
    fontSize: 10,
    fontWeight: typography.bold,
    color: colors.backgroundDark,
  },
  podium: {
    width: "100%",
    backgroundColor: "rgba(28, 31, 33, 0.5)",
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    paddingTop: spacing.lg,
    alignItems: "center",
  },
  medalIcon: {
    marginBottom: spacing.xs,
  },
  podiumName: {
    fontWeight: typography.bold,
    color: colors.white,
    textAlign: "center",
    paddingHorizontal: spacing.sm,
  },
  podiumNameLarge: {
    fontSize: typography.sm,
  },
  podiumNameSmall: {
    fontSize: typography.xs,
  },
  podiumScore: {
    fontWeight: typography.bold,
    color: colors.primary,
    marginTop: spacing.xs,
  },
  podiumScoreLarge: {
    fontSize: typography.lg,
  },
  podiumScoreSmall: {
    fontSize: typography.sm,
  },
});
