import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "~/styles";
import { viewStyles, textStyles } from "~/styles/judgement";

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
