
import { Card, Flex, Heading, Text, Separator, Table } from "@radix-ui/themes";
import { api, HydrateClient } from "~/trpc/server";

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
            <Flex direction="column" align="center" justify="center" className="mt-8">
                <Card size="4" style={{ maxWidth: 600, width: "100%" }}>
                    <Text color="red">Błąd ładowania rankingu: {error}</Text>
                </Card>
            </Flex>
        );
    }

    return (
        <HydrateClient>
            <Flex direction="column" align="center" justify="center" className="mt-8">
                <Card size="4" style={{ maxWidth: 600, width: "100%" }}>
                    <Heading size="5" mb="4">Ranking grup</Heading>
                    <Separator my="3" size="2" />
                    <Table.Root>
                        <Table.Header>
                            <Table.Row>
                                <Table.ColumnHeaderCell>Miejsce</Table.ColumnHeaderCell>
                                <Table.ColumnHeaderCell>Nazwa grupy</Table.ColumnHeaderCell>
                                <Table.ColumnHeaderCell>Monety</Table.ColumnHeaderCell>
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            {ranking.map((group, idx) => (
                                <Table.Row key={group.id}>
                                    <Table.Cell>{idx + 1}</Table.Cell>
                                    <Table.Cell>{group.name}</Table.Cell>
                                    <Table.Cell><Text style={{ fontWeight: "bold" }}>{group.coins}</Text></Table.Cell>
                                </Table.Row>
                            ))}
                        </Table.Body>
                    </Table.Root>
                </Card>
            </Flex>
        </HydrateClient>
    );
}
