import { TouchableOpacity } from "react-native";
import { Card, Text, YStack } from "@mirai-app/ui";

interface ChallengeNotFoundStateProps {
  onGoBack: () => void;
}

export function ChallengeNotFoundState({
  onGoBack,
}: ChallengeNotFoundStateProps) {
  return (
    <YStack flex={1} justifyContent="center" alignItems="center" padding="$5">
      <Text variant="h4" color="white" marginBottom="$3">
        Challenge not found
      </Text>
      <TouchableOpacity onPress={onGoBack} activeOpacity={0.8}>
        <Card backgroundColor="primary" padding="$3" borderRadius="$md">
          <Text fontWeight="$bold" color="#17181c">
            Go Back
          </Text>
        </Card>
      </TouchableOpacity>
    </YStack>
  );
}
