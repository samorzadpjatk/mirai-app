import { Card, H3, YStack, XStack, Paragraph } from "tamagui";
import { Suspense } from "react";
import TransactionStatisticsDataListSkeleton from "~/components/skelethons/TransactionStatisticsDataListSkeleton";

interface TransactionStatistics {
    totalTransactions: number;
    totalCoinsAdded: number;
    totalCoinsRemoved: number;
}

interface TransactionStatisticsDataListProps {
    statistics?: TransactionStatistics;
    isLoading?: boolean;
}

const TransactionStatisticsDataList = ({ statistics, isLoading }: TransactionStatisticsDataListProps) => {
    if (isLoading) {
        return <TransactionStatisticsDataListSkeleton />;
    }

    if (!statistics) return null;

    return (
        <Suspense fallback={<TransactionStatisticsDataListSkeleton />}>
            <Card bordered p="$4">
                <H3 mb="$4">Transaction Statistics</H3>
                <YStack gap="$3">
                    <XStack justify="space-between" items="center">
                        <Paragraph opacity={0.7}>Total Transactions</Paragraph>
                        <Paragraph fontWeight="bold">{statistics.totalTransactions}</Paragraph>
                    </XStack>
                    <XStack justify="space-between" items="center">
                        <Paragraph opacity={0.7}>Total Coins Added</Paragraph>
                        <Paragraph fontWeight="bold" color="$green10">+{statistics.totalCoinsAdded}</Paragraph>
                    </XStack>
                    <XStack justify="space-between" items="center">
                        <Paragraph opacity={0.7}>Total Coins Removed</Paragraph>
                        <Paragraph fontWeight="bold" color="$red10">-{statistics.totalCoinsRemoved}</Paragraph>
                    </XStack>
                </YStack>
            </Card>
        </Suspense>
    );
};

export default TransactionStatisticsDataList;
