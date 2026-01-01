import { Card, YStack, XStack, Paragraph, Badge } from "tamagui";

interface Transaction {
    id: string;
    amount: number;
    reason?: string | null;
    admin: { name: string | null };
    group: { name: string };
}

interface TransactionCardListProps {
    transactions: Transaction[];
}

const TransactionCardList = ({ transactions }: TransactionCardListProps) => {
    return (
        <YStack gap="$3">
            {transactions.map((transaction) => (
                <Card key={transaction.id} bordered padding="$3">
                    <YStack gap="$2">
                        <XStack justifyContent="space-between" alignItems="center">
                            <Paragraph fontWeight="bold">{transaction.group.name}</Paragraph>
                            <Badge backgroundColor={transaction.amount > 0 ? "$green10" : "$red10"} color="$background">
                                {transaction.amount > 0 ? "+" : ""}{transaction.amount}
                            </Badge>
                        </XStack>
                        <Paragraph opacity={0.7}>By: {transaction.admin.name ?? "Unknown"}</Paragraph>
                        {transaction.reason && (
                            <Paragraph opacity={0.6}>{transaction.reason}</Paragraph>
                        )}
                    </YStack>
                </Card>
            ))}
        </YStack>
    );
};

export default TransactionCardList;
