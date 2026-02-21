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
  const submissionTypeMeta = getSubmissionTypeMeta(challenge.submissionType);
  const scoringMeta = getScoringMeta(challenge.scoringCategory);
  const cardStatusStyle =
    challenge.status === "to_solve"
      ? styles.cardToSolve
      : challenge.status === "visible"
        ? styles.cardVisible
      : challenge.status === "submitted"
        ? styles.cardSubmitted
        : challenge.status === "solved"
          ? styles.cardSolved
          : undefined;

  return (
    <TouchableOpacity
      onPress={() => onPress(challenge)}
      disabled={isLocked}
      style={[styles.card, cardStatusStyle, isLocked && styles.cardLocked]}
    >
      <ImageBackground
        source={challenge.image ? { uri: challenge.image } : undefined}
        style={[
          styles.imageFill,
          !challenge.image && {
            backgroundColor: isLocked
              ? colors.surfaceDark
              : `${challenge.iconColor}1f`,
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
                <Ionicons
                  name="lock-closed"
                  size={10}
                  color={statusMeta.textColor}
                />
              )}
              <Text
                style={[
                  styles.statusBadgeText,
                  { color: statusMeta.textColor },
                ]}
              >
                {statusMeta.label}
              </Text>
            </View>

            <View style={styles.headerRight}>
              {isLocked ? (
                <Ionicons
                  name="lock-closed"
                  size={16}
                  color={colors.textMuted}
                />
              ) : (
                <Text style={styles.pointsBadge}>+{challenge.points} MAX</Text>
              )}
              <View style={styles.headerJoinedRow}>
                <Ionicons name="people" size={12} color="#22c55e" />
                <Text style={styles.headerJoinedCount}>
                  {challenge.participantGroupsCount}
                </Text>
              </View>
            </View>
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
            <View style={styles.metaRow}>
              <View style={styles.metaBadge}>
                <Ionicons
                  name={
                    submissionTypeMeta.icon as keyof typeof Ionicons.glyphMap
                  }
                  size={11}
                  color="#cbd5e1"
                />
                <Text style={styles.metaBadgeText}>
                  {submissionTypeMeta.label}
                </Text>
              </View>
              <View style={styles.metaBadge}>
                <Ionicons
                  name={scoringMeta.icon as keyof typeof Ionicons.glyphMap}
                  size={11}
                  color="#cbd5e1"
                />
                <Text style={styles.metaBadgeText}>{scoringMeta.label}</Text>
              </View>
            </View>
            <Text style={styles.title} numberOfLines={2}>
              {challenge.title}
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
      return {
        label: "Active",
        textColor: colors.primary,
        borderColor: "rgba(0,206,209,0.45)",
        backgroundColor: "rgba(0,206,209,0.2)",
      };
    case "visible":
      return {
        label: "Visible",
        textColor: "#60a5fa",
        borderColor: "rgba(96,165,250,0.45)",
        backgroundColor: "rgba(96,165,250,0.2)",
      };
    default:
      return {
        label: "Active",
        textColor: colors.primary,
        borderColor: "rgba(0,206,209,0.45)",
        backgroundColor: "rgba(0,206,209,0.2)",
      };
  }
};

const getSubmissionTypeMeta = (
  submissionType: ChallengeListItem["submissionType"],
) => {
  switch (submissionType) {
    case "MULTI_IMAGE":
      return { label: "Multi", icon: "images-outline" };
    case "VIDEO":
      return { label: "Video", icon: "videocam-outline" };
    case "TEXT":
      return { label: "Text", icon: "document-text-outline" };
    case "IMAGE_LOCATION":
      return { label: "Photo+GPS", icon: "camera-outline" };
    case "LOCATION":
      return { label: "GPS", icon: "location-outline" };
    case "QR_CODE":
      return { label: "QR", icon: "qr-code-outline" };
    case "IMAGE":
    default:
      return { label: "Photo", icon: "image-outline" };
  }
};

const getScoringMeta = (
  scoringCategory: ChallengeListItem["scoringCategory"],
) => {
  switch (scoringCategory) {
    case "SPEED":
      return { label: "Speed", icon: "flash-outline" };
    case "UNLIMITED":
      return { label: "Unlimited", icon: "infinite-outline" };
    case "PEER_VOTING":
      return { label: "Voting", icon: "people-outline" };
    case "JUDGED_STAFF":
      return { label: "Staff", icon: "shield-checkmark-outline" };
    default:
      return { label: "Scoring", icon: "stats-chart-outline" };
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
  cardVisible: {
    borderColor: "#60a5fa",
    shadowColor: "#60a5fa",
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
  headerRight: {
    alignItems: "flex-end",
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
  headerJoinedRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    backgroundColor: "rgba(10,11,13,0.5)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.28)",
  },
  headerJoinedCount: {
    fontSize: 11,
    fontWeight: typography.bold,
    color: "#22c55e",
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
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginBottom: spacing.xs,
  },
  metaBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  metaBadgeText: {
    fontSize: 8,
    fontWeight: typography.bold,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: "#cbd5e1",
  },
  title: {
    fontSize: typography.sm,
    fontWeight: typography.bold,
    color: colors.white,
    lineHeight: 18,
  },
});
