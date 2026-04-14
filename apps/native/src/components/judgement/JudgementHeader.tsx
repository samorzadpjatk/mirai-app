import { XStack, YStack } from "tamagui";
import { useJudgement } from "~/stores/judgement";
import { Text, colorTokens } from "@mirai-app/ui";

interface JudgementHeaderProps {
  tripId: string;
  challengeId: string;
}

const JudgementHeader = ({ tripId, challengeId }: JudgementHeaderProps) => {
  const { challengeName, pendingCount, stats } = useJudgement(
    tripId,
    challengeId,
  );

  return (
    <XStack
      alignItems="center"
      justifyContent="space-between"
      paddingHorizontal="$lg"
      paddingVertical="$md"
      backgroundColor={colorTokens.backgroundDark}
      borderBottomWidth={1}
      borderBottomColor={colorTokens.borderWhite5}
    >
      <YStack flex={1}>
        <Text variant="h4" color="default">
          {challengeName}
        </Text>
        <Text variant="caption" color="muted" marginTop="$xs">
          {pendingCount} pending • {stats.approved} approved • {stats.rejected}{" "}
          rejected
        </Text>
      </YStack>
    </XStack>
  );
};

export { JudgementHeader };
