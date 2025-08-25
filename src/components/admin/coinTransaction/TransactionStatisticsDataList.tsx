import { Card, DataList, Heading, Text } from "@radix-ui/themes";
import { Suspense } from "react";
import { api } from "~/trpc/server";

const TransactionStatisticsDataList = async () => {
    const transactions = await api.coinTransaction.getAll();
    if (transactions.length === 0) return null;
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <Heading size={{ "initial": "1", "xs": "2", "sm": "3" }}>Statystyki</Heading>
            <Card>
                <DataList.Root>
                    <DataList.Item style={{ flex: 1, minWidth: "200px" }}>
                        <DataList.Label style={{ opacity: 0.7 }}>Łączne transakcje</DataList.Label>
                    <DataList.Value>
                        <Text size={{ "initial": "1", "xs": "2", "sm": "3" }} weight="bold">
                            📊 {transactions.length}
                        </Text>
                    </DataList.Value>
                </DataList.Item>
                <DataList.Item style={{ flex: 1, minWidth: "200px" }}>
                    <DataList.Label style={{ opacity: 0.7 }}>Dodane monety</DataList.Label>
                    <DataList.Value>
                        <Text size={{ "initial": "1", "xs": "2", "sm": "3" }} weight="bold" color="green">
                            💰 +{transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0)}
                        </Text>
                    </DataList.Value>
                </DataList.Item>
                <DataList.Item style={{ flex: 1, minWidth: "200px" }}>
                    <DataList.Label style={{ opacity: 0.7 }}>Odebrane monety</DataList.Label>
                    <DataList.Value>
                        <Text size={{ "initial": "1", "xs": "2", "sm": "3" }} weight="bold" color="red">
                            💸 {transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0)}
                        </Text>
                    </DataList.Value>
                </DataList.Item>
                <DataList.Item style={{ flex: 1, minWidth: "200px" }}>
                    <DataList.Label style={{ opacity: 0.7 }}>Bilans netto</DataList.Label>
                    <DataList.Value>
                        <Text size={{ "initial": "1", "xs": "2", "sm": "3" }} weight="bold">
                            ⚖️ {transactions.reduce((sum, t) => sum + t.amount, 0)}
                        </Text>
                    </DataList.Value>
                </DataList.Item>
            </DataList.Root>
        </Card>
    </Suspense>
    );
}

export default TransactionStatisticsDataList;