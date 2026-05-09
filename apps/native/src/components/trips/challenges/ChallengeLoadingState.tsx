import { ActivityIndicator, StyleSheet, View } from "react-native";
import { colors } from "~/styles";

export function ChallengeLoadingState() {
  return (
    <View testID="challenge-loading-container" style={styles.container}>
      <ActivityIndicator testID="challenge-loading-indicator" size="large" color={colors.primary} />
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
});
