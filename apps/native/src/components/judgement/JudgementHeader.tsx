import { Text, View } from "react-native";
import { useJudgement } from "~/stores/judgement";
import { makeJudgementTextStyles, makeJudgementViewStyles } from "~/styles/judgement";
import { useThemedStyles } from "~/theme/TripThemeProvider";

interface JudgementHeaderProps {
  tripId: string;
  challengeId: string;
}

const JudgementHeader = ({ tripId, challengeId }: JudgementHeaderProps) => {
  const viewStyles = useThemedStyles(makeJudgementViewStyles);
  const textStyles = useThemedStyles(makeJudgementTextStyles);
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
