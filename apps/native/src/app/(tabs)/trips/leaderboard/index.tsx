import { useMemo } from "react";
import { View, ScrollView, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQuery } from "urql";
import {
  GetTripDocument,
  GetCurrentUserDocument,
  GetGroupRankingDocument,
} from "@mirai-app/graphql-client";
import { colors, spacing } from "../../../../styles";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LeaderboardEmptyState } from "~/components/trips/leaderboard/LeaderboardEmptyState";
import { LeaderboardPodium } from "~/components/trips/leaderboard/LeaderboardPodium";
import { LeaderboardRankingsSection } from "~/components/trips/leaderboard/LeaderboardRankingsSection";
import type { RankedGroup } from "~/components/trips/leaderboard/types";

export default function LeaderboardScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const tripId =
    typeof params.tripId === "string" ? params.tripId : params.tripId?.[0];
  const insets = useSafeAreaInsets();

  // GraphQL queries
  const [{ data: tripData, fetching: tripLoading }] = useQuery({
    query: GetTripDocument,
    variables: { id: tripId ?? "" },
    pause: !tripId,
  });
  const trip = tripData?.trip;

  const [{ data: currentUserData }] = useQuery({
    query: GetCurrentUserDocument,
  });
  const currentUser = currentUserData?.currentUser;

  const [{ data: rankingData }] = useQuery({
    query: GetGroupRankingDocument,
    variables: { tripId: tripId ?? "" },
    pause: !tripId,
  });

  // Calculate rankings from GraphQL data
  const rankedGroups: RankedGroup[] = useMemo(() => {
    if (!rankingData?.groupRanking?.groups) return [];

    const userGroupId = rankingData.groupRanking.groups.find((g) =>
      g.participants?.some((p) => p.user?.id === currentUser?.id),
    )?.id;

    const sorted = rankingData.groupRanking.groups
      .sort((a, b) => (b.coins ?? 0) - (a.coins ?? 0))
      .map((group, index) => ({
        id: group.id,
        name: group.name ?? "Unknown",
        image: group.image,
        coins: group.coins ?? 0,
        memberCount: group._count?.participants ?? 0,
        rank: index + 1,
        isCurrentUserGroup: group.id === userGroupId,
      }));

    return sorted;
  }, [rankingData, currentUser?.id]);

  const topThree = rankedGroups.slice(0, 3);
  const restOfGroups = rankedGroups.slice(3);

  if (!tripId || tripLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.backgroundDark,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!trip) {
    return <LeaderboardEmptyState message="Trip not found" />;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + spacing.xl,
            paddingBottom: insets.bottom + spacing.xxxl,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Podium Section */}
        <LeaderboardPodium
          topThree={topThree}
          onPressGroup={(group) => router.push(`/trips/groups/${group.id}`)}
        />

        {/* Rankings List */}
        <LeaderboardRankingsSection
          groups={restOfGroups}
          onPressGroup={(group) => router.push(`/trips/groups/${group.id}`)}
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
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
});
