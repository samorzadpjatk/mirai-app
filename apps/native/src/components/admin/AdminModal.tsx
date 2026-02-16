import React from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '~/styles';

interface AdminModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  maxWidth?: number;
  maxHeight?: number;
}

export function AdminModal({
  visible,
  onClose,
  title,
  children,
  actions,
  maxWidth = 350,
  maxHeight = 400,
}: AdminModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={[styles.modalCard, { maxWidth }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            style={{ maxHeight: maxHeight ? maxHeight - 120 : 280 }}
            contentContainerStyle={styles.modalContentContainer}
          >
            {children}
          </ScrollView>

          {actions && <View style={styles.modalActions}>{actions}</View>}
        </View>
      </View>
    </Modal>
  );
}

interface AdminModalButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'danger' | 'cancel';
  disabled?: boolean;
  loading?: boolean;
  flex?: boolean;
}

export function AdminModalButton({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  flex = true,
}: AdminModalButtonProps) {
  const getButtonStyle = () => {
    switch (variant) {
      case 'danger':
        return styles.dangerButton;
      case 'cancel':
        return styles.cancelButton;
      default:
        return styles.confirmButton;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'cancel':
        return styles.cancelButtonText;
      default:
        return styles.confirmButtonText;
    }
  };

  return (
    <TouchableOpacity
      style={[styles.modalButton, getButtonStyle(), flex && { flex: 1 }]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color={colors.white} />
      ) : (
        <Text style={getTextStyle()}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: colors.blackOpacity40,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.cardDark,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  modalTitle: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.white,
  },
  modalContentContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderWhite5,
  },
  modalButton: {
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: colors.primary,
  },
  dangerButton: {
    backgroundColor: colors.danger,
  },
  cancelButton: {
    backgroundColor: colors.cardDark,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  confirmButtonText: {
    fontSize: typography.base,
    color: colors.white,
    fontWeight: typography.medium,
  },
  cancelButtonText: {
    fontSize: typography.base,
    color: colors.textSecondary,
    fontWeight: typography.medium,
  },
});
