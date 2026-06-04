import { ActivityIndicator, StyleSheet, View } from "react-native";
import { colors } from "~/styles";

export function GroupDetailsLoadingState() {
  return (
    <View style={styles.container}>
      <ActivityIndicator
        testID="group-details-loading-indicator"
        size="large"
        color={colors.primary}
      />
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
