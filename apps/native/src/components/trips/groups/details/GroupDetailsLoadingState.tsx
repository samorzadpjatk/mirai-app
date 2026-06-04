import { StyleSheet, View } from "react-native";
import { borderRadius, colors, spacing } from "~/styles";

export function GroupDetailsLoadingState() {
  return (
    <View testID="group-details-loading-state" style={styles.container}>
      {/* Hero placeholder */}
      <View style={styles.heroPlaceholder} />
      {/* Title placeholder */}
      <View style={styles.titlePlaceholder} />
      {/* Stats grid placeholders */}
      <View style={styles.statsRow}>
        <View style={styles.statPlaceholder} />
        <View style={styles.statPlaceholder} />
        <View style={styles.statPlaceholder} />
      </View>
      {/* Member list placeholder */}
      <View style={styles.sectionPlaceholder} />
      <View style={styles.memberRowPlaceholder} />
      <View style={styles.memberRowPlaceholder} />
      <View style={styles.memberRowPlaceholder} />
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
    height: 160,
    backgroundColor: colors.surfaceDark,
    borderRadius: borderRadius.lg,
  },
  titlePlaceholder: {
    height: 28,
    width: "60%",
    backgroundColor: colors.surfaceDark,
    borderRadius: borderRadius.sm,
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  statPlaceholder: {
    flex: 1,
    height: 80,
    backgroundColor: colors.surfaceDark,
    borderRadius: borderRadius.md,
  },
  sectionPlaceholder: {
    height: 20,
    width: "40%",
    backgroundColor: colors.surfaceDark,
    borderRadius: borderRadius.sm,
    marginTop: spacing.md,
  },
  memberRowPlaceholder: {
    height: 56,
    backgroundColor: colors.surfaceDark,
    borderRadius: borderRadius.md,
  },
});
