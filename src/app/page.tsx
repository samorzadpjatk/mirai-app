import { Card, Container, Flex, Heading, Separator, Text, Button } from "@radix-ui/themes";
import Link from "next/link";

import { auth } from "~/server/auth";
import { HydrateClient } from "~/trpc/server";
import NavGrid from "./_components/nav_grid";

// Component for authenticated users - the main dashboard
function AuthenticatedDashboard() {
  return (
    <Container>
      <Card size="5">
        <Flex gap={"2"} direction={"column"} align="center" justify="center">
          <Heading size={"8"} style={{ fontFamily: "Roboto Slab" }}>Witaj w Banku Monet!</Heading>
          <Separator orientation="horizontal" size="4" />
          <NavGrid />
        </Flex>
      </Card>
    </Container>
  );
}

// Component for unauthenticated users - login prompt
function UnauthenticatedView() {
  return (
    <Container>
      <Card size="5">
        <Flex gap={"4"} direction={"column"} align="center" justify="center" style={{ minHeight: "60vh" }}>
          <Heading size={"8"} style={{ fontFamily: "Roboto Slab" }}>🏰 Bank Monet</Heading>
          <Separator orientation="horizontal" size="4" />
          <Flex gap={"3"} direction={"column"} align="center" style={{ textAlign: "center" }}>
            <Heading size={"6"} style={{ fontFamily: "Roboto Slab" }}>Witaj w Królestwie Monet!</Heading>
            <Text size={"4"}>
              Aby wziąć udział w średniowiecznej wyprawie i dołączyć do swojej Gildii, musisz się najpierw zalogować.
            </Text>
            <Text size={"3"} style={{ opacity: 0.8 }}>
              🏆 Rywalizuj z innymi Gildiami<br />
              💰 Zdobywaj monety<br />
              👥 Zarządzaj swoją grupą<br />
              📊 Śledź ranking
            </Text>
          </Flex>
        </Flex>
      </Card>
    </Container>
  );
}

export default async function Home() {
  const session = await auth();
  
  return (
    <HydrateClient>
      {session?.user ? <AuthenticatedDashboard /> : <UnauthenticatedView />}
    </HydrateClient>
  );
}
