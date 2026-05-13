import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { borderRadius, colors, spacing, typography } from "~/styles";

interface ChallengeNotFoundStateProps {
  onGoBack: () => void;
}

export function ChallengeNotFoundState({ onGoBack }: ChallengeNotFoundStateProps) {
  return (
    <View testID="challenge-not-found-container" style={styles.container}>
      <Text style={styles.title}>Challenge not found</Text>
      <TouchableOpacity onPress={onGoBack} style={styles.button}>
        <Text style={styles.buttonText}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  title: {
    color: colors.white,
    fontSize: typography.xl,
    fontWeight: typography.bold,
    marginBottom: spacing.md,
  },
  button: {
    padding: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
  },
  buttonText: {
    color: colors.backgroundDark,
    fontWeight: typography.bold,
  },
});
