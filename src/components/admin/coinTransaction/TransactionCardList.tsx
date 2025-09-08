import { Card, DataList, Strong, Badge, Text } from "@radix-ui/themes";
import { formatAmount, formatDate } from "~/utils/format";
import TransactionCardListSkelethon from "~/components/skelethons/TransactionCardListSkelethon";

const TransactionCardList = ({ transactions, loading }: {
    transactions: {
        id: string;
        amount: number;
        reason?: string | null;
        createdAt: Date;
        group: {
            id: string;
            name: string;
            coins: number;
        };
        admin: {
            id: string;
            name: string | null;
        };
    }[] | undefined, loading: boolean
}) => {
    if (loading) return <TransactionCardListSkelethon />;
    if (!transactions) return null;
    return (<>
        {transactions.map((transaction) => {
            const amountInfo = formatAmount(transaction.amount);
            return (<Card key={transaction.id}>
                <DataList.Root size={{ initial: "1" }}>
                    <DataList.Item>
                        <DataList.Label>Date</DataList.Label>
                        <DataList.Value>
                            <Text size={{ "initial": "1", "xs": "2", "sm": "3" }}>
                                {formatDate(transaction.createdAt)}
                            </Text>
                        </DataList.Value>
                    </DataList.Item>
                    <DataList.Item>
                        <DataList.Label>Guild</DataList.Label>
                        <DataList.Value>
                            <Strong>{transaction.group.name}</Strong>
                        </DataList.Value>
                    </DataList.Item>
                    <DataList.Item>
                        <DataList.Label>Amount</DataList.Label>
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
                                {transaction.admin.name ?? "Unknown admin"}
                            </Text>
                        </DataList.Value>
                    </DataList.Item>
                    {transaction.reason && (
                        <DataList.Item>
                            <DataList.Label>Reason</DataList.Label>
                            <DataList.Value>
                                <Text size={{ "initial": "1", "xs": "2", "sm": "3" }}>
                                    {transaction.reason}
                                </Text>
                            </DataList.Value>
                        </DataList.Item>
                    )}
                    <DataList.Item>
                        <DataList.Label>Balance After Transaction</DataList.Label>
                        <DataList.Value>
                            <Badge variant="soft" color="blue">
                                💰 {transaction.group.coins ?? 0}
                            </Badge>
                        </DataList.Value>
                    </DataList.Item>

                </DataList.Root>
            </Card>)
        })}



    </>)
}

export default TransactionCardList;
