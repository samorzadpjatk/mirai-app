import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, borderRadius, typography, shadows } from "~/styles";

interface GroupsCreateButtonProps {
  onPress: () => void;
}

export function GroupsCreateButton({ onPress }: GroupsCreateButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.createButton, shadows.primaryGlow]}
      activeOpacity={0.9}
      onPress={onPress}
    >
      <Ionicons name="add-circle" size={20} color={colors.backgroundDark} />
      <Text style={styles.createButtonText}>CREATE GROUP</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  createButton: {
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.lg,
  },
  createButtonText: {
    fontSize: typography.base,
    fontWeight: typography.bold,
    color: colors.backgroundDark,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
});
