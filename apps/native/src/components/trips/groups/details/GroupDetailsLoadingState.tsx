import { StyleSheet, View } from "react-native";
import { Skeleton } from "~/components/ui/Skeleton";
import { borderRadius, colors, spacing } from "~/styles";

const STAT_COUNT = 3;
const MEMBER_COUNT = 3;

export function GroupDetailsLoadingState() {
  return (
    <Skeleton.Group testID="group-details-loading-state" style={styles.container}>
      <Skeleton
        borderRadius={borderRadius.lg}
        height={160}
        testID="group-details-hero"
        variant="box"
        width="100%"
      />
      <Skeleton height={28} testID="group-details-title" variant="text" width="60%" />
      <View style={styles.statsRow}>
        {Array.from({ length: STAT_COUNT }).map((_, index) => (
          <Skeleton
            // biome-ignore lint/suspicious/noArrayIndexKey: deterministic placeholder stats with no stable id
            key={`group-details-stat-${index}`}
            height={80}
            style={styles.stat}
            testID={`group-details-stat-${index}`}
            variant="box"
            width="100%"
          />
        ))}
      </View>
      <Skeleton
        height={20}
        style={{ marginTop: spacing.md }}
        testID="group-details-members-section"
        variant="text"
        width="40%"
      />
      {Array.from({ length: MEMBER_COUNT }).map((_, index) => (
        <Skeleton
          // biome-ignore lint/suspicious/noArrayIndexKey: deterministic placeholder members with no stable id
          key={`group-details-member-${index}`}
          height={56}
          testID={`group-details-member-${index}`}
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
  statsRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  stat: {
    flex: 1,
  },
});
