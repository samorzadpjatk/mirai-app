import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, spacing, typography } from "~/styles";

interface GroupCreateNoTripStateProps {
  onGoBack: () => void;
}

export function GroupCreateNoTripState({
  onGoBack,
}: GroupCreateNoTripStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.errorText}>No trip selected</Text>
      <TouchableOpacity onPress={onGoBack}>
        <Text style={styles.linkText}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
    backgroundColor: colors.backgroundDark,
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
