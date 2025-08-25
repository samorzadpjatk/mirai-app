import { Card, Flex, Heading, Separator, Text } from "@radix-ui/themes";

import { auth } from "~/server/auth";
import { HydrateClient } from "~/trpc/server";
import NavGrid from "~/components/NavGrid";
import ImageAdnotation from "~/components/ImageAdnotation";

// Component for authenticated users - the main dashboard
function AuthenticatedDashboard() {
  return (
    <Card size={{ initial: "2", md: "3", lg: "4" }}>
      <Flex gap={{ initial: "2", md: "3", lg: "4" }} direction="column" align="center" justify="center">
        <Heading size={{ initial: "4", md: "5", lg: "6" }} style={{ fontFamily: "Roboto Slab" }}>Witaj w Banku Monet!</Heading>
        <Separator orientation="horizontal" size={{ initial: "2", md: "3", lg: "4" }} />
        <NavGrid />
      </Flex>
    </Card>
  );
}

// Component for unauthenticated users - login prompt
function UnauthenticatedView() {
  return (
      <Card size={{ initial: "2", md: "3", lg: "4" }}>
        <Flex gap={{ initial: "3", md: "4", lg: "5" }} direction="column" align="center" justify="center" style={{ minHeight: "60vh" }}>
          <Heading size={{ initial: "6", md: "7", lg: "8" }} style={{ fontFamily: "Roboto Slab" }}>🏰 Bank Monet</Heading>
          <Separator orientation="horizontal" size={{ initial: "2", md: "3", lg: "4" }} />
          <Flex gap={{ initial: "2", md: "3", lg: "4" }} direction="column" align="center" style={{ textAlign: "center" }}>
            <Heading size={{ initial: "4", md: "5", lg: "6" }} style={{ fontFamily: "Roboto Slab" }}>Witaj w Królestwie Monet!</Heading>
            <Text size={{ initial: "3", md: "4", lg: "5" }}>
              Aby wziąć udział w średniowiecznej wyprawie i dołączyć do swojej Gildii, musisz się najpierw zalogować.
            </Text>
            <Text size={{ initial: "2", md: "3", lg: "4" }}>
              🏆 Rywalizuj z innymi Gildiami<br />
              💰 Zdobywaj monety<br />
              👥 Zarządzaj swoją grupą<br />
              📊 Śledź ranking
            </Text>
          </Flex>
        </Flex>
      </Card>
  );
}

export default async function Home() {
  const session = await auth();

  return (
    <HydrateClient>
      {session?.user ? <AuthenticatedDashboard /> : <UnauthenticatedView />}
      <ImageAdnotation />
    </HydrateClient>
  );
}
