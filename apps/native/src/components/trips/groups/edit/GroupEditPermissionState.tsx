import { TouchableOpacity } from "react-native";
import { YStack, Text } from "@mirai-app/ui";

interface GroupEditPermissionStateProps {
  message: string;
  onGoBack: () => void;
}

export function GroupEditPermissionState({
  message,
  onGoBack,
}: GroupEditPermissionStateProps) {
  return (
    <YStack
      flex={1}
      backgroundColor="rgba(23, 24, 28, 1)"
      justifyContent="center"
      alignItems="center"
    >
      <Text fontSize={18} color="#475569" marginBottom="$4">
        {message}
      </Text>
      <TouchableOpacity onPress={onGoBack}>
        <Text color="#00ced1" fontWeight="700">
          Go Back
        </Text>
      </TouchableOpacity>
    </YStack>
  );
}
