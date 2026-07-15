import { StyleSheet, Text, View } from "react-native";
import { WoodTexture } from "~/components/common/WoodTexture";
import { borderRadius, colors, spacing, typography } from "~/styles";
import { type ThemePalette, useThemedStyles } from "~/theme/TripThemeProvider";

interface ChallengeDetailsCardProps {
  challenge: {
    status?: string | null;
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

const formatVotingDuration = (start: Date, end: Date) => {
  const durationMs = end.getTime() - start.getTime();
  if (durationMs <= 0) {
    return "Duration set by organizer";
  }

  const totalHours = Math.max(1, Math.ceil(durationMs / (60 * 60 * 1000)));
  if (totalHours % 24 === 0) {
    const days = totalHours / 24;
    return `Duration: ${days} day${days === 1 ? "" : "s"}`;
  }

  return `Duration: ${totalHours} hour${totalHours === 1 ? "" : "s"}`;
};

export function ChallengeDetailsCard({ challenge }: ChallengeDetailsCardProps) {
  const styles = useThemedStyles(makeStyles);
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
      ? `${formatVotingDuration(votingStart, votingEnd)}\nStarts automatically after moderation.`
      : "Duration set by organizer. Starts automatically after moderation.";

  return (
    <View style={styles.container}>
      <WoodTexture radius={borderRadius.xl} />
      <View style={styles.header}>
        <Text style={styles.title}>Challenge Details</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Submission window</Text>
        <Text style={styles.value}>{timeWindowText}</Text>
      </View>

      {challenge.scoringCategory === "PEER_VOTING" && (
        <View style={styles.row}>
          <Text style={styles.label}>Voting</Text>
          <Text style={styles.value}>{votingWindowText}</Text>
        </View>
      )}

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

function makeStyles(palette: ThemePalette) {
  return StyleSheet.create({
    container: {
      backgroundColor: palette.cardDark,
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
    header: {
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
}
