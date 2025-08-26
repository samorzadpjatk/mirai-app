import { Card, Flex, Heading, Skeleton, Text } from "@radix-ui/themes";
import { formatAmount, formatDate } from "~/utils/format";

const TransactionAdditionalInsightsSkelethon = () => {
    const mostActiveAdmin = {
        name: "Ładowanie...",
        transactionCount: 0
    };
    const recentTransactions = Array.from({ length: 5 }).map((_, i) => ({
        id: i.toString(),
        createdAt: new Date("2023-01-01T12:00:00Z"),
        group: {
            name: "Gildia 1"
        },
        amount: 0
    }));
    return (
        <>
            <Skeleton loading={true}><Heading size={{ "initial": "1", "xs": "2", "sm": "3" }}>Analiza</Heading></Skeleton>
            <Card>
                <Flex direction="column" gap="3">
                    <Flex direction={"column"} gap="2">
                        <Skeleton loading={true}><Text size={{ "initial": "1", "xs": "2", "sm": "3" }} weight="bold">Najbardziej aktywny administrator:</Text></Skeleton>
                        <Skeleton loading={true}><Text size={{ "initial": "1", "xs": "2", "sm": "3" }} >
                            {mostActiveAdmin?.name} ({mostActiveAdmin?.transactionCount} transakcji)
                        </Text></Skeleton>
                    </Flex>

                    <div>
                        <Skeleton loading={true}><Text size={{ "initial": "1", "xs": "2", "sm": "3" }} weight="bold">Ostatnie 5 transakcji:</Text></Skeleton>
                        <Flex direction="column" gap="1" style={{ marginTop: "8px" }}>
                            <Skeleton loading={true}>
                                {recentTransactions.map((t) => {
                                    const amountInfo = formatAmount(t.amount);
                                    return (
                                        <Text key={t.id} size={{ "initial": "1", "xs": "2", "sm": "3" }} style={{ opacity: 0.8 }}>
                                            {formatDate(t.createdAt)} - {t.group.name}: {amountInfo.icon} {amountInfo.value}
                                        </Text>
                                    );
                                })}
                            </Skeleton>
                        </Flex>
                    </div>
                </Flex>
            </Card>
        </>
    );
}

export default TransactionAdditionalInsightsSkelethon;