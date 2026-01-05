import { Card, YStack, XStack, Paragraph } from "tamagui";
import { Badge } from "../../Badge";

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
                <Card key={transaction.id} bordered p="$3">
                    <YStack gap="$2">
                        <XStack justify="space-between" items="center">
                            <Paragraph fontWeight="bold">{transaction.group.name}</Paragraph>
                            <Badge>
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
