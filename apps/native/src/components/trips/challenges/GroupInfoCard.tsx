import { Card, Text, XStack, YStack } from "@mirai-app/ui";

interface GroupInfoCardProps {
  groupName: string;
  position?: number;
  totalGroups?: number;
  pointsDifference?: number;
  targetPosition?: number;
  targetGroupName?: string;
  completedChallengesCount?: number;
  totalChallengesCount?: number;
}

export function GroupInfoCard({
  groupName,
  position,
  totalGroups,
  pointsDifference,
  targetPosition,
  targetGroupName,
  completedChallengesCount,
  totalChallengesCount,
}: GroupInfoCardProps) {
  const isLeading = position === 1;
  const deltaPoints = pointsDifference ?? 0;
  let targetLabel: string | null = null;
  if (typeof targetPosition === "number" && targetGroupName) {
    targetLabel = `#${targetPosition} ${targetGroupName}`;
  } else if (targetGroupName) {
    targetLabel = targetGroupName;
  } else if (typeof targetPosition === "number") {
    targetLabel = `#${targetPosition}`;
  }
  const pointsContext = isLeading
    ? targetLabel
      ? `Przewaga ${deltaPoints} pkt nad ${targetLabel}`
      : "Prowadzicie w tabeli"
    : targetLabel
      ? `Brakuje ${deltaPoints} pkt do ${targetLabel}`
      : "Brakuje do wyższej pozycji";

  return (
    <Card
      marginBottom="$3"
      paddingHorizontal="$4"
      paddingVertical="$2"
      borderWidth={1}
      borderColor="rgba(255, 255, 255, 0.05)"
    >
      <XStack alignItems="center" justifyContent="space-between" gap="$2">
        <YStack flex={1}>
          <Text
            fontSize={9}
            fontWeight="$bold"
            color="muted"
            textTransform="uppercase"
            letterSpacing={1.4}
            marginBottom={2}
          >
            Your Group
          </Text>
          <Text
            fontSize={16}
            fontWeight="$bold"
            color="white"
            letterSpacing={-0.2}
            numberOfLines={1}
          >
            {groupName}
          </Text>
        </YStack>
        <YStack
          borderRadius="$full"
          paddingHorizontal="$2"
          paddingVertical={4}
          borderWidth={1}
          borderColor="rgba(0, 206, 209, 0.38)"
          backgroundColor="rgba(0, 206, 209, 0.14)"
        >
          <Text color="primary" fontSize={11} fontWeight="$bold">
            #{position ?? "-"} / {totalGroups ?? 0}
          </Text>
        </YStack>
      </XStack>

      <XStack marginTop="$1" alignItems="baseline" gap="$1">
        <Text
          fontSize={16}
          fontWeight="$bold"
          color={isLeading ? "#10b981" : "#ef4444"}
        >
          {deltaPoints} pts
        </Text>
        <Text flex={1} fontSize={12} fontWeight="$medium" color="muted">
          {pointsContext}
        </Text>
      </XStack>

      <XStack marginTop="$1" alignItems="center" justifyContent="space-between">
        <Text
          fontSize={11}
          fontWeight="$bold"
          color="muted"
          textTransform="uppercase"
          letterSpacing={1}
        >
          Challenges done
        </Text>
        <XStack alignItems="baseline" gap={4}>
          <Text fontSize={16} fontWeight="$bold" color="primary">
            {completedChallengesCount ?? 0}
          </Text>
          <Text
            fontSize={11}
            fontWeight="$bold"
            color="rgba(0, 206, 209, 0.7)"
            textTransform="uppercase"
          >
            / {totalChallengesCount ?? 0}
          </Text>
        </XStack>
      </XStack>
    </Card>
  );
}
