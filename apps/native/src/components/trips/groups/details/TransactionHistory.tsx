import { ScrollView } from "react-native";
import { YStack, XStack, Text } from "@mirai-app/ui";
import { Ionicons } from "@expo/vector-icons";

interface CoinTransaction {
  id: string;
  amount: number;
  reason: string | null;
  createdAt: Date | string;
  admin: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  };
}

interface TransactionHistoryProps {
  transactions: CoinTransaction[];
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  transactions,
}) => {
  const formatUserName = (
    firstName?: string | null,
    lastName?: string | null,
  ) => {
    const name = [firstName, lastName].filter(Boolean).join(" ");
    return name || "Unknown Admin";
  };

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatAmount = (amount: number) => {
    const sign = amount > 0 ? "+" : "";
    return `${sign}${amount}`;
  };

  if (!transactions || transactions.length === 0) {
    return (
      <YStack gap="$4">
        <Text
          fontSize="$sm"
          fontWeight="bold"
          color="rgba(148, 163, 184, 1)"
          textTransform="uppercase"
          letterSpacing={1.5}
          paddingHorizontal="$1"
        >
          Coin Transactions
        </Text>
        <YStack
          backgroundColor="rgba(35, 38, 43, 0.8)"
          borderRadius="$lg"
          padding="$5"
          alignItems="center"
          gap="$3"
          borderWidth={1}
          borderColor="rgba(100, 116, 139, 0.2)"
        >
          <Ionicons name="receipt-outline" size={48} color="#64748b" />
          <Text
            fontSize={16}
            fontWeight="600"
            color="#64748b"
            textAlign="center"
          >
            No transactions yet
          </Text>
          <Text
            fontSize={14}
            color="#475569"
            textAlign="center"
            lineHeight={20}
          >
            Coin transactions will appear here once coins are added or removed
          </Text>
        </YStack>
      </YStack>
    );
  }

  return (
    <YStack gap="$4">
      <Text
        fontSize="$sm"
        fontWeight="bold"
        color="rgba(148, 163, 184, 1)"
        textTransform="uppercase"
        letterSpacing={1.5}
        paddingHorizontal="$1"
      >
        Coin Transactions
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          gap: 12,
          paddingHorizontal: 12,
          paddingBottom: 8,
        }}
      >
        {transactions.map((transaction) => (
          <YStack
            key={transaction.id}
            backgroundColor="rgba(35, 38, 43, 0.8)"
            borderRadius="$lg"
            padding="$4"
            minWidth={280}
            maxWidth={320}
            borderWidth={1}
            borderColor="rgba(100, 116, 139, 0.2)"
            gap="$3"
          >
            <YStack gap="$2">
              <XStack alignItems="baseline" gap="$1">
                <Text
                  fontSize={24}
                  fontWeight="bold"
                  color={transaction.amount > 0 ? "#10b981" : "#ef4444"}
                >
                  {formatAmount(transaction.amount)}
                </Text>
                <Text
                  fontSize={12}
                  color="#64748b"
                  textTransform="uppercase"
                  letterSpacing={0.5}
                >
                  coins
                </Text>
              </XStack>
              <YStack gap="$1">
                <Text fontSize={12} color="#94a3b8">
                  {formatDate(transaction.createdAt)}
                </Text>
                <Text fontSize={13} color="#64748b" fontWeight="500">
                  by{" "}
                  {formatUserName(
                    transaction.admin.firstName,
                    transaction.admin.lastName,
                  )}
                </Text>
              </YStack>
            </YStack>
            {transaction.reason && (
              <YStack
                backgroundColor="rgba(30, 41, 59, 0.5)"
                borderRadius="$md"
                padding="$2"
                gap="$1"
              >
                <Text
                  fontSize={11}
                  color="#94a3b8"
                  textTransform="uppercase"
                  letterSpacing={0.5}
                  fontWeight="600"
                >
                  Reason:
                </Text>
                <Text fontSize={13} color="#cbd5e1" lineHeight={18}>
                  {transaction.reason}
                </Text>
              </YStack>
            )}
          </YStack>
        ))}
      </ScrollView>
    </YStack>
  );
};
