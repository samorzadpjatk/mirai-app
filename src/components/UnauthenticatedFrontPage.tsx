import { Card, Flex, Heading, Separator, Text } from "@radix-ui/themes";

const UnauthenticatedFrontPage = () => {
  return (
    <Card size={{ initial: "4", md: "5" }}>
      <Flex gap={{ initial: "4", md: "5" }} direction="column" align="center" justify="center">
        <Heading size={{ initial: "6", md: "7", lg: "8" }} style={{ fontFamily: "Roboto Slab" }}>🪙 Treasure Bank 🪙</Heading>
        <Separator orientation="horizontal" size={{ initial: "2", md: "3", lg: "4" }} />
        <Flex gap={{ initial: "4", md: "5" }} direction="column" align="center" style={{ textAlign: "center" }}>
          <Heading size={{ initial: "4", md: "5", lg: "6" }} style={{ fontFamily: "Roboto Slab" }}>Welcome to the realm of coins!</Heading>
          <Text size={{ initial: "3", md: "4", lg: "5" }}>
            To take part in a medieval expedition and join your Guild, you must first log in.
          </Text>
          <Text size={{ initial: "2", md: "3", lg: "4" }}>
            🏆 Compete against other Guilds<br />
            💰 Acquire coins<br />
            👥 Manage your group<br />
            📊 Follow the leaderboard
          </Text>
        </Flex>
      </Flex>
    </Card>
  );
}
export default UnauthenticatedFrontPage;