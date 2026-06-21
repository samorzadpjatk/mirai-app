import { StyleSheet, View } from "react-native";
import { Skeleton } from "~/components/ui/Skeleton";
import { colors, spacing } from "~/styles";

const CARDS_PER_ROW = 2;
const ROW_COUNT = 3;

export function ChallengesLoadingState() {
  return (
    <Skeleton.Group testID="challenges-loading-state" style={styles.container}>
      {Array.from({ length: ROW_COUNT }).map((_, rowIndex) => (
        <View
          // biome-ignore lint/suspicious/noArrayIndexKey: deterministic placeholder rows with no stable id
          key={`challenges-loading-row-${rowIndex}`}
          style={styles.gridRow}
        >
          {Array.from({ length: CARDS_PER_ROW }).map((__, cardIndex) => (
            <Skeleton
              // biome-ignore lint/suspicious/noArrayIndexKey: deterministic placeholder cards with no stable id
              key={`challenges-loading-card-${rowIndex}-${cardIndex}`}
              height={120}
              style={styles.flexCard}
              testID={`challenges-loading-card-${rowIndex}-${cardIndex}`}
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
  gridRow: {
    flexDirection: "row",
    gap: spacing.lg,
  },
  flexCard: {
    flex: 1,
  },
});
