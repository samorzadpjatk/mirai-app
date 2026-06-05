import { StyleSheet, View } from "react-native";
import { borderRadius, colors, spacing } from "~/styles";

export function ChallengesLoadingState() {
  return (
    <View testID="challenges-loading-state" style={styles.container}>
      {/* Challenge grid placeholders */}
      <View style={styles.gridRow}>
        <View style={styles.cardPlaceholder} />
        <View style={styles.cardPlaceholder} />
      </View>
      <View style={styles.gridRow}>
        <View style={styles.cardPlaceholder} />
        <View style={styles.cardPlaceholder} />
      </View>
      <View style={styles.gridRow}>
        <View style={styles.cardPlaceholder} />
        <View style={styles.cardPlaceholder} />
      </View>
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
  gridRow: {
    flexDirection: "row",
    gap: spacing.lg,
  },
  cardPlaceholder: {
    flex: 1,
    height: 120,
    backgroundColor: colors.surfaceDark,
    borderRadius: borderRadius.md,
  },
});
