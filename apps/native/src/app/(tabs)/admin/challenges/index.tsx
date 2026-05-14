import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  StatusBar,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useInfiniteQuery, useQueries, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@mirai-app/orpc/client";
import { borderRadius, colors, spacing, typography } from "~/styles";
import { useLocalSearchParams, useRouter } from "expo-router";
import { AdminAddFab } from "~/components/admin/common/AdminAddFab";
import { FilterChip, FilterChipRow } from "~/components/common/ui";
import { AdminChallengeListCard } from "~/components/admin/challenges/AdminChallengeListCard";

interface ChallengeItem {
  id: string;
  title: string;
  basePoints: number;
  status: string;
  endTime: Date | string | null;
  tripId: string;
  submissionType:
    | "IMAGE"
    | "MULTI_IMAGE"
    | "VIDEO"
    | "TEXT"
    | "IMAGE_LOCATION"
    | "LOCATION"
    | "QR_CODE";
  scoringCategory: "SPEED" | "UNLIMITED" | "JUDGED_STAFF" | "PEER_VOTING";
  participantGroupsCount: number;
  pendingSubmissionsCount: number;
  autoApprove: boolean;
}

const statusFilters = [
  { label: "All", value: "ALL" },
  { label: "Locked", value: "HIDDEN" },
  { label: "Visible", value: "VISIBLE" },
  { label: "Active", value: "ACTIVE" },
  { label: "Voting", value: "VOTING_PHASE" },
  { label: "Completed", value: "COMPLETED" },
] as const;

type StatusFilter = (typeof statusFilters)[number]["value"];

const typeFilters = [
  { value: "ALL", icon: "grid-outline" },
  { value: "IMAGE", icon: "image-outline" },
  { value: "VIDEO", icon: "videocam-outline" },
  { value: "TEXT", icon: "document-text-outline" },
  {
    value: "IMAGE_LOCATION",
    icon: "camera-outline",
    secondaryIcon: "location-outline",
  },
  { value: "LOCATION", icon: "location-outline" },
  { value: "QR_CODE", icon: "qr-code-outline" },
] as const;

type TypeFilter = (typeof typeFilters)[number]["value"];
type ChallengeTypeFilter = Exclude<TypeFilter, "ALL">;

const statusColors: Record<string, string> = {
  HIDDEN: colors.statusHidden,
  VISIBLE: colors.statusVisible,
  ACTIVE: colors.statusActive,
  VOTING_PHASE: colors.statusVotingPhase,
  COMPLETED: colors.statusCompleted,
};

const PAGE_SIZE = 30;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  scrollContent: {
    paddingTop: spacing.xl,
    paddingBottom: 96,
  },
  statusFiltersRow: {
    marginBottom: spacing.md,
  },
  headerContainer: {
    marginBottom: spacing.md,
  },
  headerTitle: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.white,
    letterSpacing: -0.5,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  typeFiltersScroll: {},
  typeFilterChip: {
    minHeight: 34,
    paddingHorizontal: 8,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  typeFilterCount: {
    minWidth: 20,
    paddingHorizontal: 5,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  typeFilterCountText: {
    fontWeight: "700",
    fontSize: 10,
  },
  searchInput: {
    backgroundColor: colors.cardDark,
    borderWidth: 1,
    borderColor: colors.borderDark,
    color: colors.white,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  searchContainer: {
    marginBottom: spacing.md,
  },
  challengesList: {
    gap: 12,
  },
  emptyState: {
    padding: 24,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderDark,
    backgroundColor: colors.cardDark,
    alignItems: "center",
  },
  emptyStateText: {
    color: colors.gray400,
  },
  loadingMoreContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  loadingMoreText: {
    color: colors.gray400,
    fontSize: 12,
  },
});

export default function AdminChallengesScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams();
  const tripId = typeof params.tripId === "string" ? params.tripId : (params.tripId?.[0] ?? "");

  const [selectedStatusFilter, setSelectedStatusFilter] = useState<StatusFilter>("ALL");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<TypeFilter>("ALL");
  const [nameFilter, setNameFilter] = useState("");

  const { data, isLoading, isRefetching, isFetchingNextPage, hasNextPage, fetchNextPage, refetch } =
    useInfiniteQuery(
      orpc.challenge.getAllByTrip.infiniteOptions({
        input: (pageParam: number) => {
          const offset = pageParam || 0;
          return {
            tripId,
            pagination: {
              limit: PAGE_SIZE,
              offset,
            },
          };
        },
        enabled: !!tripId,
        initialPageParam: 0,
        getNextPageParam: (lastPage) => {
          if (!lastPage.pagination.hasMore) {
            return undefined;
          }

          return lastPage.pagination.offset + lastPage.pagination.limit;
        },
      }),
    );

  const challengesData = useMemo(
    () => (data?.pages ?? []).flatMap((page) => page.challenges ?? []),
    [data?.pages],
  );

  const handleRefresh = useCallback(() => {
    if (!tripId) return;
    void refetch();
  }, [refetch, tripId]);

  const handleLoadMore = useCallback(
    (event: {
      nativeEvent: {
        contentOffset: { y: number };
        contentSize: { height: number };
        layoutMeasurement: { height: number };
      };
    }) => {
      if (!hasNextPage || isFetchingNextPage || isLoading) return;

      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
      const nearBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 320;

      if (nearBottom) {
        void fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage, isLoading],
  );

  const deleteChallengeMutation = useMutation(
    orpc.challenge.delete.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: orpc.challenge.getAllByTrip.queryOptions({ input: { tripId } }).queryKey,
        });
      },
      onError: (error) => {
        Alert.alert("Error", `Failed to delete challenge: ${error.message}`);
      },
    }),
  );

  const challenges: ChallengeItem[] = useMemo(() => {
    if (!challengesData) return [];

    return challengesData.map((challenge) => ({
      id: challenge.id,
      title: challenge.name,
      basePoints: challenge.basePoints ?? 0,
      status: challenge.status ?? "HIDDEN",
      endTime: challenge.endTime ?? null,
      tripId: challenge.tripId,
      submissionType: challenge.submissionType ?? "IMAGE",
      scoringCategory: challenge.scoringCategory ?? "JUDGED_STAFF",
      participantGroupsCount: challenge.participantGroupsCount ?? 0,
      pendingSubmissionsCount: challenge.pendingSubmissionsCount ?? 0,
      autoApprove: Boolean(challenge.autoApprove),
    }));
  }, [challengesData]);

  const handleAddChallenge = () => {
    if (!tripId) {
      Alert.alert("Error", "No trip found to attach this challenge");
      return;
    }
    router.push({
      pathname: "/admin/challenges/new",
      params: { tripId },
    });
  };

  const handleDeleteChallenge = (id: string) => {
    Alert.alert("Delete Challenge", "Are you sure you want to delete this challenge?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteChallengeMutation.mutate({ id, tripId });
        },
      },
    ]);
  };

  const totalChallenges = challenges.length;
  const typeCounts = useMemo(() => {
    const counts: Record<ChallengeTypeFilter, number> = {
      IMAGE: 0,
      VIDEO: 0,
      TEXT: 0,
      IMAGE_LOCATION: 0,
      LOCATION: 0,
      QR_CODE: 0,
    };

    for (const challenge of challenges) {
      if (challenge.submissionType === "MULTI_IMAGE") {
        counts.IMAGE += 1;
        continue;
      }
      if (challenge.submissionType in counts) {
        counts[challenge.submissionType] += 1;
      }
    }

    return counts;
  }, [challenges]);

  const statusCounts = useMemo(
    () => ({
      HIDDEN: challenges.filter((challenge) => challenge.status === "HIDDEN").length,
      VISIBLE: challenges.filter((challenge) => challenge.status === "VISIBLE").length,
      ACTIVE: challenges.filter((challenge) => challenge.status === "ACTIVE").length,
      VOTING_PHASE: challenges.filter((challenge) => challenge.status === "VOTING_PHASE").length,
      COMPLETED: challenges.filter((challenge) => challenge.status === "COMPLETED").length,
    }),
    [challenges],
  );

  const filteredChallenges = useMemo(() => {
    const normalizedQuery = nameFilter.trim().toLowerCase();
    let list = challenges;

    if (selectedStatusFilter === "ALL") {
      const allowedStatuses = new Set([
        "HIDDEN",
        "VISIBLE",
        "ACTIVE",
        "VOTING_PHASE",
        "COMPLETED",
        "CANCELLED",
      ]);
      list = list.filter((challenge) => allowedStatuses.has(challenge.status));
    } else {
      list = list.filter((challenge) => challenge.status === selectedStatusFilter);
    }

    if (selectedTypeFilter !== "ALL") {
      if (selectedTypeFilter === "IMAGE") {
        list = list.filter(
          (challenge) =>
            challenge.submissionType === "IMAGE" || challenge.submissionType === "MULTI_IMAGE",
        );
      } else {
        list = list.filter((challenge) => challenge.submissionType === selectedTypeFilter);
      }
    }

    if (normalizedQuery.length > 0) {
      list = list.filter((challenge) => challenge.title.toLowerCase().includes(normalizedQuery));
    }

    const statusPriority: Record<string, number> = {
      ACTIVE: 0,
      VISIBLE: 1,
      VOTING_PHASE: 2,
      HIDDEN: 3,
      COMPLETED: 4,
      CANCELLED: 5,
    };

    return [...list].sort((a, b) => {
      const pendingDiff = b.pendingSubmissionsCount - a.pendingSubmissionsCount;
      if (pendingDiff !== 0) return pendingDiff;

      const statusDiff = (statusPriority[a.status] ?? 99) - (statusPriority[b.status] ?? 99);
      if (statusDiff !== 0) return statusDiff;

      return a.title.localeCompare(b.title);
    });
  }, [challenges, selectedStatusFilter, selectedTypeFilter, nameFilter]);

  const judgedStaffChallengesForProgress = useMemo(
    () => filteredChallenges.filter((challenge) => challenge.scoringCategory === "JUDGED_STAFF"),
    [filteredChallenges],
  );

  const judgedStaffProgressQueries = useQueries({
    queries: judgedStaffChallengesForProgress.map((challenge) => ({
      ...orpc.challengeVote.getJudgedStaffProgress.queryOptions({
        input: {
          challengeId: challenge.id,
          tripId,
        },
      }),
      enabled: Boolean(tripId),
      refetchInterval: 15_000,
    })),
  });

  const judgedStaffProgressByChallengeId = useMemo(() => {
    const map = new Map<
      string,
      {
        votedAdmins: number;
        totalAdmins: number;
        pendingAdmins: number;
      }
    >();

    judgedStaffChallengesForProgress.forEach((challenge, index) => {
      const data = judgedStaffProgressQueries[index]?.data;
      if (!data) return;

      map.set(challenge.id, {
        votedAdmins: data.votedAdmins,
        totalAdmins: data.totalAdmins,
        pendingAdmins: data.pendingAdmins,
      });
    });

    return map;
  }, [judgedStaffChallengesForProgress, judgedStaffProgressQueries]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.backgroundDark} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleLoadMore}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching && !isFetchingNextPage}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Existing Challenges</Text>
          <Text style={[styles.headerSubtitle, { color: colors.gray400 }]}>
            {filteredChallenges.length}/{totalChallenges}
          </Text>
        </View>

        <FilterChipRow style={styles.statusFiltersRow}>
          {statusFilters.map((filter) => {
            const isAll = filter.value === "ALL";
            const color = isAll ? colors.primary : (statusColors[filter.value] ?? colors.gray400);
            const count = isAll ? totalChallenges : (statusCounts[filter.value] ?? 0);
            const selected = selectedStatusFilter === filter.value;

            return (
              <FilterChip
                key={filter.value}
                label={filter.label}
                selected={selected}
                onPress={() => setSelectedStatusFilter(filter.value)}
                count={count}
                countPillStyle={{
                  borderColor: color,
                  backgroundColor: selected ? `${color}26` : `${color}1A`,
                }}
                countTextStyle={{
                  color: selected ? color : colors.white,
                }}
                accessibilityLabel={`Filter challenges by ${filter.label}`}
              />
            );
          })}
        </FilterChipRow>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, marginBottom: 8, paddingRight: 16 }}
        >
          {typeFilters.map((filter) => {
            const selected = selectedTypeFilter === filter.value;
            const count = filter.value === "ALL" ? totalChallenges : typeCounts[filter.value];

            return (
              <TouchableOpacity
                key={filter.value}
                onPress={() => setSelectedTypeFilter(filter.value)}
                style={[
                  styles.typeFilterChip,
                  {
                    borderColor: selected ? colors.primary : colors.whiteOpacity15,
                    backgroundColor: selected ? colors.primaryOpacity20 : colors.whiteOpacity4,
                  },
                ]}
              >
                <Ionicons
                  name={filter.icon}
                  size={14}
                  color={selected ? colors.primary : colors.gray400}
                />
                {"secondaryIcon" in filter && filter.secondaryIcon ? (
                  <Ionicons
                    name={filter.secondaryIcon}
                    size={14}
                    color={selected ? colors.primary : colors.gray400}
                  />
                ) : null}
                <View
                  style={[
                    styles.typeFilterCount,
                    {
                      borderColor: selected ? colors.primaryOpacity30 : colors.whiteOpacity20,
                      backgroundColor: selected
                        ? colors.primaryOpacity20
                        : colors.backgroundDarkOpacity55,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.typeFilterCountText,
                      { color: selected ? colors.primary : colors.white },
                    ]}
                  >
                    {count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.searchContainer}>
          <TextInput
            value={nameFilter}
            onChangeText={setNameFilter}
            placeholder="Filter by challenge name..."
            placeholderTextColor={colors.gray500}
            style={styles.searchInput}
          />
        </View>

        <View style={styles.challengesList}>
          {filteredChallenges.map((challenge) => {
            const judgedStaffProgress =
              challenge.scoringCategory === "JUDGED_STAFF"
                ? judgedStaffProgressByChallengeId.get(challenge.id)
                : undefined;

            return (
              <AdminChallengeListCard
                key={challenge.id}
                challenge={challenge}
                judgedStaffProgress={judgedStaffProgress}
                onDelete={handleDeleteChallenge}
                tripId={tripId}
              />
            );
          })}

          {filteredChallenges.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No challenges found yet.</Text>
            </View>
          ) : null}

          {isFetchingNextPage ? (
            <View style={styles.loadingMoreContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.loadingMoreText}>Loading more challenges...</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <AdminAddFab onPress={handleAddChallenge} accessibilityLabel="Add challenge" />
    </View>
  );
}
