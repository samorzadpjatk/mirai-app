import { ActivityIndicator } from "react-native";
import { YStack } from "tamagui";
import { useJudgement } from "~/stores/judgement";
import { JudgementHeader } from "~/components/judgement/JudgementHeader";
import { CardStack } from "~/components/judgement/CardStack";
import { useEffect } from "react";
import { judgementStore } from "~/stores/judgement/judgementStores";
import { colorTokens } from "@mirai-app/ui";

interface JudgementContentProps {
  tripId: string;
  challengeId: string;
}

const JudgementContent = ({ tripId, challengeId }: JudgementContentProps) => {
  const { isLoading } = useJudgement(tripId, challengeId);

  // Reset dismissed IDs when scope changes (replaces JudgementScope logic)
  useEffect(() => {
    const state = judgementStore.getState();
    state.resetDismissedIds();
  }, [tripId, challengeId]);

  if (isLoading) {
    return (
      <YStack
        flex={1}
        backgroundColor={colorTokens.backgroundDark}
        alignItems="center"
        justifyContent="center"
      >
        <ActivityIndicator size="large" color={colorTokens.primary} />
      </YStack>
    );
  }

  return (
    <>
      <JudgementHeader tripId={tripId} challengeId={challengeId} />
      <CardStack tripId={tripId} challengeId={challengeId} />
    </>
  );
};

export { JudgementContent };
