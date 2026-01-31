import { ActivityIndicator, StyleSheet, View } from "react-native";
import { colors, spacing } from "~/styles";

export function GroupsLoadingState() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.xxxl,
    alignItems: "center",
  },
});
