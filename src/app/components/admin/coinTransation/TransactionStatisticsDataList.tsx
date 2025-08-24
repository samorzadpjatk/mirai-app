"use client"

import type { CoinTransaction } from "@prisma/client";
import { Card, DataList, Heading, Text } from "@radix-ui/themes";

const TransactionStatisticsDataList = ({ transactions }: { transactions: CoinTransaction[] }) => {
    return (<>
        <Heading size={{ "initial": "1" }}>Statystyki</Heading>
        <Card>
            <DataList.Root>
                <DataList.Item style={{ flex: 1, minWidth: "200px" }}>
                    <DataList.Label style={{ opacity: 0.7 }}>Łączne transakcje</DataList.Label>
                    <DataList.Value>
                        <Text size={{ "initial": "1" }} weight="bold">
                            📊 {transactions.length}
                        </Text>
                    </DataList.Value>
                </DataList.Item>
                <DataList.Item style={{ flex: 1, minWidth: "200px" }}>
                    <DataList.Label style={{ opacity: 0.7 }}>Dodane monety</DataList.Label>
                    <DataList.Value>
                        <Text size={{ "initial": "1" }} weight="bold" color="green">
                            💰 +{transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0)}
                        </Text>
                    </DataList.Value>
                </DataList.Item>
                <DataList.Item style={{ flex: 1, minWidth: "200px" }}>
                    <DataList.Label style={{ opacity: 0.7 }}>Odebrane monety</DataList.Label>
                    <DataList.Value>
                        <Text size={{ "initial": "1" }} weight="bold" color="red">
                            💸 {transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0)}
                        </Text>
                    </DataList.Value>
                </DataList.Item>
                <DataList.Item style={{ flex: 1, minWidth: "200px" }}>
                    <DataList.Label style={{ opacity: 0.7 }}>Bilans netto</DataList.Label>
                    <DataList.Value>
                        <Text size={{ "initial": "1" }} weight="bold">
                            ⚖️ {transactions.reduce((sum, t) => sum + t.amount, 0)}
                        </Text>
                    </DataList.Value>
                </DataList.Item>
            </DataList.Root>
        </Card>
    </>
    );
}

export default TransactionStatisticsDataList;