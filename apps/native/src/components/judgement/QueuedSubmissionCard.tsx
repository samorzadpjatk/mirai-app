import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "~/styles";
import { type Submission } from "~/stores/judgement";
import { getInitials } from "~/utils/validation";
import { viewStyles, textStyles } from "~/styles/judgement";

const QueuedSubmissionCard = ({
  submission,
  maxCardHeight,
}: {
  submission: Submission;
  maxCardHeight: number;
}) => {
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
