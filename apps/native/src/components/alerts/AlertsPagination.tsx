import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { borderRadius, spacing, typography } from "~/styles";
import { type ThemePalette, useThemedStyles } from "~/theme/TripThemeProvider";

interface AlertsPaginationProps {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
}

export function AlertsPagination({ page, totalPages, onPrev, onNext }: AlertsPaginationProps) {
  const styles = useThemedStyles(makeStyles);

  if (totalPages <= 1) {
    return null;
  }

  return (
    <View style={styles.pagination}>
      <TouchableOpacity
        style={[styles.paginationButton, page === 1 && styles.paginationButtonDisabled]}
        onPress={onPrev}
        disabled={page === 1}
      >
        <Text
          style={[styles.paginationButtonText, page === 1 && styles.paginationButtonTextDisabled]}
        >
          Previous
        </Text>
      </TouchableOpacity>
      <Text style={styles.paginationText}>
        Page {page} of {totalPages}
      </Text>
      <TouchableOpacity
        style={[styles.paginationButton, page === totalPages && styles.paginationButtonDisabled]}
        onPress={onNext}
        disabled={page === totalPages}
      >
        <Text
          style={[
            styles.paginationButtonText,
            page === totalPages && styles.paginationButtonTextDisabled,
          ]}
        >
          Next
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function makeStyles(palette: ThemePalette) {
  return StyleSheet.create({
    pagination: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: spacing.xl,
      paddingTop: spacing.xl,
      borderTopWidth: 1,
      borderTopColor: "rgba(255, 255, 255, 0.05)",
    },
    paginationButton: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      backgroundColor: palette.cardDark,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: "rgba(0, 206, 209, 0.3)",
    },
    paginationButtonDisabled: {
      opacity: 0.3,
      borderColor: "rgba(255, 255, 255, 0.05)",
    },
    paginationButtonText: {
      fontSize: typography.sm,
      fontWeight: typography.bold,
      color: palette.primary,
    },
    paginationButtonTextDisabled: {
      color: palette.textMuted,
    },
    paginationText: {
      fontSize: typography.sm,
      color: palette.textMuted,
    },
  });
}
