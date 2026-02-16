import React, { useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import { colors, spacing, typography } from '~/styles';
import { AdminModal, AdminModalButton } from './AdminModal';
import type { Group } from '~/hooks/admin/useAdminCoins';

interface CoinOperationModalProps {
  visible: boolean;
  onClose: () => void;
  group: Group | null;
  operation: 'add' | 'remove';
  onOperation: (groupId: string, amount: number, reason: string) => Promise<void>;
  loading?: boolean;
}

export function CoinOperationModal({
  visible,
  onClose,
  group,
  operation,
  onOperation,
  loading = false,
}: CoinOperationModalProps) {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  const handleOperation = async () => {
    if (!group || !amount.trim()) {
      return;
    }

    const coinAmount = parseInt(amount);
    if (isNaN(coinAmount) || coinAmount <= 0) {
      return;
    }

    if (!reason.trim()) {
      return;
    }

    try {
      await onOperation(group.id, coinAmount, reason.trim());
      setAmount('');
      setReason('');
      onClose();
    } catch (error) {
      console.error('Failed to perform coin operation:', error);
    }
  };

  const handleClose = () => {
    setAmount('');
    setReason('');
    onClose();
  };

  return (
    <AdminModal
      visible={visible}
      onClose={handleClose}
      title={operation === 'add' ? 'Add Coins' : 'Remove Coins'}
      actions={
        <>
          <AdminModalButton
            title="Cancel"
            onPress={handleClose}
            variant="cancel"
          />
          <AdminModalButton
            title={operation === 'add' ? 'Add Coins' : 'Remove Coins'}
            onPress={handleOperation}
            variant={operation === 'add' ? 'primary' : 'danger'}
            disabled={loading}
            loading={loading}
          />
        </>
      }
    >
      {group && (
        <View style={{ marginBottom: spacing.md }}>
          <Text style={{ fontSize: typography.base, fontWeight: 'bold', color: colors.white, marginBottom: spacing.xs }}>
            {group.name}
          </Text>
          <Text style={{ fontSize: typography.sm, color: colors.accentMagenta }}>
            Current balance: {group.coins} coins
          </Text>
        </View>
      )}

      <View style={{ marginBottom: spacing.md }}>
        <Text style={{ fontSize: typography.sm, color: colors.textSecondary, marginBottom: spacing.xs }}>
          Amount
        </Text>
        <TextInput
          style={{
            backgroundColor: colors.backgroundDark,
            borderRadius: 8,
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.sm,
            fontSize: typography.base,
            color: colors.white,
            borderWidth: 1,
            borderColor: colors.borderDark,
          }}
          value={amount}
          onChangeText={setAmount}
          placeholder="Enter amount..."
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
        />
      </View>

      <View style={{ marginBottom: spacing.md }}>
        <Text style={{ fontSize: typography.sm, color: colors.textSecondary, marginBottom: spacing.xs }}>
          Reason
        </Text>
        <TextInput
          style={{
            backgroundColor: colors.backgroundDark,
            borderRadius: 8,
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.sm,
            fontSize: typography.base,
            color: colors.white,
            borderWidth: 1,
            borderColor: colors.borderDark,
            height: 80,
          }}
          value={reason}
          onChangeText={setReason}
          placeholder="Enter reason for transaction..."
          placeholderTextColor={colors.textSecondary}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>
    </AdminModal>
  );
}
