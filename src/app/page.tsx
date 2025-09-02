import { Card, Flex, Heading, Separator, Text } from "@radix-ui/themes";

import { auth } from "~/server/auth";
import NavGrid from "~/components/NavGrid";
import ImageAdnotation from "~/components/ImageAdnotation";
import PWAInstallPrompt from "~/components/PWAInstallPrompt";

// Component for authenticated users - the main dashboard
function AuthenticatedDashboard() {
  return (
    <Card size={{ initial: "4", md: "5" }}>
      <Flex gap={{ initial: "4", md: "5" }} direction="column" align="center" justify="center">
        <Heading size={{ initial: "4", md: "5", lg: "6" }} style={{ fontFamily: "Roboto Slab" }}>Welcome to the Treasure Bank!</Heading>
        <Separator orientation="horizontal" size={{ initial: "2", md: "3", lg: "4" }} />
        <NavGrid />
      </Flex>
    </Card>
  );
}

// Component for unauthenticated users - login prompt
function UnauthenticatedView() {
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

export default async function Home() {
  const session = await auth();

  return (
    <>
      {session?.user ? <AuthenticatedDashboard /> : <UnauthenticatedView />}
      <PWAInstallPrompt /></>
  );
}
