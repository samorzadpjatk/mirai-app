import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../../styles';

export interface TransactionItem {
  id: string;
  amount: number;
  reason: string;
  createdAt: string;
  group: {
    id: string;
    name: string;
  };
  admin: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface TransactionCardProps {
  transaction: TransactionItem;
}

const TransactionCard: React.FC<TransactionCardProps> = ({ transaction }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAmount = (amount: number) => {
    const isPositive = amount > 0;
    const icon = isPositive ? 'add-circle' as const : 'remove-circle' as const;
    const color = isPositive ? colors.success : colors.red700;
    const value = `${isPositive ? '+' : ''}${amount}`;

    return { icon, color, value };
  };

  const amountInfo = formatAmount(transaction.amount);
  const adminName = `${transaction.admin.firstName} ${transaction.admin.lastName}`.trim();

  return (
    <View style={styles.transactionCard}>
      <View style={styles.transactionHeader}>
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionGroup}>{transaction.group.name}</Text>
          <Text style={styles.transactionDate}>{formatDate(transaction.createdAt)}</Text>
        </View>
        <View style={[styles.amountBadge, amountInfo.color === colors.success ? styles.addBadge : styles.removeBadge]}>
          <Ionicons name={amountInfo.icon} size={16} color={colors.white} />
          <Text style={styles.amountText}>{amountInfo.value}</Text>
        </View>
      </View>
      
      {transaction.reason && (
        <Text style={styles.transactionReason}>{transaction.reason}</Text>
      )}
      
      <Text style={styles.transactionAdmin}>Admin: {adminName}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  transactionCard: {
    backgroundColor: colors.cardDark,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderWhite5,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionGroup: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  transactionDate: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
  amountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  addBadge: {
    backgroundColor: colors.success,
  },
  removeBadge: {
    backgroundColor: colors.red700,
  },
  amountText: {
    fontSize: typography.base,
    color: colors.white,
    fontWeight: typography.bold,
  },
  transactionReason: {
    fontSize: typography.base,
    color: colors.white,
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
  transactionAdmin: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
});

export default TransactionCard;
