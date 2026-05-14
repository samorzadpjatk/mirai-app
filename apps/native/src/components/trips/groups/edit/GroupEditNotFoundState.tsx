import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, spacing, typography } from "~/styles";

interface GroupEditNotFoundStateProps {
  onGoBack: () => void;
}

export function GroupEditNotFoundState({ onGoBack }: GroupEditNotFoundStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.errorText}>Group not found</Text>
      <TouchableOpacity onPress={onGoBack}>
        <Text style={styles.linkText}>Go Back</Text>
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
  linkText: {
    color: colors.primary,
    fontWeight: typography.bold,
  },
});
