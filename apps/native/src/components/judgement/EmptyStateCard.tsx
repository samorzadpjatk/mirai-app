import { Ionicons } from "@expo/vector-icons";
import { YStack } from "tamagui";
import { Text, colorTokens } from "@mirai-app/ui";

const EmptyStateCard = ({ maxCardHeight }: { maxCardHeight: number }) => {
  return (
    <YStack
      backgroundColor={colorTokens.cardDark}
      borderRadius="$lg"
      padding="$lg"
      borderWidth={1}
      borderColor={colorTokens.borderWhite5}
      overflow="hidden"
      maxHeight={maxCardHeight}
      alignItems="center"
      justifyContent="center"
      gap="$md"
    >
      <Ionicons name="checkmark-done" size={42} color={colorTokens.primary} />
      <Text variant="h2" color="primary">
        All caught up
      </Text>
      <Text variant="body" color="muted" textAlign="center">
        There are no pending submissions to review.
      </Text>
    </YStack>
  );
};

export { EmptyStateCard };
