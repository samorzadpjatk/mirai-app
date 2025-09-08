import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { Badge, Card, DataList, Flex, Heading, Skeleton, Strong, Text, TextField } from "@radix-ui/themes";

const CoinOperationCardListSkeleton = () => {
    const group = {
        id: "1",
        name: "Gildia 1",
        code: "G1",
        organizer: {
            name: "Organizator 1"
        },
        members: [],
        coins: 0,
        coinTransactions: []
    }
    return (
        <>
            <Skeleton loading={true}><Heading size={{ "initial": "1", "xs": "2", "sm": "3" }}>Transactions</Heading></Skeleton>
            <Skeleton loading={true}><TextField.Root
                placeholder="Filter guilds..."
                size={{ initial: "1" }}><TextField.Slot>
                    <MagnifyingGlassIcon />
                </TextField.Slot>
            </TextField.Root></Skeleton>
            <Flex direction="column" justify="center">
                <Card>
                    <DataList.Root >
                        <DataList.Item>
                            <Skeleton loading={true}><DataList.Label>Gildia</DataList.Label></Skeleton>
                            <DataList.Value>
                                <Flex align="center" gap="2">
                                    <Skeleton loading={true}>
                                        <Text>
                                            🥇
                                        </Text>
                                    </Skeleton>
                                    <Skeleton loading={true}><Strong>{group.name}</Strong></Skeleton>
                                </Flex>
                            </DataList.Value>
                        </DataList.Item>
                        <DataList.Item>
                            <Skeleton loading={true}><DataList.Label>Kod</DataList.Label></Skeleton>
                        </DataList.Item>
                        <DataList.Item>
                            <Skeleton loading={true}><DataList.Label>Organizator</DataList.Label></Skeleton>
                            <Skeleton loading={true}><DataList.Value>{group.organizer.name}</DataList.Value></Skeleton>
                        </DataList.Item>
                        <DataList.Item>
                            <Skeleton loading={true}><DataList.Label>Członkowie</DataList.Label></Skeleton>
                            <DataList.Value>
                                <Skeleton loading={true}>
                                    <Badge variant="soft" color="green">
                                        {group.members.length} osób
                                    </Badge></Skeleton>
                            </DataList.Value>
                        </DataList.Item>
                        <DataList.Item>
                            <DataList.Label>Monety</DataList.Label>
                            <DataList.Value>{group.coins}</DataList.Value>
                        </DataList.Item>
                        <DataList.Item>
                            <DataList.Label>Ostatnie Transakcje</DataList.Label>
                            <DataList.Value>
                                <Flex direction="column" gap="1">
                                    <Skeleton loading={true}>
                                        <Text size={{ "initial": "1", "xs": "2", "sm": "3" }} style={{ opacity: 0.5 }}>
                                            Brak transakcji
                                        </Text>
                                    </Skeleton>
                                </Flex>
                            </DataList.Value>
                        </DataList.Item>
                    </DataList.Root>
                </Card>
            </Flex>
        </>
    );
}

export default CoinOperationCardListSkeleton;