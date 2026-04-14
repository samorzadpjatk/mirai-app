import { styled, Text, YStack } from "@mirai-app/ui";

interface TripsEmptyStateProps {
  title: string;
  subtitle: string;
}

const EmptyStateContainer = styled(YStack, {
  name: "EmptyStateContainer",
  alignItems: "center",
  paddingVertical: "$xxxl",
});

const EmptyStateTitle = styled(Text, {
  name: "EmptyStateTitle",
  fontSize: "$xl",
  fontWeight: "$bold",
  color: "$white",
  marginBottom: "$sm",
});

const EmptyStateSubtitle = styled(Text, {
  name: "EmptyStateSubtitle",
  fontSize: "$base",
  color: "$textSecondary",
});

export function TripsEmptyState({ title, subtitle }: TripsEmptyStateProps) {
  return (
    <EmptyStateContainer>
      <EmptyStateTitle>{title}</EmptyStateTitle>
      <EmptyStateSubtitle>{subtitle}</EmptyStateSubtitle>
    </EmptyStateContainer>
  );
}
