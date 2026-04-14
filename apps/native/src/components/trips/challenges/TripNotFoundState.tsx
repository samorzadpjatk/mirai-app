import { YStack, Text } from "@mirai-app/ui";

interface TripNotFoundStateProps {
  message?: string;
}

export function TripNotFoundState({
  message = "Trip not found",
}: TripNotFoundStateProps) {
  return (
    <YStack
      flex={1}
      backgroundColor="#17181c"
      justifyContent="center"
      alignItems="center"
    >
      <Text variant="h5" color="muted">
        {message}
      </Text>
    </YStack>
  );
}
