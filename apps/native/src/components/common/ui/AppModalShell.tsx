import type { ReactNode } from "react";
import {
  type DimensionValue,
  Modal,
  Pressable,
  type StyleProp,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import { borderRadius, colors, spacing, typography } from "~/styles";
import { type ThemePalette, useThemedStyles } from "~/theme/TripThemeProvider";

interface AppModalShellProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  maxHeight?: DimensionValue;
  contentStyle?: StyleProp<ViewStyle>;
  variant?: "card" | "pageSheet";
  maxWidth?: number;
}

export function AppModalShell({
  visible,
  title,
  onClose,
  children,
  maxHeight = "80%",
  contentStyle,
  variant = "card",
  maxWidth,
}: AppModalShellProps) {
  const styles = useThemedStyles(makeStyles);
  const isPageSheet = variant === "pageSheet";

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent={!isPageSheet}
      animationType={isPageSheet ? "slide" : "fade"}
      presentationStyle={isPageSheet ? "pageSheet" : undefined}
      onRequestClose={onClose}
      testID="app-modal"
    >
      {isPageSheet ? (
        <View style={styles.pageSheetContainer}>
          <View style={[styles.pageSheetContent, maxWidth ? { maxWidth } : undefined]}>
            <View style={styles.pageSheetHeader}>
              <Text style={styles.pageSheetTitle}>{title}</Text>
              <Pressable onPress={onClose}>
                <Text style={styles.pageSheetClose}>✕</Text>
              </Pressable>
            </View>
            <View style={[styles.pageSheetBody, { maxHeight }, contentStyle]}>{children}</View>
          </View>
        </View>
      ) : (
        <Pressable style={styles.modalOverlay} onPress={onClose} testID="app-modal-overlay">
          <Pressable
            style={[styles.modalContent, { maxHeight }, maxWidth ? { maxWidth } : undefined]}
            onPress={(event) => event.stopPropagation()}
            testID="app-modal-content"
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{title}</Text>
              <Pressable onPress={onClose}>
                <Text style={styles.modalClose}>✕</Text>
              </Pressable>
            </View>
            <View style={[styles.modalBody, contentStyle]}>{children}</View>
          </Pressable>
        </Pressable>
      )}
    </Modal>
  );
}

function makeStyles(palette: ThemePalette) {
  return StyleSheet.create({
    // Card modal (overlay) styles
    modalOverlay: {
      flex: 1,
      backgroundColor: colors.blackOpacity40,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: spacing.lg,
    },
    modalContent: {
      backgroundColor: palette.cardDark,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: palette.borderDark,
      width: "85%",
      maxHeight: "80%",
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderWhite5,
    },
    modalTitle: {
      fontSize: typography.lg,
      fontWeight: typography.bold,
      color: colors.white,
      letterSpacing: -0.3,
    },
    modalClose: {
      fontSize: 24,
      color: colors.textSecondary,
      fontWeight: "600",
      paddingHorizontal: spacing.xs,
      paddingVertical: spacing.xs,
    },
    modalBody: {
      padding: spacing.lg,
    },

    // Page sheet modal styles
    pageSheetContainer: {
      flex: 1,
      backgroundColor: colors.backgroundDark,
    },
    pageSheetContent: {
      flex: 1,
    },
    pageSheetHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: palette.borderDark,
    },
    pageSheetTitle: {
      fontSize: typography.lg,
      fontWeight: typography.bold,
      color: colors.white,
      letterSpacing: -0.3,
    },
    pageSheetClose: {
      fontSize: 24,
      color: colors.textSecondary,
      fontWeight: "600",
      paddingHorizontal: spacing.xs,
      paddingVertical: spacing.xs,
    },
    pageSheetBody: {
      flex: 1,
    },
  });
}
