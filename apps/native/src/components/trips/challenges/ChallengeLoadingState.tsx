import { StyleSheet, View } from "react-native";
import { borderRadius, colors, spacing } from "~/styles";

export function ChallengeLoadingState() {
  return (
    <View testID="challenge-loading-state" style={styles.container}>
      {/* Hero placeholder */}
      <View style={styles.heroPlaceholder} />
      {/* Title placeholder */}
      <View style={styles.titlePlaceholder} />
      {/* Description placeholder */}
      <View style={styles.descriptionPlaceholder} />
      <View style={styles.descriptionPlaceholder} />
      {/* Submissions placeholder */}
      <View style={styles.sectionPlaceholder} />
      <View style={styles.submissionPlaceholder} />
      <View style={styles.submissionPlaceholder} />
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
  heroPlaceholder: {
    height: 180,
    backgroundColor: colors.surfaceDark,
    borderRadius: borderRadius.lg,
  },
  titlePlaceholder: {
    height: 28,
    width: "70%",
    backgroundColor: colors.surfaceDark,
    borderRadius: borderRadius.sm,
  },
  descriptionPlaceholder: {
    height: 16,
    width: "100%",
    backgroundColor: colors.surfaceDark,
    borderRadius: borderRadius.sm,
  },
  sectionPlaceholder: {
    height: 20,
    width: "40%",
    backgroundColor: colors.surfaceDark,
    borderRadius: borderRadius.sm,
    marginTop: spacing.md,
  },
  submissionPlaceholder: {
    height: 80,
    backgroundColor: colors.surfaceDark,
    borderRadius: borderRadius.md,
  },
});
