import { Card, Text, YStack } from "@mirai-app/ui";

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
    <Card
      marginBottom="$5"
      borderWidth={1}
      borderColor="rgba(255, 255, 255, 0.05)"
    >
      <YStack marginBottom="$4">
        <Text
          fontSize={10}
          fontWeight="$bold"
          color="muted"
          textTransform="uppercase"
          letterSpacing={2}
          marginBottom="$3"
        >
          Challenge Details
        </Text>
      </YStack>

      <YStack marginBottom="$4">
        <Text
          fontSize={12}
          color="muted"
          textTransform="uppercase"
          letterSpacing={1.5}
          marginBottom={4}
        >
          Submission window
        </Text>
        <Text fontSize={14} color="white" lineHeight={20}>
          {timeWindowText}
        </Text>
      </YStack>

      {challenge.scoringCategory === "PEER_VOTING" && (
        <YStack marginBottom="$4">
          <Text
            fontSize={12}
            color="muted"
            textTransform="uppercase"
            letterSpacing={1.5}
            marginBottom={4}
          >
            Voting
          </Text>
          <Text fontSize={14} color="white" lineHeight={20}>
            {votingWindowText}
          </Text>
        </YStack>
      )}

      {challenge.targetLatitude && challenge.targetLongitude && (
        <YStack>
          <Text
            fontSize={12}
            color="muted"
            textTransform="uppercase"
            letterSpacing={1.5}
            marginBottom={4}
          >
            Target location
          </Text>
          <Text fontSize={14} color="white" lineHeight={20}>
            {challenge.targetLatitude}, {challenge.targetLongitude}
          </Text>
        </YStack>
      )}
    </Card>
  );
}
