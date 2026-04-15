import { YStack, Spinner } from "@mirai-app/ui";

export function GroupsLoadingState() {
  return (
    <YStack paddingVertical="$xxxl" alignItems="center">
      <Spinner size="large" />
    </YStack>
  );
}
