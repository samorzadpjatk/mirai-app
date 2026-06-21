import { StyleSheet, View } from "react-native";
import { Skeleton } from "~/components/ui/Skeleton";
import { colors, spacing } from "~/styles";

const ROWS = 2;
const COLS = 2;

export function RewardsLoadingState() {
  return (
    <Skeleton.Group testID="rewards-loading-state" style={styles.container}>
      <Skeleton.Line count={1} height={28} width="60%" />
      <Skeleton.Line count={1} height={16} width="40%" />
      {Array.from({ length: ROWS }).map((_, rowIndex) => (
        <View
          // biome-ignore lint/suspicious/noArrayIndexKey: deterministic placeholder rows with no stable id
          key={`rewards-loading-row-${rowIndex}`}
          style={styles.row}
        >
          {Array.from({ length: COLS }).map((__, colIndex) => (
            <Skeleton
              // biome-ignore lint/suspicious/noArrayIndexKey: deterministic placeholder cards with no stable id
              key={`rewards-loading-card-${rowIndex}-${colIndex}`}
              height={160}
              style={styles.card}
              testID={`rewards-loading-card-${rowIndex}-${colIndex}`}
              variant="box"
              width="100%"
            />
          ))}
        </View>
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
  row: {
    flexDirection: "row",
    gap: spacing.lg,
  },
  card: {
    flex: 1,
  },
});
