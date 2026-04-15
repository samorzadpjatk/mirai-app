import { TouchableOpacity } from "react-native";
import { YStack, Text } from "@mirai-app/ui";

interface GroupCreateNoTripStateProps {
  onGoBack: () => void;
}

export function GroupCreateNoTripState({
  onGoBack,
}: GroupCreateNoTripStateProps) {
  return (
    <YStack
      flex={1}
      justifyContent="center"
      alignItems="center"
      backgroundColor="$background"
    >
      <Text fontSize="$lg" color="$colorMuted" marginBottom="$lg">
        No trip selected
      </Text>
      <TouchableOpacity onPress={onGoBack}>
        <Text color="$primary" fontWeight="bold">
          Go Back
        </Text>
      </TouchableOpacity>
    </YStack>
  );
}
