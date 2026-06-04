import { StyleSheet, View } from "react-native";
import { borderRadius, colors, spacing } from "~/styles";

export function GroupsLoadingState() {
  return (
    <View testID="groups-loading-state" style={styles.container}>
      {/* Group card placeholders */}
      <View style={styles.cardPlaceholder} />
      <View style={styles.cardPlaceholder} />
      <View style={styles.cardPlaceholder} />
      <View style={styles.cardPlaceholder} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  cardPlaceholder: {
    height: 100,
    backgroundColor: colors.surfaceDark,
    borderRadius: borderRadius.md,
  },
});
