import { Card, YStack, H1, H2, Paragraph, Separator } from "tamagui";

const UnauthenticatedFrontPage = () => {
  return (
    <Card elevate bordered padding="$6">
      <YStack gap="$5" alignItems="center" justifyContent="center">
        <H1 fontFamily="$heading" textAlign="center">🪙 Treasure Bank 🪙</H1>
        <Separator />
        <YStack gap="$5" alignItems="center">
          <H2 fontFamily="$heading" textAlign="center">Welcome to the realm of coins!</H2>
          <Paragraph size="$6" textAlign="center">
            To take part in a medieval expedition and join your Guild, you must first log in.
          </Paragraph>
          <Paragraph size="$5" textAlign="center">
            🏆 Compete against other Guilds{"\n"}
            💰 Acquire coins{"\n"}
            👥 Manage your group{"\n"}
            📊 Follow the leaderboard
          </Paragraph>
        </YStack>
      </YStack>
    </Card>
  );
}
export default UnauthenticatedFrontPage;