import { StyleSheet } from "react-native";
import { Skeleton } from "~/components/ui/Skeleton";
import { borderRadius, colors, spacing } from "~/styles";

export function ChallengeLoadingState() {
  return (
    <Skeleton.Group testID="challenge-loading-state" style={styles.container}>
      <Skeleton
        borderRadius={borderRadius.lg}
        height={180}
        testID="challenge-loading-hero"
        variant="box"
        width="100%"
      />
      <Skeleton height={28} testID="challenge-loading-title" variant="text" width="70%" />
      <Skeleton.Line count={2} height={16} testID="challenge-loading-description" width="100%" />
      <Skeleton
        height={20}
        style={{ marginTop: spacing.md }}
        testID="challenge-loading-section"
        variant="text"
        width="40%"
      />
      <Skeleton height={80} testID="challenge-loading-submission-1" variant="box" width="100%" />
      <Skeleton height={80} testID="challenge-loading-submission-2" variant="box" width="100%" />
    </Skeleton.Group>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
    padding: spacing.lg,
    gap: spacing.lg,
  },
});
