import { View, Text } from 'react-native';
import { useJudgement } from '~/stores/judgement';
import { viewStyles, textStyles } from '~/styles/judgement';

interface JudgementHeaderProps {
  tripId: string;
  challengeId: string;
}

const JudgementHeader = ({ tripId, challengeId }: JudgementHeaderProps) => {
  const { challengeName, pendingCount, stats } = useJudgement(tripId, challengeId);

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
