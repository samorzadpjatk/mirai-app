import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { borderRadius, colors, spacing, typography } from "~/styles";

interface GroupNotFoundStateProps {
  onGoBack: () => void;
}

export function GroupNotFoundState({ onGoBack }: GroupNotFoundStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.errorText}>Group not found</Text>
      <TouchableOpacity onPress={onGoBack} style={styles.backButton}>
        <Text style={styles.backButtonText}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: typography.lg,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  backButtonText: {
    fontSize: typography.base,
    fontWeight: typography.bold,
    color: colors.backgroundDark,
  },
});
