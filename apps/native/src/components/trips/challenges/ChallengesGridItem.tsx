import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { borderRadius, colors, spacing, typography } from "~/styles";
import type { ChallengeListItem } from "./types";

interface ChallengesGridItemProps {
  challenge: ChallengeListItem;
  onPress: (challenge: ChallengeListItem) => void;
}

export function ChallengesGridItem({
  challenge,
  onPress,
}: ChallengesGridItemProps) {
  const isActive = challenge.status === "selected";
  const isLocked = challenge.status === "locked";

  return (
    <TouchableOpacity
      onPress={() => onPress(challenge)}
      disabled={isLocked}
      style={[
        styles.card,
        isActive && styles.cardActive,
        isLocked && styles.cardLocked,
      ]}
    >
      <View style={styles.cardHeader}>
        <View
          style={[
            styles.iconWrapper,
            {
              backgroundColor: isLocked
                ? "rgba(107, 114, 128, 0.1)"
                : `${challenge.iconColor}1a`,
            },
          ]}
        >
          <Ionicons
            name={challenge.icon as keyof typeof Ionicons.glyphMap}
            size={24}
            color={isLocked ? colors.textMuted : challenge.iconColor}
          />
        </View>

        {isLocked ? (
          <Ionicons name="lock-closed" size={16} color={colors.textMuted} />
        ) : (
          <Text
            style={[styles.pointsBadge, isActive && styles.pointsBadgeActive]}
          >
            +{challenge.points}
          </Text>
        )}
      </View>

      <View>
        <Text style={styles.title}>{challenge.title}</Text>
        <Text style={[styles.status, isActive && styles.statusActive]}>
          {challenge.status}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardDark,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    aspectRatio: 1,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    flexDirection: "column",
    justifyContent: "space-between",
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  cardActive: {
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.2,
    shadowRadius: 15,
  },
  cardLocked: {
    opacity: 0.6,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  pointsBadge: {
    backgroundColor: "rgba(0, 206, 209, 0.2)",
    color: colors.primary,
    fontSize: 10,
    fontWeight: typography.bold,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    textTransform: "uppercase",
    letterSpacing: 1,
    borderWidth: 1,
    borderColor: "rgba(0, 206, 209, 0.3)",
  },
  pointsBadgeActive: {
    backgroundColor: colors.primary,
    color: colors.backgroundDark,
    borderColor: "transparent",
  },
  title: {
    fontSize: typography.base,
    fontWeight: typography.bold,
    color: colors.white,
    lineHeight: 20,
  },
  status: {
    fontSize: 10,
    textTransform: "uppercase",
    fontWeight: typography.bold,
    letterSpacing: 2,
    marginTop: 4,
    color: colors.textMuted,
  },
  statusActive: {
    color: colors.primary,
  },
});
