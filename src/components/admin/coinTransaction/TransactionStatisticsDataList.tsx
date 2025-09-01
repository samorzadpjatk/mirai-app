import { Card, DataList, Heading, Text } from "@radix-ui/themes";
import { Suspense } from "react";
import TransactionStatisticsDataListSkeleton from "~/components/skelethons/TransactionStatisticsDataListSkeleton";
import { api } from "~/trpc/server";

const TransactionStatisticsDataList = async () => {
    const transactionsStatistics = await api.coinTransaction.getStatistics();
    return (
        <Suspense fallback={<TransactionStatisticsDataListSkeleton />}>
            <Heading size={{ "initial": "1", "xs": "2", "sm": "3" }}>Statistics</Heading>
            <Card>
                <DataList.Root>
                    <DataList.Item >
                        <DataList.Label style={{ opacity: 0.7 }}>Total transactions</DataList.Label>
                    <DataList.Value>
                        <Text size={{ "initial": "1", "xs": "2", "sm": "3" }} weight="bold">
                            📊 {transactionsStatistics?.transactionCount}
                        </Text>
                    </DataList.Value>
                </DataList.Item>
                <DataList.Item >
                    <DataList.Label style={{ opacity: 0.7 }}>Added coins</DataList.Label>
                    <DataList.Value>
                        <Text size={{ "initial": "1", "xs": "2", "sm": "3" }} weight="bold" color="green">
                            💰 +{transactionsStatistics?.addedCoins}
                        </Text>
                    </DataList.Value>
                </DataList.Item>
                <DataList.Item >
                    <DataList.Label style={{ opacity: 0.7 }}>Seized coins</DataList.Label>
                    <DataList.Value>
                        <Text size={{ "initial": "1", "xs": "2", "sm": "3" }} weight="bold" color="red">
                            💸 {transactionsStatistics?.removedCoins}
                        </Text>
                    </DataList.Value>
                </DataList.Item>
                <DataList.Item >
                    <DataList.Label style={{ opacity: 0.7 }}>Net Balance</DataList.Label>
                    <DataList.Value>
                        <Text size={{ "initial": "1", "xs": "2", "sm": "3" }} weight="bold">
                            ⚖️ {transactionsStatistics?.netBalance}
                        </Text>
                    </DataList.Value>
                </DataList.Item>
            </DataList.Root>
        </Card>
    </Suspense>
    );
}

export default TransactionStatisticsDataList;