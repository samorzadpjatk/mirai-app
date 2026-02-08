import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { borderRadius, colors, spacing, typography } from "~/styles";

interface ChallengeActionButtonProps {
  isLoading: boolean;
  onPress: () => void;
}

export function ChallengeActionButton({
  isLoading,
  onPress,
}: ChallengeActionButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isLoading}
      style={[styles.button, isLoading && styles.buttonLoading]}
    >
      <Ionicons name="camera" size={24} color={colors.backgroundDark} />
      <Text style={styles.buttonText}>
        {isLoading ? "Loading..." : "Take Challenge Photo"}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    opacity: 1,
  },
  buttonLoading: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.backgroundDark,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});
