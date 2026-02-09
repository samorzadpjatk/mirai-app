import { View, ActivityIndicator } from 'react-native';
import { colors } from '~/styles';
import { useJudgement } from '~/contexts/judgement';
import { viewStyles } from '~/styles/judgement';
import { JudgementHeader } from '~/components/judgement/JudgementHeader';
import { CardStack } from '~/components/judgement/CardStack';

const JudgementContent = () => {
  const { isLoading } = useJudgement();

  if (isLoading) {
    return (
      <View style={[viewStyles.container, viewStyles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <JudgementHeader />
      <CardStack />
    </>
  );
};

export { JudgementContent };
