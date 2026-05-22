import { type ReactNode } from "react";
import { View, StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { colors, spacing } from "~/styles";
import { PrimaryLoadingButton } from "../buttons/PrimaryLoadingButton";

interface AppModalFooterProps {
  children?: ReactNode;
  primaryLabel: string;
  onPrimary: () => void;
  isPrimaryLoading?: boolean;
  isPrimaryDisabled?: boolean;
  secondaryLabel?: string;
  onSecondary?: () => void;
  style?: StyleProp<ViewStyle>;
  variant?: "centered" | "right";
  primaryTestID?: string;
  secondaryTestID?: string;
}

export function AppModalFooter({
  children,
  primaryLabel,
  onPrimary,
  isPrimaryLoading = false,
  isPrimaryDisabled = false,
  secondaryLabel,
  onSecondary,
  style,
  variant = "centered",
  primaryTestID = "app-modal-footer-primary",
  secondaryTestID = "app-modal-footer-secondary",
}: AppModalFooterProps) {
  return (
    <View style={[styles.footer, variant === "right" && styles.footerRight, style]}>
      {children}
      <View style={styles.actions}>
        {secondaryLabel && onSecondary && (
          <PrimaryLoadingButton
            testID={secondaryTestID}
            label={secondaryLabel}
            isLoading={false}
            onPress={onSecondary}
            disabled={isPrimaryLoading}
            style={styles.secondaryButton}
            textStyle={styles.secondaryButtonText}
          />
        )}
        <PrimaryLoadingButton
          testID={primaryTestID}
          label={primaryLabel}
          isLoading={isPrimaryLoading}
          onPress={onPrimary}
          disabled={isPrimaryDisabled || isPrimaryLoading}
          style={styles.primaryButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderWhite5,
    gap: spacing.md,
  },
  footerRight: {
    justifyContent: "flex-end",
  },
  actions: {
    flexDirection: "row",
    gap: spacing.md,
    flex: 1,
  },
  primaryButton: {
    flex: 1,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  secondaryButtonText: {
    color: colors.textSecondary,
  },
});
