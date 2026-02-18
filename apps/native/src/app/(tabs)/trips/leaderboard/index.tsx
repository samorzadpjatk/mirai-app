import { useMemo } from "react";
import { View, ScrollView, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@integral-2025-app/trpc/client";
import { colors, spacing } from "../../../../styles";
import { useAppSafeAreaInsets } from "~/contexts/SafeAreaInsetsContext";
import { LeaderboardEmptyState } from "~/components/trips/leaderboard/LeaderboardEmptyState";
import { LeaderboardPodium } from "~/components/trips/leaderboard/LeaderboardPodium";
import { LeaderboardRankingsSection } from "~/components/trips/leaderboard/LeaderboardRankingsSection";
import type { RankedGroup } from "~/components/trips/leaderboard/types";

export default function LeaderboardScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const tripId =
    typeof params.tripId === "string" ? params.tripId : params.tripId?.[0];
  const trpc = useTRPC();
  const insets = useAppSafeAreaInsets();

  const { data: trip, isLoading: tripLoading } = useQuery({
    ...trpc.trip.getById.queryOptions({ id: tripId ?? "" }),
    enabled: !!tripId,
  });

  const { data: currentUser } = useQuery(trpc.user.getMy.queryOptions());

  // Calculate rankings
  const rankedGroups: RankedGroup[] = useMemo(() => {
    if (!trip?.groups) return [];

    const userGroupId = trip.participants.find(
      (p) => p.user.id === currentUser?.id,
    )?.group?.id;

    const sorted = [...trip.groups]
      .sort((a, b) => b.coins - a.coins)
      .map((group, index) => ({
        id: group.id,
        name: group.name,
        image: group.image,
        coins: group.coins,
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
