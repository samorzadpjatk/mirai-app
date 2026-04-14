import { styled, Text, YStack } from "@mirai-app/ui";

interface LeaderboardEmptyStateProps {
  message: string;
}

const Container = styled(YStack, {
  name: "LeaderboardEmptyState",
  flex: 1,
  backgroundColor: "$backgroundDark",
  justifyContent: "center",
  alignItems: "center",
});

const Message = styled(Text, {
  name: "LeaderboardEmptyMessage",
  color: "$textMuted",
  fontSize: "$lg",
});

export function LeaderboardEmptyState({ message }: LeaderboardEmptyStateProps) {
  return (
    <Container>
      <Message>{message}</Message>
    </Container>
  );
}
