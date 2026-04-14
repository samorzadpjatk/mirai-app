import { styled, Text, YStack } from "@mirai-app/ui";

interface TripsHeaderProps {
  title: string;
  subtitle: string;
}

const Header = styled(YStack, {
  name: "TripsHeader",
  marginBottom: "$md",
});

const Title = styled(Text, {
  name: "TripsTitle",
  fontSize: "$xxxl",
  fontWeight: "$bold",
  color: "$white",
  marginBottom: "$sm",
});

const Subtitle = styled(Text, {
  name: "TripsSubtitle",
  fontSize: "$base",
  color: "$textSecondary",
});

export function TripsHeader({ title, subtitle }: TripsHeaderProps) {
  return (
    <Header>
      <Title>{title}</Title>
      <Subtitle>{subtitle}</Subtitle>
    </Header>
  );
}
