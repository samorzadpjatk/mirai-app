import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { CardStack } from "~/components/judgement/CardStack";
import { JudgementHeader } from "~/components/judgement/JudgementHeader";
import { useJudgement } from "~/stores/judgement";
import { judgementStore } from "~/stores/judgement/judgementStores";
import { colors } from "~/styles";
import { viewStyles } from "~/styles/judgement";

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
      <View style={[viewStyles.container, viewStyles.centered]}>
        <ActivityIndicator testID="judgement-loading" size="large" color={colors.primary} />
      </View>
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
