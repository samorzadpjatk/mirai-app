import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { makeJudgementTextStyles, makeJudgementViewStyles } from "~/styles/judgement";
import { useThemedStyles, useTripTheme } from "~/theme/TripThemeProvider";

const EmptyStateCard = ({ maxCardHeight }: { maxCardHeight: number }) => {
  const { palette } = useTripTheme();
  const viewStyles = useThemedStyles(makeJudgementViewStyles);
  const textStyles = useThemedStyles(makeJudgementTextStyles);

  return (
    <View
      testID="empty-state-card"
      style={[viewStyles.card, viewStyles.emptyCard, { maxHeight: maxCardHeight }]}
    >
      <Ionicons name="checkmark-done" size={42} color={palette.primary} />
      <Text style={textStyles.emptyTitle}>All caught up</Text>
      <Text style={textStyles.emptyText}>There are no pending submissions to review.</Text>
    </View>
  );
};

export { EmptyStateCard };
