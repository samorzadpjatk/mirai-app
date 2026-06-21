import { StyleSheet } from "react-native";
import { Skeleton } from "~/components/ui/Skeleton";
import { borderRadius, colors, spacing } from "~/styles";

export function GroupEditLoadingState() {
  return (
    <Skeleton.Group testID="group-edit-loading-state" style={styles.container}>
      <Skeleton height={16} testID="group-edit-label-0" variant="text" width="30%" />
      <Skeleton
        borderRadius={borderRadius.md}
        height={48}
        testID="group-edit-input-0"
        variant="box"
        width="100%"
      />
      <Skeleton height={16} testID="group-edit-label-1" variant="text" width="30%" />
      <Skeleton
        borderRadius={borderRadius.md}
        height={48}
        testID="group-edit-input-1"
        variant="box"
        width="100%"
      />
      <Skeleton height={16} testID="group-edit-label-2" variant="text" width="30%" />
      <Skeleton
        borderRadius={borderRadius.md}
        height={48}
        testID="group-edit-input-2"
        variant="box"
        width="100%"
      />
      <Skeleton
        borderRadius={borderRadius.md}
        height={48}
        style={styles.button}
        testID="group-edit-button"
        variant="box"
        width="100%"
      />
    </Skeleton.Group>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
    padding: spacing.lg,
    gap: spacing.md,
  },
  button: {
    marginTop: spacing.lg,
  },
});
