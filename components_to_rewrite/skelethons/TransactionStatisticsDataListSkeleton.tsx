import { Card, DataList, Heading, Skeleton, Text } from "@radix-ui/themes";

const TransactionStatisticsDataListSkeleton = () => {
    const transactions = Array.from({ length: 5 }).map((_, i) => ({
        id: i.toString(),
        createdAt: new Date("2023-01-01"),
        group: {
            name: "Gildia 1"
        },
        amount: 0
    }));
    return (
        <>
            <Skeleton loading={true}><Heading size={{ "initial": "1", "xs": "2", "sm": "3" }}>Statystyki</Heading></Skeleton>
            <Card>
                <DataList.Root>
                    <DataList.Item >
                        <DataList.Label style={{ opacity: 0.7 }}>Łączne transakcje</DataList.Label>
                        <DataList.Value>
                            <Skeleton loading={true}>
                                <Text size={{ "initial": "1", "xs": "2", "sm": "3" }} weight="bold">
                                    📊 {transactions.length}
                                </Text>
                            </Skeleton>
                        </DataList.Value>
                    </DataList.Item>
                    <DataList.Item >
                        <DataList.Label style={{ opacity: 0.7 }}>Dodane monety</DataList.Label>
                        <DataList.Value>
                            <Skeleton loading={true}>
                                <Text size={{ "initial": "1", "xs": "2", "sm": "3" }} weight="bold" color="green">
                                    💰 +{transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0)}
                                </Text>
                            </Skeleton>
                        </DataList.Value>
                    </DataList.Item>
                    <DataList.Item >
                        <DataList.Label style={{ opacity: 0.7 }}>Odebrane monety</DataList.Label>
                        <DataList.Value>
                            <Skeleton loading={true}>
                                <Text size={{ "initial": "1", "xs": "2", "sm": "3" }} weight="bold" color="red">
                                    💸 {transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0)}
                                </Text>
                            </Skeleton>
                        </DataList.Value>
                    </DataList.Item>
                    <DataList.Item >
                        <DataList.Label style={{ opacity: 0.7 }}>Bilans netto</DataList.Label>
                        <DataList.Value>
                            <Skeleton loading={true}>
                                <Text size={{ "initial": "1", "xs": "2", "sm": "3" }} weight="bold">
                                    ⚖️ {transactions.reduce((sum, t) => sum + t.amount, 0)}
                                </Text>
                            </Skeleton>
                        </DataList.Value>
                    </DataList.Item>
                </DataList.Root>
            </Card>
        </>
    );
}

export default TransactionStatisticsDataListSkeleton;