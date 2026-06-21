import { StyleSheet } from "react-native";
import { Skeleton } from "~/components/ui/Skeleton";
import { colors, spacing } from "~/styles";

const ROWS = 3;

export function RewardsHistoryLoadingState() {
  return (
    <Skeleton.Group testID="rewards-history-loading-state" style={styles.container}>
      <Skeleton.Line count={1} height={24} width="55%" />
      {Array.from({ length: ROWS }).map((_, index) => (
        <Skeleton
          // biome-ignore lint/suspicious/noArrayIndexKey: deterministic placeholder rows with no stable id
          key={`rewards-history-loading-row-${index}`}
          height={120}
          testID={`rewards-history-loading-row-${index}`}
          variant="box"
          width="100%"
        />
      ))}
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
