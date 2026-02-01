import { StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { borderRadius, colors, spacing, typography } from "~/styles";
import { getIconForChallenge, getColorForPoints } from "./challengeStyles";

interface ChallengeHeroCardProps {
  name: string;
  points: number;
  isSelected: boolean;
}

export function ChallengeHeroCard({
  name,
  points,
  isSelected,
}: ChallengeHeroCardProps) {
  const icon = getIconForChallenge(name);
  const iconColor = getColorForPoints(points);

  return (
    <View style={[styles.container, isSelected && styles.containerSelected]}>
      <View style={[styles.iconWrapper, { backgroundColor: `${iconColor}1a` }]}>
        <MaterialIcons name={icon} size={48} color={iconColor} />
      </View>

      <Text style={styles.title}>{name}</Text>

      <View style={styles.badgeRow}>
        <Text
          style={[styles.pointsBadge, isSelected && styles.pointsBadgeSelected]}
        >
          {points} Points
        </Text>
        {isSelected && <Text style={styles.selectedLabel}>SELECTED</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginBottom: spacing.xl * 2,
    padding: spacing.xl * 2,
    backgroundColor: colors.cardDark,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  containerSelected: {
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.2,
    shadowRadius: 15,
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: typography.bold,
    color: colors.white,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  pointsBadge: {
    backgroundColor: "rgba(0, 206, 209, 0.2)",
    color: colors.primary,
    fontSize: 14,
    fontWeight: typography.bold,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  pointsBadgeSelected: {
    backgroundColor: colors.primary,
    color: colors.backgroundDark,
  },
  selectedLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    fontWeight: typography.bold,
    letterSpacing: 2,
    color: colors.primary,
  },
});
