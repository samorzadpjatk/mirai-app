import { Card, Container, Flex, Heading, Separator, Text } from "@radix-ui/themes";
import Link from "next/link";

import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";

export default async function Home() {
  const session = await auth();
  return (
    <HydrateClient>
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
    </HydrateClient>
  );
}
