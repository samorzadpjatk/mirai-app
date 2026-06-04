import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import { borderRadius, colors } from "~/styles";

interface ChallengeItem {
  id: string;
  title: string;
  basePoints: number;
  status: string;
  endTime: Date | string | null;
  tripId: string;
  submissionType:
    | "IMAGE"
    | "MULTI_IMAGE"
    | "VIDEO"
    | "TEXT"
    | "IMAGE_LOCATION"
    | "LOCATION"
    | "QR_CODE";
  scoringCategory: "SPEED" | "UNLIMITED" | "JUDGED_STAFF" | "PEER_VOTING";
  participantGroupsCount: number;
  pendingSubmissionsCount: number;
  autoApprove: boolean;
}

interface JudgedStaffProgress {
  votedAdmins: number;
  totalAdmins: number;
  pendingAdmins: number;
}

interface AdminChallengeListCardProps {
  challenge: ChallengeItem;
  judgedStaffProgress?: JudgedStaffProgress;
  onDelete: (id: string) => void;
  tripId: string;
}

export const statusColors: Record<string, string> = {
  HIDDEN: "#64748b",
  VISIBLE: "#0ea5e9",
  ACTIVE: "#22c55e",
  VOTING_PHASE: "#f59e0b",
  COMPLETED: "#10b981",
};

export function getSubmissionTypeMeta(submissionType: ChallengeItem["submissionType"]) {
  switch (submissionType) {
    case "MULTI_IMAGE":
      return { label: "Multi", icon: "images-outline" as const };
    case "VIDEO":
      return { label: "Video", icon: "videocam-outline" as const };
    case "TEXT":
      return { label: "Text", icon: "document-text-outline" as const };
    case "IMAGE_LOCATION":
      return {
        label: "Photo+GPS",
        icon: "camera-outline" as const,
        secondaryIcon: "location-outline" as const,
      };
    case "LOCATION":
      return { label: "GPS", icon: "location-outline" as const };
    case "QR_CODE":
      return { label: "QR", icon: "qr-code-outline" as const };
    default:
      return { label: "Photo", icon: "image-outline" as const };
  }
}

export function getScoringMeta(scoringCategory: ChallengeItem["scoringCategory"]) {
  switch (scoringCategory) {
    case "SPEED":
      return { label: "Speed", icon: "flash-outline" as const };
    case "UNLIMITED":
      return { label: "Unlimited", icon: "infinite-outline" as const };
    case "PEER_VOTING":
      return { label: "Voting", icon: "people-outline" as const };
    default:
      return { label: "Staff", icon: "shield-checkmark-outline" as const };
  }
}

const styles = {
  card: {
    backgroundColor: colors.cardDark,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: borderRadius.lg,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    borderRadius: 8,
    borderWidth: 1,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold" as const,
    color: colors.white,
    marginBottom: 4,
  },
  pointsRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
  },
  pointsText: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
  statusText: {
    fontSize: 12,
    textTransform: "uppercase" as const,
    fontWeight: "700" as const,
  },
  tagsContainer: {
    marginTop: 8,
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 6,
  },
  tag: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagText: {
    fontSize: 10,
    fontWeight: "700" as const,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  actionsContainer: {
    alignSelf: "stretch" as const,
    alignItems: "flex-end" as const,
    justifyContent: "space-between" as const,
    paddingVertical: 2,
  },
  statusIndicators: {
    gap: 6,
    alignItems: "flex-end" as const,
  },
  statusIndicator: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusIndicatorText: {
    fontSize: 10,
    fontWeight: "700" as const,
    textTransform: "uppercase" as const,
    letterSpacing: 0.3,
  },
  actionButtons: {
    flexDirection: "row" as const,
    gap: 4,
  },
  actionButton: {
    padding: 8,
  },
  emptyState: {
    padding: 24,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderDark,
    backgroundColor: colors.cardDark,
    alignItems: "center" as const,
  },
  emptyStateText: {
    color: colors.gray400,
  },
  loadingMoreContainer: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginTop: 16,
  },
  loadingMoreText: {
    fontSize: 12,
  },
};

export function AdminChallengeListCard({
  challenge,
  judgedStaffProgress,
  onDelete,
  tripId,
}: AdminChallengeListCardProps) {
  const router = useRouter();

  const statusColor = statusColors[challenge.status] ?? colors.gray400;
  const hasPendingSubmissions = challenge.pendingSubmissionsCount > 0;
  const pendingColor = hasPendingSubmissions ? "#ef4444" : "#64748b";
  const submissionEndTimestamp = challenge.endTime ? new Date(challenge.endTime).getTime() : null;
  const isStaffVotingAvailable =
    challenge.scoringCategory !== "JUDGED_STAFF" ||
    (submissionEndTimestamp !== null &&
      Number.isFinite(submissionEndTimestamp) &&
      submissionEndTimestamp <= new Date().getTime());
  const submissionTypeMeta = getSubmissionTypeMeta(challenge.submissionType);
  const scoringMeta = getScoringMeta(challenge.scoringCategory);

  const cardStyle = {
    ...styles.card,
    borderColor: `${statusColor}99`,
    borderLeftWidth: 4,
    borderLeftColor: statusColor,
  };

  const iconContainerStyle = {
    ...styles.iconContainer,
    backgroundColor: `${statusColor}1A`,
    borderColor: `${statusColor}59`,
  };

  const pointsTextStyle = {
    ...styles.pointsText,
    color: statusColor,
  };

  const statusTextStyle = {
    ...styles.statusText,
    color: statusColor,
  };

  const submissionTypeTagStyle = {
    ...styles.tag,
    borderColor: "rgba(148,163,184,0.3)",
    backgroundColor: "rgba(15,23,42,0.5)",
  };

  const scoringTagStyle = {
    ...styles.tag,
    borderColor: "rgba(148,163,184,0.3)",
    backgroundColor: "rgba(15,23,42,0.5)",
  };

  const participantsTagStyle = {
    ...styles.tag,
    borderColor: "rgba(34,197,94,0.35)",
    backgroundColor: "rgba(34,197,94,0.12)",
  };

  const staffProgressStyle = {
    ...styles.statusIndicator,
    borderColor: "rgba(14,165,233,0.45)",
    backgroundColor: "rgba(14,165,233,0.16)",
  };

  const pendingSubmissionsStyle = {
    ...styles.statusIndicator,
    borderColor: hasPendingSubmissions ? "rgba(239,68,68,0.45)" : "rgba(100,116,139,0.45)",
    backgroundColor: hasPendingSubmissions ? "rgba(239,68,68,0.18)" : "rgba(100,116,139,0.14)",
  };

  const handleEdit = () => {
    router.push({
      pathname: "/admin/challenges/[id]",
      params: { id: challenge.id, tripId },
    });
  };

  const handleDelete = () => {
    onDelete(challenge.id);
  };

  const handleStaffVote = () => {
    router.push({
      pathname: "/admin/challenges/staff-vote",
      params: { tripId, challengeId: challenge.id },
    });
  };

  const handleSubmissions = () => {
    router.push({
      pathname: "/admin/challenges/submissions",
      params: { tripId, challengeId: challenge.id },
    });
  };

  const handleJudgement = () => {
    const shouldUseSubmissionsScreen =
      challenge.submissionType === "TEXT" && !challenge.autoApprove;

    router.push({
      pathname: shouldUseSubmissionsScreen
        ? "/admin/challenges/submissions"
        : "/admin/challenges/judgement",
      params: { tripId, challengeId: challenge.id },
    });
  };

  return (
    <View style={cardStyle}>
      <View style={iconContainerStyle}>
        <Ionicons name="trophy" size={24} color={statusColor} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{challenge.title}</Text>
        <View style={styles.pointsRow}>
          <Text style={pointsTextStyle}>{challenge.basePoints} PTS</Text>
          <Text style={statusTextStyle}>{challenge.status.replace(/_/g, " ")}</Text>
        </View>
        <View style={styles.tagsContainer}>
          <View style={submissionTypeTagStyle}>
            <Ionicons name={submissionTypeMeta.icon} size={12} color="#cbd5e1" />
            {submissionTypeMeta.secondaryIcon ? (
              <Ionicons name={submissionTypeMeta.secondaryIcon} size={12} color="#cbd5e1" />
            ) : null}
            <Text
              style={{
                ...styles.tagText,
                color: "#cbd5e1",
              }}
            >
              {submissionTypeMeta.label}
            </Text>
          </View>

          <View style={scoringTagStyle}>
            <Ionicons name={scoringMeta.icon} size={12} color="#cbd5e1" />
            <Text
              style={{
                ...styles.tagText,
                color: "#cbd5e1",
              }}
            >
              {scoringMeta.label}
            </Text>
          </View>

          <View style={participantsTagStyle}>
            <Ionicons name="people" size={12} color="#22c55e" />
            <Text
              style={{
                ...styles.tagText,
                color: "#22c55e",
              }}
            >
              {challenge.participantGroupsCount}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.actionsContainer}>
        <View style={styles.statusIndicators}>
          {challenge.scoringCategory === "JUDGED_STAFF" ? (
            <View style={staffProgressStyle}>
              <Ionicons name="shield-checkmark-outline" size={12} color="#38bdf8" />
              <Text
                style={{
                  ...styles.statusIndicatorText,
                  color: "#38bdf8",
                }}
              >
                {judgedStaffProgress
                  ? `${judgedStaffProgress.votedAdmins}/${judgedStaffProgress.totalAdmins}`
                  : "..."}
              </Text>
            </View>
          ) : null}

          <View style={pendingSubmissionsStyle}>
            <Ionicons name="time-outline" size={12} color={pendingColor} />
            <Text
              style={{
                ...styles.statusIndicatorText,
                color: pendingColor,
              }}
            >
              {challenge.pendingSubmissionsCount}
            </Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          {challenge.scoringCategory === "JUDGED_STAFF" ? (
            <TouchableOpacity
              style={[styles.actionButton, { opacity: isStaffVotingAvailable ? 1 : 0.45 }]}
              disabled={!isStaffVotingAvailable}
              onPress={handleStaffVote}
            >
              <Ionicons
                name="git-compare"
                size={20}
                color={isStaffVotingAvailable ? colors.primary : colors.gray400}
              />
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity style={styles.actionButton} onPress={handleSubmissions}>
                <Ionicons name="images" size={20} color={colors.gray400} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton} onPress={handleJudgement}>
                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity style={styles.actionButton} onPress={handleEdit}>
            <Ionicons name="create" size={20} color={colors.gray400} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
            <Ionicons name="trash" size={20} color={colors.gray400} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
