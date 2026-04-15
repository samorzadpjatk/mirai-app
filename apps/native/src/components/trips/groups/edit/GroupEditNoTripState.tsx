import { TouchableOpacity } from "react-native";
import { YStack, Text } from "@mirai-app/ui";

interface GroupEditNoTripStateProps {
  onGoBack: () => void;
}

export function GroupEditNoTripState({ onGoBack }: GroupEditNoTripStateProps) {
  return (
    <YStack
      flex={1}
      backgroundColor="rgba(23, 24, 28, 1)"
      justifyContent="center"
      alignItems="center"
    >
      <Text fontSize={18} color="#475569" marginBottom="$4">
        No group selected
      </Text>
      <TouchableOpacity onPress={onGoBack}>
        <Text color="#00ced1" fontWeight="700">
          Go Back
        </Text>
      </TouchableOpacity>
    </YStack>
  );
}
