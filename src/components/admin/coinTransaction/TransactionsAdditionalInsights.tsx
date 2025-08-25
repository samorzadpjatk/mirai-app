import { Card, Flex, Heading, Text } from "@radix-ui/themes";
import { formatAmount, formatDate } from "~/utils/format";
import { api } from "~/trpc/server";
import { Suspense } from "react";

const TransactionsAdditionalInsights = async () => {
    const transactionAdditionalInsights = await api.coinTransaction.getAdditionalInsights();
    if (!transactionAdditionalInsights) return null;
    const { mostActiveAdmin, recentTransactions } = transactionAdditionalInsights;

    return (
        <Suspense fallback={<div>Loading...</div>}>
            <Heading size={{ "initial": "1", "xs": "2", "sm": "3" }}>Analiza</Heading>
            <Card>
                <Flex direction="column" gap="3">
                    <Flex direction={"column"} gap="2">
                        <Text size={{ "initial": "1", "xs": "2", "sm": "3" }} weight="bold">Najbardziej aktywny administrator:</Text>
                        <Text size={{ "initial": "1", "xs": "2", "sm": "3" }} >
                            {mostActiveAdmin?.name} ({mostActiveAdmin?.transactionCount} transakcji)
                        </Text>
                    </Flex>

                    <div>
                        <Text size={{ "initial": "1", "xs": "2", "sm": "3" }} weight="bold">Ostatnie 5 transakcji:</Text>
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