import { ActivityIndicator, StyleSheet, View } from "react-native";
import { colors } from "~/styles";

export function ChallengesLoadingState() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
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
