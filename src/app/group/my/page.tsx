import { Card, Flex, Strong, Badge, Text } from "@radix-ui/themes";
import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";
import type { GroupWithAllFields } from "~/types/schema";

const MyGroupPage = async () => {
    const session = await auth();
    if (!session?.user) {
        return null;
    }
    const group: GroupWithAllFields | null = await api.group.getMy();
    if (!group) {
        return (<HydrateClient>
            <Card size={{ initial: "4" }} style={{ width: "100%" }}>
                <Text>Nie należysz do żadnej grupy.</Text>
            </Card>
        </HydrateClient>);
    }
    return (<HydrateClient>
        <Card key={group.id} size={{ "initial": "2" }} style={{ width: "100%" }}>
            <Flex direction="column" gap={{ "initial": "1" }}>
                <Flex justify="between" align="center">
                    <Strong>{group.name}</Strong>
                </Flex>
                <Text size={{ "initial": "1" }} style={{ opacity: 0.7 }}>
                    Władca Gildii: {group.organizer.name ?? "Nieznany"}
                </Text>
                <Flex justify="between" align="center">
                    <Badge variant="soft" color="gold">
                        💰 {group.coins} monet
                    </Badge>
                </Flex>
            </Flex>
        </Card>

    </HydrateClient>);
}

export default MyGroupPage;