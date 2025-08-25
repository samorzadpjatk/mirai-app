import { Card, Flex, Strong, Badge, Text, Heading } from "@radix-ui/themes";
import { auth } from "~/server/auth";
import { api } from "~/trpc/server";

const MyGroupPage = async () => {
    const session = await auth();
    if (!session?.user) {
        return null;
    }
    const group = await api.group.getMy();
    if (!group) {
        return (
            <Card size={{ initial: "4" }} style={{ width: "100%" }}>
                <Text>Nie należysz do żadnej grupy.</Text>
            </Card>
        );
    }
    return (
        <Card key={group.id} size={{ "initial": "1", "xs": "2", "sm": "3" }} style={{ width: "100%" }}>
            <Flex direction="column" gap={{ "initial": "1" }}>
                <Flex justify="between" align="center">
                    <Strong>{group.name}</Strong>
                </Flex>
                <Text size={{ "initial": "1", "xs": "2", "sm": "3" }} style={{ opacity: 0.7 }}>
                    Władca Gildii: {group.organizer.name ?? "Nieznany"}
                </Text>
                <Flex justify="between" align="center">
                    <Badge variant="soft" color="gold">
                        💰 {group.coins} monet
                    </Badge>
                </Flex>
                {group.members.length > 0 && <>
                    <Heading size={{ "initial": "1", "xs": "2", "sm": "3" }} style={{ opacity: 0.7 }}>
                        Członkowie
                    </Heading>
                    <Flex direction="column" gap="2">
                        {group.members.map((member) => (
                            <Badge key={member.id} variant="soft" color="blue">
                                {member.name ?? "Nieznany członek"}
                            </Badge>
                        ))}
                    </Flex></>}

            </Flex>
        </Card>

    );
}

export default MyGroupPage;