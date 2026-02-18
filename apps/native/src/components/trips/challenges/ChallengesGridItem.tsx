import {
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
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
  const isLocked = challenge.status === "locked";
  const statusMeta = getStatusMeta(challenge.status);
  const cardStatusStyle =
    challenge.status === "to_solve"
      ? styles.cardToSolve
      : challenge.status === "submitted"
        ? styles.cardSubmitted
        : challenge.status === "solved"
          ? styles.cardSolved
          : undefined;

  return (
    <TouchableOpacity
      onPress={() => onPress(challenge)}
      disabled={isLocked}
      style={[
        styles.card,
        cardStatusStyle,
        isLocked && styles.cardLocked,
      ]}
    >
      <ImageBackground
        source={challenge.image ? { uri: challenge.image } : undefined}
        style={[
          styles.imageFill,
          !challenge.image && {
            backgroundColor: isLocked ? colors.surfaceDark : `${challenge.iconColor}1f`,
          },
        ]}
        imageStyle={styles.imageFillRadius}
        resizeMode="cover"
      >
        <View style={styles.imageOverlayTop} />

        <View style={styles.cardInner}>
          <View style={styles.cardHeader}>
          <View
            style={[
              styles.statusBadge,
              isLocked && styles.statusBadgeLocked,
              {
                borderColor: statusMeta.borderColor,
                backgroundColor: statusMeta.backgroundColor,
              },
            ]}
          >
            {isLocked && (
              <Ionicons name="lock-closed" size={10} color={statusMeta.textColor} />
            )}
            <Text style={[styles.statusBadgeText, { color: statusMeta.textColor }]}>
              {statusMeta.label}
            </Text>
          </View>

          {isLocked ? (
            <Ionicons name="lock-closed" size={16} color={colors.textMuted} />
          ) : (
            <Text style={styles.pointsBadge}>
              +{challenge.points} MAX
            </Text>
          )}
          </View>

          {!challenge.image && (
            <View style={styles.iconWrapper}>
              <Ionicons
                name={challenge.icon as keyof typeof Ionicons.glyphMap}
                size={24}
                color={isLocked ? colors.textMuted : challenge.iconColor}
              />
            </View>
          )}

          <View style={styles.content}>
            <Text style={styles.title} numberOfLines={2}>
              {challenge.title}
            </Text>
            <Text style={styles.joinedText}>
              {challenge.participantGroupsCount} groups joined
            </Text>
          </View>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
}

const getStatusMeta = (status: ChallengeListItem["status"]) => {
  switch (status) {
    case "solved":
      return {
        label: "Solved",
        textColor: "#22c55e",
        borderColor: "rgba(34,197,94,0.45)",
        backgroundColor: "rgba(34,197,94,0.2)",
      };
    case "submitted":
      return {
        label: "Submitted",
        textColor: "#f59e0b",
        borderColor: "rgba(245,158,11,0.45)",
        backgroundColor: "rgba(245,158,11,0.2)",
      };
    case "rejected":
      return {
        label: "Rejected",
        textColor: "#ef4444",
        borderColor: "rgba(239,68,68,0.45)",
        backgroundColor: "rgba(239,68,68,0.2)",
      };
    case "completed":
      return {
        label: "Completed",
        textColor: "#94a3b8",
        borderColor: "rgba(148,163,184,0.45)",
        backgroundColor: "rgba(15,23,42,0.78)",
      };
    case "locked":
      return {
        label: "Locked",
        textColor: "#f1f5f9",
        borderColor: "rgba(241,245,249,0.45)",
        backgroundColor: "rgba(15,23,42,0.78)",
      };
    case "to_solve":
    default:
      return {
        label: "To solve",
        textColor: colors.primary,
        borderColor: "rgba(0,206,209,0.45)",
        backgroundColor: "rgba(0,206,209,0.2)",
      };
  }
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardDark,
    borderRadius: borderRadius.lg,
    aspectRatio: 1,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    flexDirection: "column",
    justifyContent: "space-between",
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    overflow: "hidden",
  },
  cardToSolve: {
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.2,
    shadowRadius: 15,
  },
  cardSubmitted: {
    borderColor: "#f59e0b",
    shadowColor: "#f59e0b",
    shadowOpacity: 0.2,
    shadowRadius: 15,
  },
  cardSolved: {
    borderColor: "#22c55e",
    shadowColor: "#22c55e",
    shadowOpacity: 0.2,
    shadowRadius: 15,
  },
  cardLocked: {
    opacity: 0.6,
  },
  imageFill: {
    flex: 1,
    padding: spacing.sm,
  },
  imageFillRadius: {
    borderRadius: borderRadius.lg,
  },
  imageOverlayTop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10,11,13,0.28)",
  },
  cardInner: {
    flex: 1,
    justifyContent: "space-between",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    zIndex: 1,
  },
  statusBadge: {
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: 3,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statusBadgeLocked: {
    borderColor: "rgba(241,245,249,0.55)",
    backgroundColor: "rgba(15,23,42,0.82)",
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: typography.bold,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(10,11,13,0.58)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    zIndex: 1,
  },
  pointsBadge: {
    backgroundColor: "rgba(10, 11, 13, 0.62)",
    color: colors.white,
    fontSize: 10,
    fontWeight: typography.bold,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    textTransform: "uppercase",
    letterSpacing: 1,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  content: {
    alignSelf: "stretch",
    backgroundColor: "rgba(10,11,13,0.62)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  title: {
    fontSize: typography.sm,
    fontWeight: typography.bold,
    color: colors.white,
    lineHeight: 18,
  },
  joinedText: {
    fontSize: 10,
    fontWeight: typography.bold,
    letterSpacing: 1,
    marginTop: spacing.sm,
    textTransform: "uppercase",
    color: colors.textMuted,
  },
});
