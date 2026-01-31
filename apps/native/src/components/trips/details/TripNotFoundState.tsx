import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, spacing, typography } from "~/styles";

interface TripNotFoundStateProps {
  onGoBack: () => void;
}

export function TripNotFoundState({ onGoBack }: TripNotFoundStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.errorText}>Trip not found</Text>
      <TouchableOpacity onPress={onGoBack}>
        <Text style={styles.errorLink}>Go back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xxl,
  },
  errorText: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.white,
    marginBottom: spacing.md,
  },
  errorLink: {
    fontSize: typography.base,
    color: colors.primary,
    fontWeight: typography.bold,
  },
});
