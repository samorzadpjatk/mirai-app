import { ActivityIndicator } from "react-native";
import { YStack } from "@mirai-app/ui";

export function GroupDetailsLoadingState() {
  return (
    <YStack
      flex={1}
      backgroundColor="#17181c"
      justifyContent="center"
      alignItems="center"
    >
      <ActivityIndicator size="large" color="rgba(0, 206, 209, 1)" />
    </YStack>
  );
}
