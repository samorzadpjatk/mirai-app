
import { Card, Flex, Heading, Text, Separator, Badge, Strong } from "@radix-ui/themes";
import { api, HydrateClient } from "~/trpc/server";
import { formatDate } from "../utils/format";

export default async function RankingPage() {
    let ranking: { id: string; name: string; coins: number; }[] = [];
    let error: string | null = null;

    try {
        ranking = await api.group.ranking();
    } catch (err) {
        error = err instanceof Error ? err.message : "Błąd ładowania rankingu";
    }

    if (error) {
        return (
            <Flex direction="column" align="center" justify="center">
                <Card size="4" style={{ width: "100%" }}>
                    <Text color="red">Błąd ładowania rankingu: {error}</Text>
                </Card>
            </Flex>
        );
    }

    return (
        <HydrateClient>
            <Card size={{ initial: "4" }} style={{ width: "100%" }}>
                <Heading size="5" mb="4">Ranking grup</Heading>
                <Text>Ostatnia aktualizacja: {formatDate(new Date())}</Text>
                <Separator my="3" size="2" />
                <Flex direction="column" gap="3">
                    {ranking.map((group, idx) => (<>
                        <Text>{idx + 1} miejsce: </Text>
                        <Card key={group.id} size={{ "initial": "2" }} style={{ width: "100%" }}>
                            <Flex direction="column" gap={{ "initial": "1" }}>
                                <Flex justify="between" align="center">
                                    <Strong>{group.name}</Strong>
                                    <Badge variant="soft" color="blue">
                                        {group.code}
                                    </Badge>
                                </Flex>
                                <Text size={{ "initial": "1" }} style={{ opacity: 0.7 }}>
                                    Przypisany: {(group.organizer.name ?? group.organizer.email) ?? "Nieznany"}
                                </Text>
                                <Flex justify="between" align="center">
                                    <Badge variant="soft" color="green">
                                        {group.members.length} członków
                                    </Badge>
                                    <Badge variant="soft" color="gold">
                                        💰 {group.coins} monet
                                    </Badge>
                                </Flex>
                            </Flex>
                        </Card></>))}
                </Flex>
            </Card>
        </HydrateClient>
    );
}
