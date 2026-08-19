import { StyleSheet, Text, View } from "react-native";
import { spacing, typography } from "~/styles";
import { type ThemePalette, useThemedStyles } from "~/theme/TripThemeProvider";
import { ChallengesGridItem } from "./ChallengesGridItem";
import type { ChallengeListItem } from "./types";

interface ChallengesGridProps {
  challenges: ChallengeListItem[];
  onSelectChallenge: (challenge: ChallengeListItem) => void;
}

export function ChallengesGrid({ challenges, onSelectChallenge }: ChallengesGridProps) {
  const styles = useThemedStyles(makeStyles);
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

function makeStyles(palette: ThemePalette) {
  return StyleSheet.create({
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
      color: palette.textMuted,
      textAlign: "center",
    },
    emptySubtitle: {
      fontSize: typography.sm,
      color: palette.textMuted,
      textAlign: "center",
      marginTop: spacing.sm,
    },
  });
}
