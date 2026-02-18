import { useMemo, useState } from "react";
import { View, ScrollView, StyleSheet, Text, TouchableOpacity } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { colors, spacing } from "../../../../styles";
import { ChallengesGrid } from "~/components/trips/challenges/ChallengesGrid";
import { ChallengesLoadingState } from "~/components/trips/challenges/ChallengesLoadingState";
import { GroupInfoCard } from "~/components/trips/challenges/GroupInfoCard";
import { TripNotFoundState } from "~/components/trips/challenges/TripNotFoundState";
import { useChallenges } from "~/hooks/challenges";
import type { ChallengeListItem } from "~/components/trips/challenges/types";

const statusFilters = [
  { label: "All", value: "ALL" },
  { label: "To solve", value: "to_solve" },
  { label: "Locked", value: "HIDDEN" },
  { label: "Visible", value: "VISIBLE" },
  { label: "Active", value: "ACTIVE" },
  { label: "Voting", value: "VOTING_PHASE" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Solved", value: "solved" },
] as const;

type StatusFilter = (typeof statusFilters)[number]["value"];

export default function ChallengesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const tripId =
    typeof params.tripId === "string" ? params.tripId : params.tripId?.[0];

  const {
    trip,
    challenges,
    completedChallengesCount,
    isLoading,
    userGroup,
    leaderboardInfo,
  } =
    useChallenges(tripId);
  const [selectedStatusFilter, setSelectedStatusFilter] =
    useState<StatusFilter>("to_solve");

  const handleChallengePress = (challenge: ChallengeListItem) => {
    if (
      challenge.scoringCategory === "PEER_VOTING" &&
      challenge.lifecycleStatus === "VOTING_PHASE"
    ) {
      router.push(`/trips/challenges/vote/${challenge.id}?tripId=${tripId}`);
      return;
    }

    if (challenge.status !== "locked") {
      router.push(`/trips/challenges/${challenge.id}?tripId=${tripId}`);
    }
  };

  const filteredChallenges = useMemo(
    () =>
      selectedStatusFilter === "ALL"
        ? challenges
        : selectedStatusFilter === "solved" ||
            selectedStatusFilter === "to_solve"
          ? challenges.filter((challenge) => challenge.status === selectedStatusFilter)
          : challenges.filter(
              (challenge) => challenge.lifecycleStatus === selectedStatusFilter,
            ),
    [challenges, selectedStatusFilter],
  );

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
            completedChallengesCount={completedChallengesCount}
            totalChallengesCount={challenges.length}
          />
        )}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
        >
          {statusFilters.map((filter) => {
            const selected = selectedStatusFilter === filter.value;
            return (
              <TouchableOpacity
                key={filter.value}
                onPress={() => setSelectedStatusFilter(filter.value)}
                style={[styles.filterChip, selected && styles.filterChipActive]}
              >
                <Text
                  style={[styles.filterChipText, selected && styles.filterChipTextActive]}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Challenges Grid */}
        <ChallengesGrid
          challenges={filteredChallenges}
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
  filtersRow: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
    paddingRight: spacing.md,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  filterChipActive: {
    borderColor: colors.primary,
    backgroundColor: "rgba(0,206,209,0.2)",
  },
  filterChipText: {
    color: colors.textMuted,
    fontWeight: "700",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  filterChipTextActive: {
    color: colors.primary,
  },
});
