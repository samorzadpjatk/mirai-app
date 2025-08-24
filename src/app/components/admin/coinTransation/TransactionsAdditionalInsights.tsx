"use client"

import { Card, Flex, Heading, Text } from "@radix-ui/themes";
import { formatAmount, formatDate } from "~/app/utils/format";
import type { CoinTransactionWithAllFields } from "~/types/schema";

const TransactionsAdditionalInsights = ({ transactions }: { transactions: CoinTransactionWithAllFields[] }) => {
    if (!transactions || transactions.length === 0) {
        return null;
    }

    const adminStats = transactions.reduce((acc, t) => {
        const adminName = t.admin.name || "Nieznany";
        acc[adminName] ??= { count: 0, amount: 0 };
        acc[adminName].count++;
        acc[adminName].amount += t.amount;
        return acc;
    }, {} as Record<string, { count: number; amount: number }>);

    const mostActiveAdmin = Object.entries(adminStats)
        .sort(([, a], [, b]) => b.count - a.count)[0];

    // Most recent activity
    const recentTransactions = transactions.slice(0, 5);

    return (<>
        <Heading size={{ "initial": "1" }}>Analiza</Heading>
        <Card>
            <Flex direction="column" gap="3">
                <Flex direction={"column"} gap="2">
                    <Text size={{ "initial": "1" }} weight="bold">Najbardziej aktywny administrator:</Text>
                    <Text size={{ "initial": "1" }} >
                        {mostActiveAdmin?.[0]} ({mostActiveAdmin?.[1].count} transakcji)
                    </Text>
                </Flex>

                <div>
                    <Text size={{ "initial": "1" }} weight="bold">Ostatnie 5 transakcji:</Text>
                    <Flex direction="column" gap="1" style={{ marginTop: "8px" }}>
                        {recentTransactions.map((t) => {
                            const amountInfo = formatAmount(t.amount);
                            return (
                                <Text key={t.id} size={{ "initial": "1" }} style={{ opacity: 0.8 }}>
                                    {formatDate(t.createdAt)} - {t.group.name}: {amountInfo.icon} {amountInfo.value}
                                </Text>
                            );
                        })}
                    </Flex>
                </div>
            </Flex>
        </Card>
    </>
    );
}

export default TransactionsAdditionalInsights;