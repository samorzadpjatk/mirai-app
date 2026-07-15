import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import type { Submission } from "~/stores/judgement";
import { colors } from "~/styles";
import { makeJudgementTextStyles, makeJudgementViewStyles } from "~/styles/judgement";
import { useThemedStyles } from "~/theme/TripThemeProvider";
import { getInitials } from "~/utils/validation";

const QueuedSubmissionCard = ({
  submission,
  maxCardHeight,
}: {
  submission: Submission;
  maxCardHeight: number;
}) => {
  const viewStyles = useThemedStyles(makeJudgementViewStyles);
  const textStyles = useThemedStyles(makeJudgementTextStyles);

  return (
    <View
      testID="queued-submission-card"
      style={[viewStyles.card, viewStyles.cardBack, { maxHeight: maxCardHeight }]}
    >
      <View style={viewStyles.cardHeader}>
        <View style={viewStyles.groupAvatar}>
          <Text style={textStyles.groupAvatarText}>{getInitials(submission.group.name)}</Text>
        </View>
        <View style={viewStyles.groupMeta}>
          <Text style={textStyles.groupName}>{submission.group.name}</Text>
          <Text style={textStyles.groupHint}>Next in line</Text>
        </View>
      </View>
      <View style={viewStyles.cardPlaceholder}>
        <Ionicons name="time" size={32} color={colors.textSecondary} />
        <Text style={textStyles.cardPlaceholderText}>Queued submission</Text>
      </View>
    </View>
  );
};

export { QueuedSubmissionCard };
