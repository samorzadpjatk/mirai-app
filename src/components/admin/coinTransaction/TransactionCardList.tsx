import { Card, DataList, Strong, Badge, Text } from "@radix-ui/themes";
import { formatAmount, formatDate } from "~/utils/format";
import TransactionCardListSkelethon from "~/components/skelethons/TransactionCardListSkelethon";

const TransactionCardList = ({ transactions, loading }: {
    transactions: {
        id: string;
        amount: number;
        createdAt: Date;
        reason: string | null;
        group: {
            id: string;
            name: string;
            coins: number;
        };
        admin: {
            id: string;
            name: string;
        };
    }[] | undefined, loading: boolean
}) => {
    if (loading) return <TransactionCardListSkelethon />;
    if (!transactions) return null;
    return (<>
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



    </>)
}

export default TransactionCardList;
