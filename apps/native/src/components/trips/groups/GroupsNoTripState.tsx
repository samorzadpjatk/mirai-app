import { TouchableOpacity } from "react-native";
import { YStack, Text } from "@mirai-app/ui";

interface GroupsNoTripStateProps {
  onGoBack: () => void;
}

export function GroupsNoTripState({ onGoBack }: GroupsNoTripStateProps) {
  return (
    <YStack
      flex={1}
      justifyContent="center"
      alignItems="center"
      backgroundColor="$backgroundDark"
    >
      <Text fontSize="$lg" color="$textMuted" marginBottom="$lg">
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
