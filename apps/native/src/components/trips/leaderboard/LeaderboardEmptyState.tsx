import { StyleSheet, Text, View } from "react-native";
import { colors, typography } from "~/styles";

interface LeaderboardEmptyStateProps {
  message: string;
}

export function LeaderboardEmptyState({ message }: LeaderboardEmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message}</Text>
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
  text: {
    color: colors.textMuted,
    fontSize: typography.lg,
  },
});
