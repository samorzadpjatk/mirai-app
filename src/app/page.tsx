import { Card, Container, Flex, Heading, Separator, Text, Button } from "@radix-ui/themes";
import Link from "next/link";

import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";

// Component for authenticated users - the main dashboard
function AuthenticatedDashboard() {
  return (
    <Container>
      <Card size="5">
        <Flex gap={"2"} direction={"column"} align="center" justify="center">
          <Heading size={"8"} style={{ fontFamily: "Roboto Slab" }}>Witaj w Banku Monet!</Heading>
          <Separator orientation="horizontal" size="4" />
          <Text>
            W tym roku wyruszamy w wyprawę z klimatem średniowiecznym – ale spokojnie, nie musisz znać łaciny ani szykować kolczugi. Motyw królestwa, rycerskich Gildii i tajemniczych Dolin to tylko warstwa zabawy i wyjątkowej atmosfery, która doda kolorytu całemu wyjazdowi – bez zobowiązań, za to z masą śmiechu i genialnych konkurencji!<br />
            Co Was czeka?<br />
            🔥 Wieczorne ogniska, śmiech i rozmowy do rana<br />
            🎭 Klimatyczne turnieje, zabawy i nagrody<br />
            ⚔️ Rywalizacja Gildii o Świętego Gralla<br />
            🤝 Nowe znajomości i vibe, który łączy<br />
            🏰 Gra terenowa w prawdziwym zamku<br />
            Przygotuj się na kilka dni wypełnionych emocjami, integracją i humorem – w otoczce przygody godnej legend. Nie musisz być fanem fantasy – wystarczy, że masz otwartą głowę, poczucie humoru i chcesz przeżyć coś niecodziennego razem z innymi.
          </Text>
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
            <Separator orientation="horizontal" size="2" />
            <Button size={"4"} variant="solid" asChild>
              <Link href="/auth/login">
                ⚔️ Zaloguj się i rozpocznij przygodę
              </Link>
            </Button>
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
