import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, borderRadius, typography } from "~/styles";

const submissionTypeLabels: Record<string, string> = {
  IMAGE: "Image",
  MULTI_IMAGE: "Multi Image",
  VIDEO: "Video",
  TEXT: "Text",
  IMAGE_LOCATION: "Image + Location",
  LOCATION: "Location",
  QR_CODE: "QR Code",
};

const submissionTypeRequirements: Record<string, string> = {
  IMAGE: "At least 1 image",
  MULTI_IMAGE: "At least 2 images",
  VIDEO: "Video file",
  TEXT: "Text description",
  IMAGE_LOCATION: "Image + GPS location",
  LOCATION: "GPS location",
  QR_CODE: "QR code (image or text)",
};

const scoringCategoryLabels: Record<string, string> = {
  SPEED: "Speed",
  UNLIMITED: "Unlimited",
  JUDGED_STAFF: "Judged (Staff)",
  PEER_VOTING: "Peer Voting",
};

interface ChallengeDetailsCardProps {
  challenge: {
    submissionType: string;
    scoringCategory: string;
    isRecurring: boolean;
    dailyStartTime?: string | null;
    dailyEndTime?: string | null;
    startTime?: Date | string | null;
    endTime?: Date | string | null;
    votingStartTime?: Date | string | null;
    votingEndTime?: Date | string | null;
    basePoints?: number | null;
    firstPlacePoints?: number | null;
    secondPlacePoints?: number | null;
    thirdPlacePoints?: number | null;
    targetLatitude?: number | null;
    targetLongitude?: number | null;
  };
}

const toDate = (value?: Date | string | null) => {
  if (!value) return null;
  return value instanceof Date ? value : new Date(value);
};

export function ChallengeDetailsCard({ challenge }: ChallengeDetailsCardProps) {
  const submissionTypeLabel =
    submissionTypeLabels[challenge.submissionType] ?? challenge.submissionType;
  const submissionRequirement =
    submissionTypeRequirements[challenge.submissionType] ??
    "Check challenge description";
  const scoringCategoryLabel =
    scoringCategoryLabels[challenge.scoringCategory] ?? challenge.scoringCategory;

  const start = toDate(challenge.startTime);
  const end = toDate(challenge.endTime);
  const votingStart = toDate(challenge.votingStartTime);
  const votingEnd = toDate(challenge.votingEndTime);

  const timeWindowText = challenge.isRecurring
    ? challenge.dailyStartTime && challenge.dailyEndTime
      ? `Daily ${challenge.dailyStartTime} - ${challenge.dailyEndTime}`
      : "Daily (time window not set)"
    : start && end
      ? `${start.toLocaleString()} - ${end.toLocaleString()}`
      : "No time limit";

  const votingWindowText =
    votingStart && votingEnd
      ? `${votingStart.toLocaleString()} - ${votingEnd.toLocaleString()}`
      : "Voting window not set";

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Challenge Details</Text>

      <View style={styles.row}>
        <Text style={styles.label}>Submission window</Text>
        <Text style={styles.value}>{timeWindowText}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Submission type</Text>
        <Text style={styles.value}>{submissionTypeLabel}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>What to submit</Text>
        <Text style={styles.value}>{submissionRequirement}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Scoring</Text>
        <Text style={styles.value}>{scoringCategoryLabel}</Text>
      </View>

      {(challenge.scoringCategory === "SPEED" ||
        challenge.scoringCategory === "PEER_VOTING") && (
        <View style={styles.row}>
          <Text style={styles.label}>Podium points</Text>
          <Text style={styles.value}>
            1st: {challenge.firstPlacePoints ?? 0} · 2nd: {challenge.secondPlacePoints ?? 0} · 3rd:{" "}
            {challenge.thirdPlacePoints ?? 0}
          </Text>
        </View>
      )}

      {challenge.scoringCategory === "PEER_VOTING" && (
        <View style={styles.row}>
          <Text style={styles.label}>Voting window</Text>
          <Text style={styles.value}>{votingWindowText}</Text>
        </View>
      )}

      <View style={styles.row}>
        <Text style={styles.label}>Base points</Text>
        <Text style={styles.value}>{challenge.basePoints ?? 0}</Text>
      </View>

      {challenge.targetLatitude && challenge.targetLongitude && (
        <View style={styles.row}>
          <Text style={styles.label}>Target location</Text>
          <Text style={styles.value}>
            {challenge.targetLatitude}, {challenge.targetLongitude}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.cardDark,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  title: {
    fontSize: typography.xs,
    fontWeight: typography.bold,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: spacing.md,
  },
  row: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 12,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  value: {
    fontSize: 14,
    color: colors.white,
    lineHeight: 20,
  },
});
