import type React from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { AppModalShell } from "~/components/common/ui";
import { borderRadius, colors, spacing, typography } from "~/styles";

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
    <AppModalShell
      visible={visible}
      title={title}
      onClose={onClose}
      variant="card"
      maxWidth={maxWidth}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        style={{ maxHeight: maxHeight ? maxHeight - 120 : 280 }}
        contentContainerStyle={{ padding: spacing.lg }}
      >
        {children}
      </ScrollView>

      {actions ? <View style={{ padding: spacing.lg, paddingTop: 0 }}>{actions}</View> : null}
    </AppModalShell>
  );
}

interface AdminModalButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "danger" | "cancel";
  disabled?: boolean;
  loading?: boolean;
  flex?: boolean;
}

export function AdminModalButton({
  title,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  flex = true,
}: AdminModalButtonProps) {
  const getButtonStyle = () => {
    switch (variant) {
      case "danger":
        return styles.dangerButton;
      case "cancel":
        return styles.cancelButton;
      default:
        return styles.confirmButton;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case "cancel":
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
  modalButton: {
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: "center",
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
