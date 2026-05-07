import { View, ActivityIndicator } from 'react-native';
import { colors } from '~/styles';
import { useJudgement } from '~/stores/judgement';
import { viewStyles } from '~/styles/judgement';
import { JudgementHeader } from '~/components/judgement/JudgementHeader';
import { CardStack } from '~/components/judgement/CardStack';
import { useEffect } from 'react';
import { judgementStore } from '~/stores/judgement/judgementStores';

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
