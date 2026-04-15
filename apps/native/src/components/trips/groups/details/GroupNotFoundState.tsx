import { TouchableOpacity } from "react-native";
import { YStack, Text } from "@mirai-app/ui";

interface GroupNotFoundStateProps {
  onGoBack: () => void;
}

export function GroupNotFoundState({ onGoBack }: GroupNotFoundStateProps) {
  return (
    <YStack
      flex={1}
      backgroundColor="#17181c"
      justifyContent="center"
      alignItems="center"
    >
      <Text fontSize="$lg" color="rgba(148, 163, 184, 1)" marginBottom="$4">
        Group not found
      </Text>
      <TouchableOpacity
        onPress={onGoBack}
        style={{
          backgroundColor: "rgba(0, 206, 209, 1)",
          paddingHorizontal: 20,
          paddingVertical: 12,
          borderRadius: 8,
        }}
      >
        <Text fontSize="$base" fontWeight="bold" color="#17181c">
          Go Back
        </Text>
      </TouchableOpacity>
    </YStack>
  );
}
