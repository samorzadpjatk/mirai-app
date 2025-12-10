import { Card, Flex, Heading, Text } from "@radix-ui/themes";
import { formatAmount, formatDate } from "~/utils/format";
import { Suspense } from "react";
import TransactionAdditionalInsightsSkelethon from "~/components/skelethons/TransactionAdditionalInsightsSkelethon";

const TransactionsAdditionalInsights = async () => {
    const transactionAdditionalInsights = await api.coinTransaction.getAdditionalInsights();
    if (!transactionAdditionalInsights) return null;
    const { mostActiveAdmin, recentTransactions } = transactionAdditionalInsights;

    return (
        <Suspense fallback={<TransactionAdditionalInsightsSkelethon />}>
            <Heading size={{ "initial": "1", "xs": "2", "sm": "3" }}>Analysis</Heading>
            <Card>
                <Flex direction="column" gap="3">
                    <Flex direction={"column"} gap="2">
                        <Text size={{ "initial": "1", "xs": "2", "sm": "3" }} weight="bold">Most Active Administrator:</Text>
                        <Text size={{ "initial": "1", "xs": "2", "sm": "3" }} >
                            {mostActiveAdmin.name} ({mostActiveAdmin.transactionCount} transactions)
                        </Text>
                    </Flex>

                    <div>
                        <Text size={{ "initial": "1", "xs": "2", "sm": "3" }} weight="bold">Last 5 transactions:</Text>
                        <Flex direction="column" gap="1" style={{ marginTop: "8px" }}>
                            {recentTransactions.map((t) => {
                                const amountInfo = formatAmount(t.amount);
                                return (
                                    <Text key={t.id} size={{ "initial": "1", "xs": "2", "sm": "3" }} style={{ opacity: 0.8 }}>
                                        {formatDate(t.createdAt)} - {t.group.name}: {amountInfo.icon} {amountInfo.value}
                                    </Text>
                                );
                            })}
                        </Flex>
                    </div>
                </Flex>
            </Card>
        </Suspense>
    );
}

export default TransactionsAdditionalInsights;