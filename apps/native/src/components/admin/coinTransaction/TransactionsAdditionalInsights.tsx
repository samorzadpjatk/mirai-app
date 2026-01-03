import { Card, H3, YStack, XStack, Paragraph } from "tamagui";
import { Suspense } from "react";
import TransactionAdditionalInsightsSkelethon from "~/components/skelethons/TransactionAdditionalInsightsSkelethon";

interface Insights {
    mostActiveGroup?: string;
    biggestTransaction?: number;
    averageTransaction?: number;
}

interface TransactionsAdditionalInsightsProps {
    insights?: Insights;
    isLoading?: boolean;
}

const TransactionsAdditionalInsights = ({ insights, isLoading }: TransactionsAdditionalInsightsProps) => {
    if (isLoading) {
        return <TransactionAdditionalInsightsSkelethon />;
    }

    if (!insights) return null;

    return (
        <Suspense fallback={<TransactionAdditionalInsightsSkelethon />}>
            <Card bordered p="$4">
                <H3 mb="$4">Additional Insights</H3>
                <YStack gap="$3">
                    {insights.mostActiveGroup && (
                        <XStack justify="space-between" items="center">
                            <Paragraph opacity={0.7}>Most Active Group</Paragraph>
                            <Paragraph fontWeight="bold">{insights.mostActiveGroup}</Paragraph>
                        </XStack>
                    )}
                    {insights.biggestTransaction && (
                        <XStack justify="space-between" items="center">
                            <Paragraph opacity={0.7}>Biggest Transaction</Paragraph>
                            <Paragraph fontWeight="bold">{insights.biggestTransaction}</Paragraph>
                        </XStack>
                    )}
                    {insights.averageTransaction && (
                        <XStack justify="space-between" items="center">
                            <Paragraph opacity={0.7}>Average Transaction</Paragraph>
                            <Paragraph fontWeight="bold">{insights.averageTransaction.toFixed(2)}</Paragraph>
                        </XStack>
                    )}
                </YStack>
            </Card>
        </Suspense>
    );
};

export default TransactionsAdditionalInsights;
