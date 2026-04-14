import { Ionicons } from "@expo/vector-icons";
import { YStack, XStack } from "tamagui";
import { type Submission } from "~/stores/judgement";
import { getInitials } from "~/utils/validation";
import { Text, colorTokens } from "@mirai-app/ui";

const QueuedSubmissionCard = ({
  submission,
  maxCardHeight,
}: {
  submission: Submission;
  maxCardHeight: number;
}) => {
  return (
    <YStack
      backgroundColor={colorTokens.cardDark}
      borderRadius="$lg"
      padding="$lg"
      borderWidth={1}
      borderColor={colorTokens.borderWhite5}
      overflow="hidden"
      maxHeight={maxCardHeight}
      position="absolute"
      top={8}
      left={8}
      right={8}
      opacity={0.5}
      scale={0.95}
    >
      <XStack
        alignItems="center"
        justifyContent="space-between"
        marginBottom="$md"
      >
        <YStack
          width={40}
          height={40}
          borderRadius={20}
          backgroundColor={colorTokens.primaryOpacity10}
          alignItems="center"
          justifyContent="center"
          overflow="hidden"
        >
          <Text variant="h5" color="primary">
            {getInitials(submission.group.name)}
          </Text>
        </YStack>
        <XStack alignItems="center" gap="$sm">
          <Text variant="h5" color="default">
            {submission.group.name}
          </Text>
          <Text variant="caption" color="muted">
            Next in line
          </Text>
        </XStack>
      </XStack>
      <YStack
        flex={1}
        backgroundColor={colorTokens.cardDark}
        borderRadius="$lg"
        borderWidth={1}
        borderColor={colorTokens.borderWhite5}
        alignItems="center"
        justifyContent="center"
      >
        <Ionicons name="time" size={32} color={colorTokens.textSecondary} />
        <Text variant="body" color="muted">
          Queued submission
        </Text>
      </YStack>
    </YStack>
  );
};

export { QueuedSubmissionCard };
