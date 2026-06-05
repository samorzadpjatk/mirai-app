import { orpc } from "@mirai-app/orpc/client";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LeaderboardEmptyState } from "~/components/trips/leaderboard/LeaderboardEmptyState";
import { LeaderboardPodium } from "~/components/trips/leaderboard/LeaderboardPodium";
import { LeaderboardRankingsSection } from "~/components/trips/leaderboard/LeaderboardRankingsSection";
import type { RankedGroup } from "~/components/trips/leaderboard/types";
import { colors, spacing } from "../../../../styles";

export default function LeaderboardScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const tripId = typeof params.tripId === "string" ? params.tripId : params.tripId?.[0];
  const insets = useSafeAreaInsets();

  const { data: trip, isLoading: tripLoading } = useQuery({
    ...orpc.trip.getById.queryOptions({ input: { id: tripId ?? "" } }),
    enabled: !!tripId,
  });

  const { data: currentUser } = useQuery(orpc.user.getMy.queryOptions({ input: {} }));

  // Calculate rankings
  const rankedGroups: RankedGroup[] = useMemo(() => {
    if (!trip?.groups) return [];

    const userGroupId = trip.participants.find((p) => p.user?.id === currentUser?.id)?.group?.id;

    const sorted = [...trip.groups]
      .sort((a, b) => (b.coins ?? 0) - (a.coins ?? 0))
      .map((group, index) => ({
        id: group.id,
        name: group.name ?? "",
        image: group.image,
        coins: group.coins ?? 0,
        memberCount: group._count?.participants ?? 0,
        rank: index + 1,
        isCurrentUserGroup: group.id === userGroupId,
      }));

    return sorted;
  }, [trip, currentUser?.id]);

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
