import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, borderRadius, typography } from "~/styles";

interface GroupsCreateButtonProps {
  onPress: () => void;
}

export function GroupsCreateButton({ onPress }: GroupsCreateButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.createButton}
      activeOpacity={0.9}
    >
      <Ionicons name="add-circle" size={24} color={colors.backgroundDark} />
      <Text style={styles.createButtonText}>Add New</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  createButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    minWidth: 120,
    marginBottom: spacing.lg,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: typography.bold,
    color: colors.backgroundDark,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
});
