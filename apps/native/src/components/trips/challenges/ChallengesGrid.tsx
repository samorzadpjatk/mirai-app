import { StyleSheet, Text, View } from "react-native";
import { spacing, typography, colors } from "~/styles";
import type { ChallengeListItem } from "./types";
import { ChallengesGridItem } from "./ChallengesGridItem";

interface ChallengesGridProps {
  challenges: ChallengeListItem[];
  onSelectChallenge: (challenge: ChallengeListItem) => void;
}

export function ChallengesGrid({ challenges, onSelectChallenge }: ChallengesGridProps) {
  if (challenges.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>No challenges available yet</Text>
        <Text style={styles.emptySubtitle}>Check back later for new challenges!</Text>
      </View>
    );
  }

  return (
    <View style={styles.grid}>
      {challenges.map((challenge) => (
        <View key={challenge.id} style={styles.gridCell}>
          <ChallengesGridItem challenge={challenge} onPress={onSelectChallenge} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: spacing.md,
    marginBottom: 40,
  },
  gridCell: {
    width: "48%",
  },
  emptyState: {
    padding: spacing.xxl,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.textMuted,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: typography.sm,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.sm,
  },
});
