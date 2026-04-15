import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { View, Text } from "@mirai-app/ui";
import { ChallengesGrid } from "~/components/trips/challenges/ChallengesGrid";
import { ChallengesLoadingState } from "~/components/trips/challenges/ChallengesLoadingState";
import { GroupInfoCard } from "~/components/trips/challenges/GroupInfoCard";
import { TripNotFoundState } from "~/components/trips/challenges/TripNotFoundState";
import { useChallenges } from "~/hooks/challenges";
import type {
  ChallengeListItem,
  ChallengeSubmissionType,
} from "~/components/trips/challenges/types";

const statusColors: Record<string, string> = {
  HIDDEN: "$statusHidden",
  VISIBLE: "$statusVisible",
  ACTIVE: "$statusActive",
  VOTING_PHASE: "$statusVotingPhase",
  COMPLETED: "$statusCompleted",
  to_solve: "$statusActive",
  solved: "$statusCompleted",
};

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
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
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

  const handleLoadMore = useCallback(
    (event: {
      nativeEvent: {
        contentOffset: { y: number };
        contentSize: { height: number };
        layoutMeasurement: { height: number };
      };
    }) => {
      if (!hasNextPage || isFetchingNextPage || isLoading) return;

      const { contentOffset, contentSize, layoutMeasurement } =
        event.nativeEvent;
      const nearBottom =
        contentOffset.y + layoutMeasurement.height >= contentSize.height - 320;

      if (nearBottom) {
        void fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage, isLoading],
  );

  if (!tripId || isLoading) {
    return <ChallengesLoadingState />;
  }

  if (!trip) {
    return <TripNotFoundState />;
  }

  return (
    <View flex={1} backgroundColor="$backgroundDark">
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: 16,
          paddingTop: 16,
          paddingBottom: 64,
        }}
        showsVerticalScrollIndicator={false}
        onScroll={handleLoadMore}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="white"
            colors={["white"]}
            progressBackgroundColor="rgba(28, 28, 30, 0.7)"
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
          contentContainerStyle={{
            gap: 8,
            marginBottom: 8,
            paddingRight: 12,
          }}
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
                style={{
                  minHeight: 34,
                  paddingHorizontal: 4,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: selected ? "#2e9d8e" : "rgba(255,255,255,0.12)",
                  backgroundColor: selected
                    ? "rgba(46,157,142,0.2)"
                    : "rgba(255,255,255,0.04)",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
                >
                  <Ionicons
                    name={filter.icon as keyof typeof Ionicons.glyphMap}
                    size={14}
                    color={selected ? "#2e9d8e" : "rgba(255,255,255,0.55)"}
                  />
                  {"secondaryIcon" in filter && filter.secondaryIcon ? (
                    <Ionicons
                      name={
                        filter.secondaryIcon as keyof typeof Ionicons.glyphMap
                      }
                      size={14}
                      color={selected ? "#2e9d8e" : "rgba(255,255,255,0.55)"}
                    />
                  ) : null}
                </View>
                <View
                  style={{
                    minWidth: 20,
                    paddingHorizontal: 5,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: selected
                      ? "rgba(46,157,142,0.3)"
                      : "rgba(255,255,255,0.08)",
                    backgroundColor: selected
                      ? "rgba(46,157,142,0.2)"
                      : "rgba(28,28,30,0.55)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    color={selected ? "$primary" : "$white"}
                    fontWeight="700"
                    fontSize={10}
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
          contentContainerStyle={{
            gap: 8,
            marginBottom: 16,
            paddingRight: 12,
          }}
        >
          {statusFilters.map((filter) => {
            const isAll = filter.value === "ALL";
            const selected = selectedStatusFilter === filter.value;

            return (
              <TouchableOpacity
                key={filter.value}
                onPress={() => setSelectedStatusFilter(filter.value)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: selected ? "#2e9d8e" : "rgba(255,255,255,0.12)",
                  backgroundColor: selected
                    ? "rgba(46,157,142,0.2)"
                    : "rgba(255,255,255,0.04)",
                }}
              >
                <Text
                  color={selected ? "$primary" : "$textMuted"}
                  fontWeight="700"
                  fontSize={12}
                  textTransform="uppercase"
                  letterSpacing={0.8}
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

        {isFetchingNextPage ? (
          <View
            flexDirection="row"
            alignItems="center"
            justifyContent="center"
            gap="$sm"
            marginBottom="$xl"
          >
            <ActivityIndicator size="small" color="#2e9d8e" />
            <Text color="$textMuted" fontSize={12}>
              Loading more challenges...
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
