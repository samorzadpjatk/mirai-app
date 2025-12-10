import { Badge, Card, DataList, Strong, Text } from "@radix-ui/themes";
import { formatAmount, formatDate } from "~/utils/format";

const TransactionCardListSkelethon = () => {
    const transactions = Array.from({ length: 5 }).map((_, i) => ({
        id: i.toString(),
        createdAt: new Date("2023-01-01"),
        group: {
            name: "Gildia 1",
            coins: 100
        },
        amount: 0,
        admin: {
            name: "Admin 1"
        },
        reason: "Loading..."
    }));
    return (
        <>
            {transactions.map((transaction) => {
                const amountInfo = formatAmount(transaction.amount);
                (<Card key={transaction.id}>
                    <DataList.Root size={{ initial: "1" }}>
                        <DataList.Item>
                            <DataList.Label>Data</DataList.Label>
                            <DataList.Value>
                                <Text size={{ "initial": "1", "xs": "2", "sm": "3" }}>
                                    {formatDate(transaction.createdAt)}
                                </Text>
                            </DataList.Value>
                        </DataList.Item>
                        <DataList.Item>
                            <DataList.Label>Gildia</DataList.Label>
                            <DataList.Value>
                                <Strong>{transaction.group.name}</Strong>
                            </DataList.Value>
                        </DataList.Item>
                        <DataList.Item>
                            <DataList.Label>Kwota</DataList.Label>
                            <DataList.Value>
                                <Badge
                                    variant="solid"
                                    color={amountInfo.color as "green" | "red" | "orange" | "blue"}
                                >
                                    {amountInfo.icon} {amountInfo.value}
                                </Badge>
                            </DataList.Value>
                        </DataList.Item>
                        <DataList.Item>
                            <DataList.Label>Administrator</DataList.Label>
                            <DataList.Value>
                                <Text size={{ "initial": "1", "xs": "2", "sm": "3" }}>
                                    {transaction.admin.name ?? "Nieznany admin"}
                                </Text>
                            </DataList.Value>
                        </DataList.Item>
                        <DataList.Item>
                            <DataList.Label>Stan po transakcji</DataList.Label>
                            <DataList.Value>
                                <Badge variant="soft" color="blue">
                                    💰 {transaction.group.coins ?? 0}
                                </Badge>
                            </DataList.Value>
                        </DataList.Item>
                        {transaction.reason && (
                            <DataList.Item>
                                <DataList.Label>Powód</DataList.Label>
                                <DataList.Value>
                                    <Text size={{ "initial": "1", "xs": "2", "sm": "3" }}>
                                        {transaction.reason}
                                    </Text>
                                </DataList.Value>
                            </DataList.Item>
                        )}
                    </DataList.Root>
                </Card>)
            })}
        </>
    );
}

export default TransactionCardListSkelethon;