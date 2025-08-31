import { Card, Flex, Badge, Text, Heading, DataList } from "@radix-ui/themes";
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
                <Heading>{group.name}</Heading>
                <DataList.Root>
                    <DataList.Item>
                        <DataList.Label>Władca Gildii</DataList.Label>
                        <DataList.Value>{group.organizer.name}</DataList.Value>
                    </DataList.Item>
                    <DataList.Item align={"center"}>
                        <DataList.Label>Stan konta</DataList.Label>
                        <DataList.Value><Badge size={"3"} variant="soft" color="gold">
                            💰 {group.coins} monet
                        </Badge></DataList.Value>
                    </DataList.Item>
                    {group.members.length > 0 &&
                        <DataList.Item>
                            <DataList.Label>
                                Członkowie
                            </DataList.Label>
                            <DataList.Value>
                                <Flex direction="column" gap="2">
                                    {group.members.map((member) => (
                                        <Text key={member.user.id}>
                                            {member.user.name}
                                        </Text>
                                    ))}
                                </Flex>
                            </DataList.Value>
                        </DataList.Item>}
                </DataList.Root>
            </Flex>
        </Card>
    );
}

export default MyGroupPage;