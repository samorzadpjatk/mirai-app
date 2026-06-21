import { StyleSheet } from "react-native";
import { Skeleton } from "~/components/ui/Skeleton";
import { colors, spacing } from "~/styles";

const CARD_COUNT = 4;

export function GroupsLoadingState() {
  return (
    <Skeleton.Group testID="groups-loading-state" style={styles.container}>
      {Array.from({ length: CARD_COUNT }).map((_, index) => (
        <Skeleton
          // biome-ignore lint/suspicious/noArrayIndexKey: deterministic placeholder cards with no stable id
          key={`groups-loading-card-${index}`}
          height={100}
          testID={`groups-loading-card-${index}`}
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
