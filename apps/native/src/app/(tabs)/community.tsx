import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "@integral-2025-app/auth/client";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@integral-2025-app/trpc/client";
import Logo from "../../components/Logo";
import LoadingScreen from "../../components/LoadingScreen";
import { useAppSafeAreaInsets } from "~/contexts/SafeAreaInsetsContext";
import { useSelectedTrip } from "~/hooks/trips";
import { LeaderboardPodium } from "~/components/trips/leaderboard/LeaderboardPodium";
import type { RankedGroup } from "~/components/trips/leaderboard/types";
import { colors, spacing, typography } from "../../styles";

type ActivityType =
  | "submission"
  | "challenge_event"
  | "rank_change"
  | "custom"
  | "user_post";

type ActivityFilter = "all" | ActivityType;

type CommunityFeedActivity = {
  id: string;
  tripId: string;
  activityType: ActivityType;
  title: string;
  description: string | null;
  imageUrl: string | null;
  createdAt: Date | string;
  reactionsSummary?: {
    total: number;
  };
  admin?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  challengeActivity?: {
    challengeId: string;
    eventType: string;
    challenge?: {
      name: string;
      description?: string | null;
    } | null;
  } | null;
  submissionActivity?: {
    groupId: string;
    isWinner: boolean;
    currentGroupRank?: number | null;
    ranking: number | null;
    pointsAwarded: number | null;
    challenge?: {
      name: string;
    } | null;
    group?: {
      id: string;
      name: string;
      image: string | null;
    } | null;
  } | null;
  rankChangeActivity?: {
    newRank: number;
    coinsGained: number;
    totalCoins: number;
    group?: {
      name: string;
      image: string | null;
    } | null;
  } | null;
  userPost?: {
    additionalImages: Array<string | null>;
    author?: {
      user?: {
        id: string;
        firstName: string;
        lastName: string;
      } | null;
      group?: {
        name: string;
      } | null;
    } | null;
  } | null;
};

type OwnerMeta = {
  name: string;
  subtitle: string;
  avatarImage: string | null;
  avatarUserId: string | null;
};

const ACTIVITY_FILTERS: Array<{ key: ActivityFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "submission", label: "Submissions" },
  { key: "challenge_event", label: "Challenge" },
  { key: "rank_change", label: "Ranking" },
  { key: "custom", label: "News" },
  { key: "user_post", label: "Posts" },
];

const getActivityTypeLabel = (type: ActivityType) => {
  if (type === "custom") return "news";
  return type;
};

const formatName = (firstName?: string, lastName?: string) => {
  const raw = `${firstName ?? ""} ${lastName ?? ""}`.trim();
  return raw.length > 0 ? raw : "Unknown";
};

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]?.slice(0, 1).toUpperCase() ?? "?";
  return `${parts[0]?.slice(0, 1) ?? ""}${parts[parts.length - 1]?.slice(0, 1) ?? ""}`.toUpperCase();
};

const formatRelativeTime = (value: Date | string) => {
  const date = value instanceof Date ? value : new Date(value);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 1) return "just now";
  if (minutes > 30) {
    const datePart = date.toLocaleDateString("pl-PL");
    const timePart = date.toLocaleTimeString("pl-PL", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${datePart} ${timePart}`;
  }
  return `${minutes}m ago`;
};

const getChallengeEventLabel = (eventType?: string | null) => {
  if (eventType === "challenge_started") return "Challenge started";
  if (eventType === "voting_started") return "Voting started";
  if (eventType === "completed") return "Challenge completed";
  return "Challenge update";
};

type RankMovement = {
  direction: "up" | "down";
  team: string;
  previousRank: number;
  newRank: number;
};

const parseRankChangeDetails = (description?: string | null) => {
  const text = description?.trim() ?? "";
  if (!text) {
    return {
      movements: [] as RankMovement[],
      podium: [] as string[],
    };
  }

  const movements: RankMovement[] = [];
  const movementRegex = /([⬆⬇])(?:️)?\s*([^:|]+):\s*#(\d+)\s*->\s*#(\d+)/g;
  let match: RegExpExecArray | null = movementRegex.exec(text);
  while (match) {
    const arrow = match[1];
    const team = match[2]?.trim() ?? "";
    const previousRank = Number(match[3]);
    const newRank = Number(match[4]);
    if (team && Number.isFinite(previousRank) && Number.isFinite(newRank)) {
      movements.push({
        direction: arrow === "⬆" ? "up" : "down",
        team,
        previousRank,
        newRank,
      });
    }
    match = movementRegex.exec(text);
  }

  const podiumChunk = text.match(/Podium:\s*([^|]+)/)?.[1] ?? "";
  const podium = podiumChunk
    .split("•")
    .map((part) => part.replace(/[🥇🥈🥉]/g, "").trim())
    .filter(Boolean);

  return { movements, podium };
};

const resolveCardImage = (activity: CommunityFeedActivity) => {
  if (activity.imageUrl) return activity.imageUrl;
  const extra = activity.userPost?.additionalImages?.find((img) => Boolean(img));
  return extra ?? null;
};

const resolveOwnerMeta = (activity: CommunityFeedActivity): OwnerMeta => {
  if (activity.activityType === "user_post") {
    const author = activity.userPost?.author;
    const user = author?.user;
    return {
      name: formatName(user?.firstName, user?.lastName),
      subtitle: author?.group?.name ?? "Community member",
      avatarImage: null,
      avatarUserId: user?.id ?? null,
    };
  }

  if (activity.activityType === "submission") {
    const group = activity.submissionActivity?.group;
    const isApprovedSubmission = activity.submissionActivity?.isWinner === false;
    const currentGroupRank = activity.submissionActivity?.currentGroupRank;

    const subtitle = isApprovedSubmission
      ? typeof currentGroupRank === "number"
        ? `Miejsce w rankingu: #${currentGroupRank}`
        : "Miejsce w rankingu: -"
      : activity.submissionActivity?.challenge?.name ?? "Challenge submission";

    return {
      name: group?.name ?? "Group",
      subtitle,
      avatarImage: group?.image ?? null,
      avatarUserId: null,
    };
  }

  if (activity.activityType === "rank_change") {
    const group = activity.rankChangeActivity?.group;
    return {
      name: group?.name ?? "Group",
      subtitle: `Now #${activity.rankChangeActivity?.newRank ?? "-"}`,
      avatarImage: group?.image ?? null,
      avatarUserId: null,
    };
  }

  if (activity.activityType === "challenge_event") {
    const adminName = activity.admin
      ? formatName(activity.admin.firstName, activity.admin.lastName)
      : "MIRAI Admin";

    return {
      name: adminName,
      subtitle: getChallengeEventLabel(activity.challengeActivity?.eventType),
      avatarImage: null,
      avatarUserId: activity.admin?.id ?? null,
    };
  }

  const adminName = activity.admin
    ? formatName(activity.admin.firstName, activity.admin.lastName)
    : "MIRAI Admin";

  return {
    name: adminName,
    subtitle: "Official post",
    avatarImage: null,
    avatarUserId: activity.admin?.id ?? null,
  };
};

function CommunityActivityCard({
  activity,
  onPress,
  onPressOwner,
  isFocused = false,
}: {
  activity: CommunityFeedActivity;
  onPress?: () => void;
  onPressOwner?: () => void;
  isFocused?: boolean;
}) {
  const trpc = useTRPC();

  const owner = useMemo(() => resolveOwnerMeta(activity), [activity]);
  const cardImage = useMemo(() => resolveCardImage(activity), [activity]);
  const rankChangeDetails = useMemo(
    () => parseRankChangeDetails(activity.description),
    [activity.description],
  );
  const anchorMovement = useMemo(() => {
    if (activity.activityType !== "rank_change") return null;
    const groupName = activity.rankChangeActivity?.group?.name;
    if (groupName) {
      const exactMatch = rankChangeDetails.movements.find(
        (movement) => movement.team === groupName,
      );
      if (exactMatch) return exactMatch;
    }
    return rankChangeDetails.movements[0] ?? null;
  }, [activity, rankChangeDetails.movements]);
  const { data: rankingData } = useQuery({
    ...trpc.group.ranking.queryOptions({
      tripId: activity.tripId,
    }),
    enabled: activity.activityType === "rank_change" && Boolean(activity.tripId),
    staleTime: 2 * 60 * 1000,
  });
  const rankChangeTopThree = useMemo(() => {
    if (activity.activityType !== "rank_change") return [] as RankedGroup[];

    const rankedGroups = rankingData?.data;
    if (rankedGroups && rankedGroups.length > 0) {
      return rankedGroups.slice(0, 3).map((group, index) => {
        return {
          id: group.id,
          name: group.name,
          image: group.image ?? null,
          coins: group.coins,
          memberCount: group.participants.length,
          rank: index + 1,
          isCurrentUserGroup: false,
        } satisfies RankedGroup;
      });
    }

    const anchorGroupName = activity.rankChangeActivity?.group?.name ?? "Team";
    const anchorRank = activity.rankChangeActivity?.newRank;

    return [1, 2, 3].map((rank) => {
      const parsedName = rankChangeDetails.podium[rank - 1];
      const name =
        parsedName ??
        (anchorRank === rank ? anchorGroupName : `Rank #${rank}`);

      const isAnchor = name === anchorGroupName || anchorRank === rank;

      return {
        id: `rank-change-${activity.id}-${rank}`,
        name,
        image: isAnchor ? activity.rankChangeActivity?.group?.image ?? null : null,
        coins: isAnchor ? activity.rankChangeActivity?.totalCoins ?? 0 : 0,
        memberCount: 0,
        rank,
        isCurrentUserGroup: false,
      } satisfies RankedGroup;
    });
  }, [activity, rankChangeDetails.podium, rankingData?.data]);

  const avatarStoragePath =
    !owner.avatarImage && owner.avatarUserId
      ? `avatar/${owner.avatarUserId}.jpg`
      : null;

  const { data: avatarData } = useQuery({
    ...trpc.storage.createDownloadUrl.queryOptions({
      storagePath: avatarStoragePath ?? "",
      expiresInSeconds: 60 * 60,
    }),
    enabled: Boolean(avatarStoragePath),
    staleTime: 15 * 60 * 1000,
    retry: false,
  });

  const avatarUri = owner.avatarImage ?? avatarData?.signedUrl ?? null;
  const resolvedDescription =
    activity.activityType === "challenge_event"
      ? activity.challengeActivity?.challenge?.description?.trim() ||
        activity.description
      : activity.description;

  return (
    <TouchableOpacity
      style={[styles.card, isFocused && styles.cardFocused]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.9 : 1}
    >
      <View style={styles.cardHeader}>
        <TouchableOpacity
          style={styles.ownerRow}
          onPress={onPressOwner}
          disabled={!onPressOwner}
          activeOpacity={onPressOwner ? 0.75 : 1}
        >
          <View style={styles.avatarFrame}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} contentFit="cover" />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarFallbackText}>{getInitials(owner.name)}</Text>
              </View>
            )}
          </View>

          <View style={styles.ownerMeta}>
            <Text style={styles.ownerName} numberOfLines={1}>
              {owner.name}
            </Text>
            <Text style={styles.ownerSubtitle} numberOfLines={1}>
              {owner.subtitle}
            </Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.cardTime}>{formatRelativeTime(activity.createdAt)}</Text>
      </View>

      {activity.activityType === "rank_change" ? (
        <View style={styles.mediaWrap}>
          <View style={styles.rankChangeWrap}>
            <View style={styles.rankChangeTopRow}>
              <View style={styles.rankChangeDirectionWrap}>
                <Ionicons
                  name={
                    (anchorMovement?.direction ?? "up") === "up"
                      ? "arrow-up"
                      : "arrow-down"
                  }
                  size={16}
                  color={
                    (anchorMovement?.direction ?? "up") === "up"
                      ? colors.green400
                      : colors.orange400
                  }
                />
                <Text style={styles.rankChangeDirectionText}>
                  {anchorMovement
                    ? `#${anchorMovement.previousRank} -> #${anchorMovement.newRank}`
                    : `Now #${activity.rankChangeActivity?.newRank ?? "-"}`}
                </Text>
              </View>

              <View style={styles.rankChangeCoinsWrap}>
                <Ionicons name="trophy-outline" size={14} color={colors.yellow400} />
                <Text style={styles.rankChangeCoinsText}>
                  {activity.rankChangeActivity?.totalCoins ?? 0}
                </Text>
              </View>
            </View>

            <View style={styles.rankDeltaWrap}>
              <Text
                style={[
                  styles.rankDeltaText,
                  (activity.rankChangeActivity?.coinsGained ?? 0) >= 0
                    ? styles.rankDeltaTextUp
                    : styles.rankDeltaTextDown,
                ]}
              >
                {(activity.rankChangeActivity?.coinsGained ?? 0) >= 0 ? "+" : ""}
                {activity.rankChangeActivity?.coinsGained ?? 0} coins
              </Text>
            </View>

            <View style={styles.rankLeaderboardWrap}>
              <View style={styles.rankLeaderboardScale}>
                <LeaderboardPodium
                  topThree={rankChangeTopThree}
                  onPressGroup={() => onPress?.()}
                />
              </View>
            </View>
          </View>
        </View>
      ) : cardImage ? (
        <View style={styles.mediaWrap}>
          <Image source={{ uri: cardImage }} style={styles.mediaImage} contentFit="cover" />
        </View>
      ) : null}

      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{activity.title}</Text>
        {resolvedDescription ? (
          <Text style={styles.cardDescription}>{resolvedDescription}</Text>
        ) : null}

        <View style={styles.cardFooter}>
          <View style={styles.activityTypePill}>
            <Text style={styles.activityTypePillText}>
              {getActivityTypeLabel(activity.activityType)}
            </Text>
          </View>

          <View style={styles.reactionRow}>
            <Ionicons name="heart-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.reactionCount}>{activity.reactionsSummary?.total ?? 0}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function CommunityScreen() {
  const { session, isLoading: isLoadingSession } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{
    filter?: string | string[];
    focusActivityId?: string | string[];
  }>();
  const trpc = useTRPC();
  const insets = useAppSafeAreaInsets();
  const { selectedTripId, isLoadingSelectedTrip, setSelectedTripId } = useSelectedTrip();

  const [isTripPickerManuallyOpen, setIsTripPickerManuallyOpen] = useState(false);
  const [hasDismissedAutoPicker, setHasDismissedAutoPicker] = useState(false);

  useEffect(() => {
    if (!isLoadingSession && !session) {
      router.replace("/auth/login");
    }
  }, [isLoadingSession, session, router]);

  const tripsQuery = useQuery(trpc.trip.getAll.queryOptions());
  const trips = useMemo(() => tripsQuery.data ?? [], [tripsQuery.data]);

  const selectedTrip = useMemo(() => {
    if (!selectedTripId) return null;
    return trips.find((trip) => trip.id === selectedTripId) ?? null;
  }, [selectedTripId, trips]);

  const shouldAutoOpenTripPicker =
    trips.length > 0 &&
    (!selectedTripId || !selectedTrip) &&
    !hasDismissedAutoPicker;
  const isTripPickerOpen = isTripPickerManuallyOpen || shouldAutoOpenTripPicker;

  const selectedFilter = useMemo<ActivityFilter>(() => {
    const rawFilter =
      typeof params.filter === "string" ? params.filter : params.filter?.[0];

    if (!rawFilter) return "all";
    if (rawFilter === "news") return "custom";
    if (rawFilter === "all") return "all";
    if (rawFilter === "submission") return "submission";
    if (rawFilter === "challenge_event") return "challenge_event";
    if (rawFilter === "rank_change") return "rank_change";
    if (rawFilter === "custom") return "custom";
    if (rawFilter === "user_post") return "user_post";
    return "all";
  }, [params.filter]);

  const focusActivityId = useMemo(() => {
    return typeof params.focusActivityId === "string"
      ? params.focusActivityId
      : params.focusActivityId?.[0];
  }, [params.focusActivityId]);

  const handleSelectFilter = useCallback(
    (filter: ActivityFilter) => {
      const paramValue = filter === "custom" ? "news" : filter;
      router.setParams({ filter: paramValue, focusActivityId: undefined });
    },
    [router],
  );

  const feedQuery = useQuery({
    ...trpc.activityFeed.getByTrip.queryOptions({
      tripId: selectedTrip?.id ?? "",
      page: 1,
      pageSize: 100,
    }),
    enabled: Boolean(selectedTrip?.id),
  });

  const activities = useMemo(
    () => (feedQuery.data?.activities ?? []) as CommunityFeedActivity[],
    [feedQuery.data?.activities],
  );

  const filteredActivities = useMemo(() => {
    const base =
      selectedFilter === "all"
        ? activities
        : activities.filter((activity) => activity.activityType === selectedFilter);

    if (!focusActivityId) return base;

    const focused = base.find((activity) => activity.id === focusActivityId);
    if (!focused) return base;

    const rest = base.filter((activity) => activity.id !== focusActivityId);
    return [focused, ...rest];
  }, [activities, focusActivityId, selectedFilter]);

  const isRefreshing = tripsQuery.isRefetching || feedQuery.isRefetching;

  const handleRefresh = useCallback(() => {
    const requests: Promise<unknown>[] = [tripsQuery.refetch()];
    if (selectedTrip?.id) {
      requests.push(feedQuery.refetch());
    }
    void Promise.all(requests);
  }, [feedQuery, selectedTrip?.id, tripsQuery]);

  const handleOpenTripPicker = useCallback(() => {
    setHasDismissedAutoPicker(false);
    setIsTripPickerManuallyOpen(true);
  }, []);

  const handleSelectTrip = useCallback(
    (tripId: string) => {
      setSelectedTripId(tripId);
      setHasDismissedAutoPicker(false);
      setIsTripPickerManuallyOpen(false);
    },
    [setSelectedTripId],
  );

  const handleCloseTripPicker = useCallback(() => {
    setIsTripPickerManuallyOpen(false);
    setHasDismissedAutoPicker(true);
  }, []);

  if (isLoadingSession || tripsQuery.isLoading || isLoadingSelectedTrip) {
    return <LoadingScreen message="Loading community..." />;
  }

  if (!session) {
    return null;
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <LinearGradient
        colors={["#17181c", "#102222"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <FlatList
        data={filteredActivities}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const challengeId =
            item.activityType === "challenge_event"
              ? item.challengeActivity?.challengeId
              : null;
          const leaderboardTripId =
            item.activityType === "rank_change" ? item.tripId : null;
          const submissionGroupId =
            item.activityType === "submission"
              ? item.submissionActivity?.groupId ?? item.submissionActivity?.group?.id
              : null;

          return (
            <CommunityActivityCard
              activity={item}
              isFocused={item.id === focusActivityId}
              onPress={
                challengeId
                  ? () =>
                      router.push(
                        `/trips/challenges/${challengeId}?tripId=${item.tripId}`,
                      )
                  : leaderboardTripId
                    ? () => router.push(`/trips/leaderboard?tripId=${leaderboardTripId}`)
                  : undefined
              }
              onPressOwner={
                submissionGroupId
                  ? () => router.push(`/trips/groups/${submissionGroupId}`)
                  : undefined
              }
            />
          );
        }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + 120 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <View style={styles.headerWrap}>
            <View style={styles.headerTopRow}>
              <View style={styles.brandRow}>
                <View style={styles.logoWrap}>
                  <Logo size={40} />
                </View>
                <View style={styles.brandTextWrap}>
                  <Text style={styles.brandTitle}>MIRAI</Text>
                  <Text style={styles.brandSubtitle}>Feed</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.changeTripButton}
                onPress={handleOpenTripPicker}
                activeOpacity={0.85}
              >
                <Ionicons name="swap-horizontal" size={14} color={colors.primary} />
                <Text style={styles.changeTripButtonText}>
                  {selectedTrip ? "Change trip" : "Select trip"}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.tripLabel} numberOfLines={1}>
              {selectedTrip?.name ?? "Trip not selected"}
            </Text>

            {selectedTrip ? (
              <View style={styles.filterRow}>
                {ACTIVITY_FILTERS.map((filter) => {
                  const isActive = selectedFilter === filter.key;
                  return (
                    <TouchableOpacity
                    key={filter.key}
                    style={[styles.filterChip, isActive && styles.filterChipActive]}
                    onPress={() => handleSelectFilter(filter.key)}
                    activeOpacity={0.85}
                  >
                      <Text
                        style={[styles.filterChipText, isActive && styles.filterChipTextActive]}
                      >
                        {filter.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : null}

            {selectedTrip && feedQuery.isLoading ? (
              <View style={styles.loadingState}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.loadingStateText}>Loading feed...</Text>
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          !selectedTrip ? (
            <View style={styles.emptyState}>
              <Ionicons name="navigate-outline" size={36} color={colors.textSecondary} />
              <Text style={styles.emptyStateTitle}>Select trip first</Text>
              <Text style={styles.emptyStateText}>
                Pick your trip to load the community feed.
              </Text>
            </View>
          ) : !feedQuery.isLoading ? (
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={36} color={colors.textSecondary} />
              <Text style={styles.emptyStateTitle}>No activities yet</Text>
              <Text style={styles.emptyStateText}>
                Pull to refresh to load new community posts.
              </Text>
            </View>
          ) : null
        }
      />

      <Modal
        visible={isTripPickerOpen}
        animationType="fade"
        transparent
        onRequestClose={handleCloseTripPicker}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select trip</Text>
              <TouchableOpacity onPress={handleCloseTripPicker}>
                <Ionicons name="close" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalList}>
              {trips.map((trip) => (
                <TouchableOpacity
                  key={trip.id}
                  style={styles.modalItem}
                  onPress={() => handleSelectTrip(trip.id)}
                >
                  <Text style={styles.modalItemText}>{trip.name}</Text>
                  {selectedTrip?.id === trip.id ? (
                    <Ionicons name="checkmark" size={18} color={colors.primary} />
                  ) : null}
                </TouchableOpacity>
              ))}

              {trips.length === 0 ? (
                <Text style={styles.modalEmpty}>No trips available</Text>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  headerWrap: {
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flexShrink: 1,
  },
  logoWrap: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  brandTextWrap: {
    gap: 0,
  },
  brandTitle: {
    color: colors.white,
    fontSize: typography.xxl,
    fontWeight: typography.bold,
    letterSpacing: 0.3,
  },
  brandSubtitle: {
    color: colors.primary,
    fontSize: typography.base,
    fontWeight: typography.semibold,
    marginTop: -2,
  },
  changeTripButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.primaryOpacity30,
    backgroundColor: colors.primaryOpacity10,
  },
  changeTripButtonText: {
    color: colors.primary,
    fontSize: typography.xs,
    fontWeight: typography.semibold,
  },
  tripLabel: {
    color: colors.textSecondary,
    fontSize: typography.sm,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.borderWhite10,
    backgroundColor: colors.backgroundDarkOpacity50,
  },
  filterChipActive: {
    backgroundColor: colors.primaryOpacity20,
    borderColor: colors.primary,
  },
  filterChipText: {
    color: colors.textSecondary,
    fontSize: typography.sm,
    fontWeight: typography.medium,
  },
  filterChipTextActive: {
    color: colors.primary,
    fontWeight: typography.semibold,
  },
  loadingState: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  loadingStateText: {
    color: colors.textSecondary,
    fontSize: typography.sm,
  },
  card: {
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.borderWhite10,
    backgroundColor: "rgba(16, 34, 34, 0.78)",
  },
  cardFocused: {
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: "rgba(12, 20, 24, 0.6)",
  },
  ownerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
    marginRight: spacing.sm,
  },
  avatarFrame: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.primaryOpacity30,
    backgroundColor: "#0f2627",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryOpacity20,
  },
  avatarFallbackText: {
    color: colors.white,
    fontSize: typography.base,
    fontWeight: typography.bold,
  },
  ownerMeta: {
    flex: 1,
  },
  ownerName: {
    color: colors.white,
    fontSize: typography.base,
    fontWeight: typography.semibold,
  },
  ownerSubtitle: {
    color: colors.textSecondary,
    fontSize: typography.xs,
    marginTop: 1,
  },
  cardTime: {
    color: colors.textMuted,
    fontSize: typography.xs,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  mediaWrap: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#0f171a",
  },
  mediaImage: {
    width: "100%",
    height: "100%",
  },
  mediaPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  mediaPlaceholderText: {
    color: colors.textSecondary,
    fontSize: typography.sm,
  },
  rankChangeWrap: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: "rgba(9, 21, 24, 0.95)",
  },
  rankChangeTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  rankChangeDirectionWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.backgroundDarkOpacity50,
    borderWidth: 1,
    borderColor: colors.borderWhite10,
    flexShrink: 1,
  },
  rankChangeDirectionText: {
    color: colors.textPrimary,
    fontSize: typography.xs,
    fontWeight: typography.semibold,
  },
  rankChangeCoinsWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(250, 204, 21, 0.3)",
    backgroundColor: "rgba(250, 204, 21, 0.08)",
  },
  rankChangeCoinsText: {
    color: colors.yellow400,
    fontSize: typography.xs,
    fontWeight: typography.semibold,
  },
  rankDeltaWrap: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.borderWhite10,
    backgroundColor: colors.backgroundDarkOpacity50,
  },
  rankDeltaText: {
    fontSize: typography.xs,
    fontWeight: typography.semibold,
  },
  rankDeltaTextUp: {
    color: colors.green400,
  },
  rankDeltaTextDown: {
    color: colors.orange400,
  },
  rankLeaderboardWrap: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.borderWhite10,
    backgroundColor: "rgba(8, 16, 18, 0.92)",
    justifyContent: "center",
  },
  rankLeaderboardScale: {
    transform: [{ scale: 0.72 }],
    marginVertical: -64,
  },
  cardBody: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  cardTitle: {
    color: colors.white,
    fontSize: typography.lg,
    fontWeight: typography.semibold,
  },
  cardDescription: {
    color: colors.textSecondary,
    fontSize: typography.base,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.xs,
  },
  activityTypePill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: colors.primaryOpacity10,
    borderWidth: 1,
    borderColor: colors.primaryOpacity30,
  },
  activityTypePillText: {
    color: colors.primary,
    fontSize: typography.xs,
    fontWeight: typography.semibold,
  },
  reactionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  reactionCount: {
    color: colors.textSecondary,
    fontSize: typography.sm,
    fontWeight: typography.medium,
  },
  emptyState: {
    marginTop: spacing.lg,
    padding: spacing.xl,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderWhite10,
    backgroundColor: "rgba(16, 20, 24, 0.66)",
    alignItems: "center",
    gap: spacing.sm,
  },
  emptyStateTitle: {
    color: colors.white,
    fontSize: typography.lg,
    fontWeight: typography.semibold,
  },
  emptyStateText: {
    color: colors.textSecondary,
    fontSize: typography.base,
    textAlign: "center",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: colors.blackOpacity40,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.cardDark,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderDark,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  modalTitle: {
    color: colors.white,
    fontSize: typography.lg,
    fontWeight: typography.bold,
  },
  modalList: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderWhite5,
  },
  modalItemText: {
    color: colors.white,
    fontSize: typography.base,
    flex: 1,
    paddingRight: spacing.sm,
  },
  modalEmpty: {
    color: colors.textSecondary,
    fontSize: typography.sm,
    textAlign: "center",
    paddingVertical: spacing.md,
  },
});
