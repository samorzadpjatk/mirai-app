import { YStack, Spinner } from "@mirai-app/ui";

export function GroupEditLoadingState() {
  return (
    <YStack
      flex={1}
      backgroundColor="rgba(23, 24, 28, 1)"
      justifyContent="center"
      alignItems="center"
    >
      <Spinner size="large" color="primary" />
    </YStack>
  );
}
