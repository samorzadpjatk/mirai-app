import { View, Text } from 'react-native';
import { useJudgement } from '~/contexts/judgement';
import { viewStyles, textStyles } from '~/styles/judgement';

const JudgementHeader = () => {
  const { challengeName, pendingCount, stats } = useJudgement();

  return (
    <View style={viewStyles.header}>
      <View style={viewStyles.headerText}>
        <Text style={textStyles.headerTitle}>{challengeName}</Text>
        <Text style={textStyles.headerSubtitle}>
          {pendingCount} pending • {stats.approved} approved • {stats.rejected} rejected
        </Text>
      </View>
    </View>
  );
};

export { JudgementHeader };
