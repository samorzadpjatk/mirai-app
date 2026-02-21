import { useCallback, useMemo, useState } from "react";
import {
  RefreshControl,
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { colors, spacing } from "../../../../styles";
import { ChallengesGrid } from "~/components/trips/challenges/ChallengesGrid";
import { ChallengesLoadingState } from "~/components/trips/challenges/ChallengesLoadingState";
import { GroupInfoCard } from "~/components/trips/challenges/GroupInfoCard";
import { TripNotFoundState } from "~/components/trips/challenges/TripNotFoundState";
import { useChallenges } from "~/hooks/challenges";
import type {
  ChallengeListItem,
  ChallengeSubmissionType,
} from "~/components/trips/challenges/types";

const statusFilters = [
  { label: "All", value: "ALL" },
  { label: "Active", value: "to_solve" },
  { label: "Locked", value: "HIDDEN" },
  { label: "Visible", value: "VISIBLE" },
  { label: "Voting", value: "VOTING_PHASE" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Solved", value: "solved" },
] as const;

type StatusFilter = (typeof statusFilters)[number]["value"];

const typeFilters = [
  { label: "All", value: "ALL", icon: "grid-outline" },
  { label: "Photo", value: "IMAGE", icon: "image-outline" },
  { label: "Video", value: "VIDEO", icon: "videocam-outline" },
  { label: "Text", value: "TEXT", icon: "document-text-outline" },
  {
    label: "Photo+GPS",
    value: "IMAGE_LOCATION",
    icon: "camera-outline",
    secondaryIcon: "location-outline",
  },
  { label: "GPS", value: "LOCATION", icon: "location-outline" },
  { label: "QR", value: "QR_CODE", icon: "qr-code-outline" },
] as const;

type TypeFilter = (typeof typeFilters)[number]["value"];

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
    isRefreshing,
    refresh,
    userGroup,
    leaderboardInfo,
  } = useChallenges(tripId);
  const [selectedStatusFilter, setSelectedStatusFilter] =
    useState<StatusFilter>("ALL");
  const [selectedTypeFilter, setSelectedTypeFilter] =
    useState<TypeFilter>("ALL");

  const toSolveChallenges = useMemo(
    () =>
      challenges.filter(
        (challenge) =>
          challenge.status === "to_solve" || challenge.status === "rejected",
      ),
    [challenges],
  );

  const toSolveTypeCount = useMemo(() => {
    const counts: Record<ChallengeSubmissionType, number> = {
      IMAGE: 0,
      MULTI_IMAGE: 0,
      VIDEO: 0,
      TEXT: 0,
      IMAGE_LOCATION: 0,
      LOCATION: 0,
      QR_CODE: 0,
    };

    for (const challenge of toSolveChallenges) {
      counts[challenge.submissionType] += 1;
    }

    return counts;
  }, [toSolveChallenges]);

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

  const filteredChallenges = useMemo(() => {
    const statusFiltered =
      selectedStatusFilter === "ALL"
        ? challenges
            .filter((challenge) => challenge.lifecycleStatus !== "COMPLETED")
            .sort((a, b) => {
            const getAllBucket = (challenge: ChallengeListItem) => {
              if (
                challenge.status === "to_solve" &&
                challenge.lifecycleStatus !== "VISIBLE"
              ) {
                return 0; // active
              }
              if (challenge.status === "submitted") {
                return 1; // submitted
              }
              if (challenge.lifecycleStatus === "VISIBLE") {
                return 2; // visible
              }
              if (challenge.status === "solved") {
                return 3; // solved
              }
              if (challenge.status === "locked") {
                return 5; // locked at the end
              }
              return 4; // other statuses between solved and locked
            };

            return getAllBucket(a) - getAllBucket(b);
          })
        : selectedStatusFilter === "solved" ||
            selectedStatusFilter === "to_solve"
          ? challenges.filter(
              (challenge) => challenge.status === selectedStatusFilter,
            )
          : challenges.filter(
              (challenge) => challenge.lifecycleStatus === selectedStatusFilter,
            );

    if (selectedTypeFilter === "ALL") {
      return statusFiltered;
    }

    return statusFiltered.filter(
      (challenge) => challenge.submissionType === selectedTypeFilter,
    );
  }, [challenges, selectedStatusFilter, selectedTypeFilter]);

  const handleRefresh = useCallback(() => {
    void refresh();
  }, [refresh]);

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
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.white}
            colors={[colors.white]}
            progressBackgroundColor={colors.cardDarkOpacity70}
          />
        }
      >
        {/* Group Info Card */}
        {userGroup && (
          <GroupInfoCard
            groupName={userGroup.name}
            position={leaderboardInfo?.position}
            totalGroups={leaderboardInfo?.totalGroups}
            pointsDifference={leaderboardInfo?.pointsDifference}
            targetPosition={leaderboardInfo?.targetPosition ?? undefined}
            targetGroupName={leaderboardInfo?.targetGroupName ?? undefined}
            completedChallengesCount={completedChallengesCount}
            totalChallengesCount={challenges.length}
          />
        )}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.typeFiltersRow}
        >
          {typeFilters.map((filter) => {
            const selected = selectedTypeFilter === filter.value;
            const count =
              filter.value === "ALL"
                ? toSolveChallenges.length
                : toSolveTypeCount[filter.value];

            return (
              <TouchableOpacity
                key={filter.value}
                onPress={() => setSelectedTypeFilter(filter.value)}
                style={[styles.typeChip, selected && styles.typeChipActive]}
              >
                <View style={styles.typeChipIcons}>
                  <Ionicons
                    name={filter.icon as keyof typeof Ionicons.glyphMap}
                    size={14}
                    color={selected ? colors.primary : colors.textMuted}
                  />
                  {"secondaryIcon" in filter && filter.secondaryIcon ? (
                    <Ionicons
                      name={
                        filter.secondaryIcon as keyof typeof Ionicons.glyphMap
                      }
                      size={14}
                      color={selected ? colors.primary : colors.textMuted}
                    />
                  ) : null}
                </View>
                <View
                  style={[
                    styles.typeChipCount,
                    selected && styles.typeChipCountActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.typeChipCountText,
                      selected && styles.typeChipCountTextActive,
                    ]}
                  >
                    {count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

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
                  style={[
                    styles.filterChipText,
                    selected && styles.filterChipTextActive,
                  ]}
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
  typeFiltersRow: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
    paddingRight: spacing.md,
  },
  typeChip: {
    minHeight: 34,
    paddingHorizontal: spacing.xs,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(255,255,255,0.04)",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  typeChipIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  typeChipActive: {
    borderColor: colors.primary,
    backgroundColor: "rgba(0,206,209,0.2)",
  },
  typeChipCount: {
    minWidth: 20,
    paddingHorizontal: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(10,11,13,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  typeChipCountActive: {
    borderColor: "rgba(0,206,209,0.45)",
    backgroundColor: "rgba(0,206,209,0.16)",
  },
  typeChipCountText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 10,
  },
  typeChipCountTextActive: {
    color: colors.primary,
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
