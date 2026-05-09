import { ActivityIndicator, StyleSheet, View } from "react-native";
import { colors, spacing } from "~/styles";

export function GroupsLoadingState() {
  return (
    <View testID="groups-loading-container" style={styles.container}>
      <ActivityIndicator testID="groups-loading-indicator" size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.xxxl,
    alignItems: "center",
  },
});
