import { View, ScrollView, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { colors, spacing } from "../../../../styles";
import { ChallengesGrid } from "~/components/trips/challenges/ChallengesGrid";
import { ChallengesLoadingState } from "~/components/trips/challenges/ChallengesLoadingState";
import { GroupInfoCard } from "~/components/trips/challenges/GroupInfoCard";
import { TripNotFoundState } from "~/components/trips/challenges/TripNotFoundState";
import { useChallenges } from "~/hooks/challenges";
import type { ChallengeListItem } from "~/components/trips/challenges/types";

export default function ChallengesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const tripId =
    typeof params.tripId === "string" ? params.tripId : params.tripId?.[0];

  const { trip, challenges, isLoading, userGroup, leaderboardInfo } =
    useChallenges(tripId);

  const handleChallengePress = (challenge: ChallengeListItem) => {
    if (challenge.status !== "locked") {
      router.push(`/trips/challenges/${challenge.id}?tripId=${tripId}`);
    }
  };

  if (!tripId || isLoading) {
    return <ChallengesLoadingState />;
  }

  if (!trip) {
    return <TripNotFoundState />;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent]}
        showsVerticalScrollIndicator={false}
      >
        {/* Group Info Card */}
        {userGroup && (
          <GroupInfoCard
            groupName={userGroup.name}
            position={leaderboardInfo?.position}
            totalGroups={leaderboardInfo?.totalGroups}
            pointsDifference={leaderboardInfo?.pointsDifference}
          />
        )}

        {/* Challenges Grid */}
        <ChallengesGrid
          challenges={challenges}
          onSelectChallenge={handleChallengePress}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingTop: spacing.lg, // Space for BackNavbar
    paddingBottom: spacing.xxxl,
  },
});
