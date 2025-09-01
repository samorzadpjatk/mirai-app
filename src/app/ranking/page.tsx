import { Card, Flex, Heading, Text, Separator, Badge, Strong } from "@radix-ui/themes";
import { api } from "~/trpc/server";
import { formatDate } from "~/utils/format";

export default async function RankingPage() {
    const ranking = await api.group.ranking();
    return (
        <Card size={{ initial: "4" }} style={{ width: "100%" }}>
            <Heading size="5" mb="4">Guild Leaderboard</Heading>
            <Text>Last actualization: {formatDate(ranking?.currentDate)}</Text>
            <Separator my="3" size="2" />
            <Flex direction="column" gap="3">
                {ranking?.data.map((group, idx) => (<>
                    <Text>{idx + 1} place: </Text>
                    <Card key={group.id} size={{ "initial": "1", "xs": "2", "sm": "3" }} style={{ width: "100%" }}>
                        <Flex direction="column" gap={{ "initial": "1" }}>
                            <Flex justify="between" align="center">
                                <Strong>{group.name}</Strong>
                            </Flex>
                            <Text size={{ "initial": "1", "xs": "2", "sm": "3" }} style={{ opacity: 0.7 }}>
                                Assigned: {(group.organizer.name ?? group.organizer.email) ?? "Unknown"}
                            </Text>
                            <Flex justify="between" align="center">
                                <Badge variant="soft" color="green">
                                    {group.members.length} members
                                </Badge>
                                <Badge variant="soft" color="gold">
                                    💰 {group.coins} coins
                                </Badge>
                            </Flex>
                        </Flex>
                    </Card></>))}
            </Flex>
        </Card>
    );
}
