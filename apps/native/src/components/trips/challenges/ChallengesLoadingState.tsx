import { YStack, Spinner } from "@mirai-app/ui";

export function ChallengesLoadingState() {
  return (
    <YStack
      flex={1}
      backgroundColor="#17181c"
      justifyContent="center"
      alignItems="center"
    >
      <Spinner size="large" color="#00ced1" />
    </YStack>
  );
}
