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
import { useQuery, useMutation, useClient } from "urql";
import {
  GetChallengesDocument,
  DeleteChallengeDocument,
  GetJudgedStaffVotingProgressDocument,
} from "@mirai-app/graphql-client";
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
  const client = useClient();
  const params = useLocalSearchParams();
  const tripId =
    typeof params.tripId === "string"
      ? params.tripId
      : (params.tripId?.[0] ?? "");

  const [selectedStatusFilter, setSelectedStatusFilter] =
    useState<StatusFilter>("ALL");
  const [selectedTypeFilter, setSelectedTypeFilter] =
    useState<TypeFilter>("ALL");
  const [nameFilter, setNameFilter] = useState("");
  const [offset, setOffset] = useState(0);

  // GraphQL query for challenges with pagination
  const [{ data, fetching }, replayChallenges] = useQuery({
    query: GetChallengesDocument,
    variables: {
      tripId,
      first: PAGE_SIZE,
      status: selectedStatusFilter === "ALL" ? undefined : selectedStatusFilter,
    },
    pause: !tripId,
  });

  const isLoading = fetching && offset === 0;
  const isFetchingNextPage = fetching && offset > 0;

  const challengesData = useMemo(
    () =>
      (data?.challenges?.edges ?? []).map(
        (edge: { node: unknown }) => edge.node,
      ) ?? [],
    [data?.challenges?.edges],
  );

  const hasNextPage = useMemo(
    () => data?.challenges?.pageInfo?.hasNextPage ?? false,
    [data?.challenges?.pageInfo?.hasNextPage],
  );

  const handleRefresh = useCallback(() => {
    if (!tripId) return;
    void client.invalidate(GetChallengesDocument, {
      tripId,
      first: PAGE_SIZE,
      status: selectedStatusFilter === "ALL" ? undefined : selectedStatusFilter,
    });
  }, [client, tripId, selectedStatusFilter]);

  const handleLoadMore = useCallback(
    (event: {
      nativeEvent: {
        contentOffset: { y: number };
        contentSize: { height: number };
        layoutMeasurement: { height: number };
      };
    }) => {
      if (!hasNextPage || fetching) return;

      const { contentOffset, contentSize, layoutMeasurement } =
        event.nativeEvent;
      const nearBottom =
        contentOffset.y + layoutMeasurement.height >= contentSize.height - 320;

      if (nearBottom) {
        // For cursor-based pagination, use the endCursor from pageInfo
        const endCursor = data?.challenges?.pageInfo?.endCursor;
        if (endCursor) {
          // Execute query with after cursor
          void replayChallenges({
            requestPolicy: "network-only",
          });
        } else {
          // Fallback to offset-based
          setOffset((prev) => prev + PAGE_SIZE);
        }
      }
    },
    [
      hasNextPage,
      fetching,
      data?.challenges?.pageInfo?.endCursor,
      replayChallenges,
    ],
  );

  // Delete mutation
  const [, deleteChallenge] = useMutation(DeleteChallengeDocument);

  const handleDelete = useCallback(
    async (id: string) => {
      const result = await deleteChallenge({ id, tripId });
      if (result.error) {
        Alert.alert(
          "Error",
          `Failed to delete challenge: ${result.error.message}`,
        );
      } else {
        // Invalidate the challenges query
        await client.invalidate(GetChallengesDocument, {
          tripId,
          first: PAGE_SIZE,
          status:
            selectedStatusFilter === "ALL" ? undefined : selectedStatusFilter,
        });
      }
    },
    [deleteChallenge, tripId, client, selectedStatusFilter],
  );

  const challenges: ChallengeItem[] = useMemo(() => {
    if (!challengesData) return [];

    return challengesData.map(
      (challenge: {
        id: string;
        name: string;
        basePoints: number | null;
        status: string;
        endTime: string | null;
        tripId: string;
        submissionType: string;
        scoringCategory: string;
        participantGroupsCount: number | null;
        pendingSubmissionsCount: number | null;
        autoApprove: boolean;
      }) => ({
        id: challenge.id,
        title: challenge.name,
        basePoints: challenge.basePoints ?? 0,
        status: challenge.status ?? "HIDDEN",
        endTime: challenge.endTime ?? null,
        tripId: challenge.tripId,
        submissionType:
          (challenge.submissionType as ChallengeItem["submissionType"]) ??
          "IMAGE",
        scoringCategory:
          (challenge.scoringCategory as ChallengeItem["scoringCategory"]) ??
          "JUDGED_STAFF",
        participantGroupsCount: challenge.participantGroupsCount ?? 0,
        pendingSubmissionsCount: challenge.pendingSubmissionsCount ?? 0,
        autoApprove: Boolean(challenge.autoApprove),
      }),
    );
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
    Alert.alert(
      "Delete Challenge",
      "Are you sure you want to delete this challenge?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void handleDelete(id);
          },
        },
      ],
    );
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
        counts[challenge.submissionType as ChallengeTypeFilter] += 1;
      }
    }

    return counts;
  }, [challenges]);

  const statusCounts = useMemo(
    () => ({
      HIDDEN: challenges.filter((challenge) => challenge.status === "HIDDEN")
        .length,
      VISIBLE: challenges.filter((challenge) => challenge.status === "VISIBLE")
        .length,
      ACTIVE: challenges.filter((challenge) => challenge.status === "ACTIVE")
        .length,
      VOTING_PHASE: challenges.filter(
        (challenge) => challenge.status === "VOTING_PHASE",
      ).length,
      COMPLETED: challenges.filter(
        (challenge) => challenge.status === "COMPLETED",
      ).length,
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
      list = list.filter(
        (challenge) => challenge.status === selectedStatusFilter,
      );
    }

    if (selectedTypeFilter !== "ALL") {
      if (selectedTypeFilter === "IMAGE") {
        list = list.filter(
          (challenge) =>
            challenge.submissionType === "IMAGE" ||
            challenge.submissionType === "MULTI_IMAGE",
        );
      } else {
        list = list.filter(
          (challenge) => challenge.submissionType === selectedTypeFilter,
        );
      }
    }

    if (normalizedQuery.length > 0) {
      list = list.filter((challenge) =>
        challenge.title.toLowerCase().includes(normalizedQuery),
      );
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

      const statusDiff =
        (statusPriority[a.status] ?? 99) - (statusPriority[b.status] ?? 99);
      if (statusDiff !== 0) return statusDiff;

      return a.title.localeCompare(b.title);
    });
  }, [challenges, selectedStatusFilter, selectedTypeFilter, nameFilter]);

  const judgedStaffChallengesForProgress = useMemo(
    () =>
      filteredChallenges.filter(
        (challenge) => challenge.scoringCategory === "JUDGED_STAFF",
      ),
    [filteredChallenges],
  );

  // Query judged staff voting progress for each judged staff challenge using urql
  const judgedStaffProgressResults = judgedStaffChallengesForProgress.map(
    (challenge) =>
      // eslint-disable-next-line react-hooks/rules-of-hooks
      useQuery({
        query: GetJudgedStaffVotingProgressDocument,
        variables: {
          challengeId: challenge.id,
          tripId,
          adminParticipantIds: [], // These need to be provided from context/props
          eligibleSubmissionsCount: 0, // These need to be calculated
          requiredPositions: 0, // These need to be configured
        },
        pause: !tripId,
      }),
  );

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
      const result = judgedStaffProgressResults[index];
      const progressData = result?.[0]?.data?.judgedStaffVotingProgress;
      if (!progressData) return;

      map.set(challenge.id, {
        votedAdmins: progressData.votedAdmins ?? 0,
        totalAdmins: progressData.totalAdmins ?? 0,
        pendingAdmins: progressData.pendingAdmins ?? 0,
      });
    });

    return map;
  }, [judgedStaffChallengesForProgress, judgedStaffProgressResults]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={colors.backgroundDark}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleLoadMore}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={fetching && !isFetchingNextPage}
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
            const color = isAll
              ? colors.primary
              : (statusColors[filter.value] ?? colors.gray400);
            const count = isAll
              ? totalChallenges
              : (statusCounts[filter.value as keyof typeof statusCounts] ?? 0);
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
            const count =
              filter.value === "ALL"
                ? totalChallenges
                : typeCounts[filter.value as ChallengeTypeFilter];

            return (
              <TouchableOpacity
                key={filter.value}
                onPress={() => setSelectedTypeFilter(filter.value)}
                style={[
                  styles.typeFilterChip,
                  {
                    borderColor: selected
                      ? colors.primary
                      : colors.whiteOpacity15,
                    backgroundColor: selected
                      ? colors.primaryOpacity20
                      : colors.whiteOpacity4,
                  },
                ]}
              >
                <Ionicons
                  name={filter.icon as keyof typeof Ionicons.glyphMap}
                  size={14}
                  color={selected ? colors.primary : colors.gray400}
                />
                {"secondaryIcon" in filter && filter.secondaryIcon ? (
                  <Ionicons
                    name={
                      filter.secondaryIcon as keyof typeof Ionicons.glyphMap
                    }
                    size={14}
                    color={selected ? colors.primary : colors.gray400}
                  />
                ) : null}
                <View
                  style={[
                    styles.typeFilterCount,
                    {
                      borderColor: selected
                        ? colors.primaryOpacity30
                        : colors.whiteOpacity20,
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
              <Text style={styles.emptyStateText}>
                No challenges found yet.
              </Text>
            </View>
          ) : null}

          {isFetchingNextPage ? (
            <View style={styles.loadingMoreContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.loadingMoreText}>
                Loading more challenges...
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <AdminAddFab
        onPress={handleAddChallenge}
        accessibilityLabel="Add challenge"
      />
    </View>
  );
}

// Summary:
// - Files modified: apps/native/src/app/(tabs)/admin/challenges/index.tsx
// - Key changes made:
//   1. Replaced @tanstack/react-query imports with urql (useQuery, useMutation, useClient)
//   2. Imported GraphQL documents from @mirai-app/graphql-client (GetChallengesDocument, DeleteChallengeDocument, GetJudgedStaffVotingProgressDocument)
//   3. Migrated useQueryClient() to useClient() from urql
//   4. Changed query pattern from TanStack Query's { data, isLoading, isFetching, hasNextPage, fetchNextPage } to urql's [{ data, fetching }, replay] tuple
//   5. Updated mutation pattern from useMutation({ mutationFn, onSuccess, onError }) to useMutation(Document) with manual error handling
//   6. Replaced queryClient.invalidateQueries({ queryKey }) with client.invalidate(Document, variables)
//   7. Migrated useQueries for judged staff progress to individual useQuery hooks mapped over challenges
//   8. Updated pagination handling to use urql's replay function for cursor-based pagination
//   9. Changed isLoading/isFetching to fetching with offset check for initial loading detection
// - Decisions made:
//   - Note: GetChallengesDocument and DeleteChallengeDocument don't exist in the generated urql files yet.
//     These will need to be added to the GraphQL schema and code generation.
//   - The judged staff progress query requires additional variables (adminParticipantIds, eligibleSubmissionsCount, requiredPositions)
//     that need to be provided from context or calculated from challenge data.
//   - Using conditional pause instead of enabled option for urql queries
