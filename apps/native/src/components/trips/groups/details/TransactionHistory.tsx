import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { formatDisplayName } from "@mirai-app/shared";
import { colors, spacing, borderRadius, typography } from "../../../../styles";

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

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({ transactions }) => {
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
      <View style={styles.container}>
        <Text style={styles.title}>Coin Transactions</Text>
        <View style={styles.emptyState}>
          <Ionicons name="receipt-outline" size={48} color="#64748b" />
          <Text style={styles.emptyText}>No transactions yet</Text>
          <Text style={styles.emptySubtext}>
            Coin transactions will appear here once coins are added or removed
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Coin Transactions</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {transactions.map((transaction) => (
          <View key={transaction.id} style={styles.transactionCard}>
            <View style={styles.transactionHeader}>
              <View style={styles.amountContainer}>
                <Text
                  style={[
                    styles.amount,
                    transaction.amount > 0 ? styles.positiveAmount : styles.negativeAmount,
                  ]}
                >
                  {formatAmount(transaction.amount)}
                </Text>
                <Text style={styles.coinLabel}>coins</Text>
              </View>
              <View style={styles.transactionMeta}>
                <Text style={styles.date}>{formatDate(transaction.createdAt)}</Text>
                <Text style={styles.admin}>
                  by{" "}
                  {formatDisplayName(
                    transaction.admin.firstName,
                    transaction.admin.lastName,
                    "Unknown Admin",
                  )}
                </Text>
              </View>
            </View>
            {transaction.reason && (
              <View style={styles.reasonContainer}>
                <Text style={styles.reasonLabel}>Reason:</Text>
                <Text style={styles.reasonText}>{transaction.reason}</Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  title: {
    fontSize: typography.sm,
    fontWeight: typography.bold,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    paddingHorizontal: spacing.xs,
  },
  emptyState: {
    backgroundColor: "rgba(35, 38, 43, 0.8)",
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(100, 116, 139, 0.2)",
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#64748b",
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#475569",
    textAlign: "center",
    lineHeight: 20,
  },
  scrollContent: {
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  transactionCard: {
    backgroundColor: "rgba(35, 38, 43, 0.8)",
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    minWidth: 280,
    maxWidth: 320,
    borderWidth: 1,
    borderColor: "rgba(100, 116, 139, 0.2)",
    gap: spacing.md,
  },
  transactionHeader: {
    gap: spacing.sm,
  },
  amountContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: spacing.xs,
  },
  amount: {
    fontSize: 24,
    fontWeight: "bold",
  },
  positiveAmount: {
    color: "#10b981",
  },
  negativeAmount: {
    color: "#ef4444",
  },
  coinLabel: {
    fontSize: 12,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  transactionMeta: {
    gap: spacing.xs,
  },
  date: {
    fontSize: 12,
    color: "#94a3b8",
  },
  admin: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "500",
  },
  reasonContainer: {
    backgroundColor: "rgba(30, 41, 59, 0.5)",
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  reasonLabel: {
    fontSize: 11,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontWeight: "600",
  },
  reasonText: {
    fontSize: 13,
    color: "#cbd5e1",
    lineHeight: 18,
  },
});
