import { StyleSheet, View } from "react-native";
import { borderRadius, colors, spacing } from "~/styles";

export function GroupEditLoadingState() {
  return (
    <View testID="group-edit-loading-state" style={styles.container}>
      {/* Form field placeholders */}
      <View style={styles.fieldLabelPlaceholder} />
      <View style={styles.fieldInputPlaceholder} />
      <View style={styles.fieldLabelPlaceholder} />
      <View style={styles.fieldInputPlaceholder} />
      <View style={styles.fieldLabelPlaceholder} />
      <View style={styles.fieldInputPlaceholder} />
      {/* Button placeholder */}
      <View style={styles.buttonPlaceholder} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
    padding: spacing.lg,
    gap: spacing.md,
  },
  fieldLabelPlaceholder: {
    height: 16,
    width: "30%",
    backgroundColor: colors.surfaceDark,
    borderRadius: borderRadius.sm,
  },
  fieldInputPlaceholder: {
    height: 48,
    backgroundColor: colors.surfaceDark,
    borderRadius: borderRadius.md,
  },
  buttonPlaceholder: {
    height: 48,
    backgroundColor: colors.surfaceDark,
    borderRadius: borderRadius.md,
    marginTop: spacing.lg,
  },
});
