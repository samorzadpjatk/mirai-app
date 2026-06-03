import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { colors } from "~/styles";
import { textStyles, viewStyles } from "~/styles/judgement";

const EmptyStateCard = ({ maxCardHeight }: { maxCardHeight: number }) => {
  return (
    <View
      testID="empty-state-card"
      style={[viewStyles.card, viewStyles.emptyCard, { maxHeight: maxCardHeight }]}
    >
      <Ionicons name="checkmark-done" size={42} color={colors.primary} />
      <Text style={textStyles.emptyTitle}>All caught up</Text>
      <Text style={textStyles.emptyText}>There are no pending submissions to review.</Text>
    </View>
  );
};

export { EmptyStateCard };
