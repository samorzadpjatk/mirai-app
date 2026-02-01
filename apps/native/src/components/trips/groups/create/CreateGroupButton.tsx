import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";
import { borderRadius, colors, spacing, typography, shadows } from "~/styles";

interface CreateGroupButtonProps {
  isSubmitting: boolean;
  onPress: () => void;
}

export function CreateGroupButton({
  isSubmitting,
  onPress,
}: CreateGroupButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.createButton, shadows.primaryGlow]}
      onPress={onPress}
      disabled={isSubmitting}
      activeOpacity={0.9}
    >
      {isSubmitting ? (
        <ActivityIndicator size="small" color={colors.backgroundDark} />
      ) : (
        <Text style={styles.createButtonText}>Create Group</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  createButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  createButtonText: {
    fontSize: typography.base,
    fontWeight: typography.bold,
    color: colors.backgroundDark,
  },
});
