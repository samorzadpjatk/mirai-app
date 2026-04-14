import { styled, Text, YStack, Card } from "@mirai-app/ui";

interface TripNotFoundStateProps {
  onGoBack: () => void;
}

const Container = styled(YStack, {
  name: "TripNotFoundContainer",
  flex: 1,
  alignItems: "center",
  justifyContent: "center",
  padding: "$xxl",
});

const ErrorText = styled(Text, {
  name: "ErrorText",
  fontSize: "$xl",
  fontWeight: "$bold",
  color: "$white",
  marginBottom: "$md",
});

const ErrorLink = styled(Text, {
  name: "ErrorLink",
  fontSize: "$base",
  color: "$primary",
  fontWeight: "$bold",
});

export function TripNotFoundState({ onGoBack }: TripNotFoundStateProps) {
  return (
    <Container>
      <ErrorText>Trip not found</ErrorText>
      <Card
        onPress={onGoBack}
        backgroundColor="transparent"
        borderWidth={0}
        padding={0}
      >
        <ErrorLink>Go back</ErrorLink>
      </Card>
    </Container>
  );
}
