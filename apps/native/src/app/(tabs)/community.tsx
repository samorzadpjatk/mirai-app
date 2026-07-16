import { Ionicons } from "@expo/vector-icons";
import type { Activity } from "@mirai-app/orpc";
import { LinearGradient } from "expo-linear-gradient";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CachedImage } from "~/components/common/CachedImage";

import {
  CommunityActivityCard,
  type CommunityFeedActivity,
} from "~/components/community/CommunityActivityCard";

import LoadingScreen from "~/components/LoadingScreen";
import { Skeleton } from "~/components/ui/Skeleton";

import { useAuth } from "@mirai-app/auth/client";
import { Logo } from "~/components";
import { DeckBackground } from "~/components/common/DeckBackground";
import {
  EmptyState,
  ErrorState,
  FilterChip,
  FilterChipRow,
  TripPickerModal,
} from "~/components/common/ui";
import { useCommunityFeed } from "~/hooks/community/useCommunityFeed";
import { useHomeFull } from "~/hooks/home";
import { useAutoSelectFirstTrip, useSelectedTrip } from "~/hooks/trips";
import { colors, spacing, typography } from "~/styles";
import { type ThemePalette, useThemedStyles, useTripTheme } from "~/theme/TripThemeProvider";

type ActivityFilter = "all" | Activity["activityType"];

const ACTIVITY_FILTERS: { key: ActivityFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "custom", label: "News" },
  { key: "submission", label: "Photos" },
  { key: "challenge_event", label: "Challenge" },
  { key: "rank_change", label: "Ranking" },
  { key: "user_post", label: "Posts" },
];

export default function CommunityScreen() {
  const { session, isLoading: isLoadingSession } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{
    filter?: string | string[];
    focusActivityId?: string | string[];
  }>();
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(makeStyles);
  const { palette } = useTripTheme();
  const {
    trips,
    isLoading: isTripsLoading,
    isRefetching: isTripsRefetching,
    hasNextPage: hasMoreTrips,
    isFetchingNextPage: isFetchingMoreTrips,
    fetchNextPage: fetchMoreTrips,
    refetch: refetchTrips,
  } = useHomeFull();
  const { selectedTripId, isLoadingSelectedTrip, setSelectedTripId } = useSelectedTrip();

  const [isTripPickerManuallyOpen, setIsTripPickerManuallyOpen] = useState(false);
  const [hasDismissedAutoPicker, setHasDismissedAutoPicker] = useState(false);

  useAutoSelectFirstTrip(trips, hasDismissedAutoPicker);

  const selectedTrip = useMemo(() => {
    if (!selectedTripId) return null;
    return trips.find((trip) => trip.id === selectedTripId) ?? null;
  }, [selectedTripId, trips]);

  const tripImageStoragePath = selectedTrip?.backgroundImagePath ?? null;

  const shouldAutoOpenTripPicker =
    trips.length > 0 && (!selectedTripId || !selectedTrip) && !hasDismissedAutoPicker;
  const isTripPickerOpen = isTripPickerManuallyOpen || shouldAutoOpenTripPicker;

  const selectedFilter = useMemo<ActivityFilter>(() => {
    const rawFilter = typeof params.filter === "string" ? params.filter : params.filter?.[0];

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

  const { feedQuery, filteredActivities, handleToggleHeart, rankingData, avatarUrls } =
    useCommunityFeed({
      selectedTripId: selectedTrip?.id ?? null,
      selectedFilter,
      focusActivityId,
    });

  const handleSelectFilter = useCallback(
    (filter: ActivityFilter) => {
      const paramValue = filter === "custom" ? "news" : filter;
      router.setParams({ filter: paramValue, focusActivityId: undefined });
    },
    [router],
  );

  const keyExtractor = useCallback((item: CommunityFeedActivity) => item.id, []);

  const getItemLayout = useCallback(
    (_data: ArrayLike<CommunityFeedActivity> | null | undefined, index: number) => ({
      length: 200, // Approximate height of CommunityActivityCard
      offset: 200 * index,
      index,
    }),
    [],
  );

  const isRefreshing =
    isTripsRefetching || (feedQuery.isRefetching && !feedQuery.isFetchingNextPage);

  const handleRefresh = useCallback(() => {
    const requests: Promise<unknown>[] = [refetchTrips()];
    if (selectedTrip?.id) {
      requests.push(feedQuery.refetch());
    }
    void Promise.all(requests);
  }, [feedQuery, selectedTrip?.id, refetchTrips]);

  const handleFeedEndReached = useCallback(() => {
    if (!selectedTrip?.id) return;
    if (feedQuery.isLoading || feedQuery.isFetchingNextPage) return;
    if (!feedQuery.hasNextPage) return;
    void feedQuery.fetchNextPage();
  }, [feedQuery, selectedTrip?.id]);

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

  const handleTripPickerLoadMore = useCallback(
    (event: {
      nativeEvent: {
        contentOffset: { y: number };
        contentSize: { height: number };
        layoutMeasurement: { height: number };
      };
    }) => {
      if (!hasMoreTrips || isFetchingMoreTrips || isTripsLoading) return;

      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
      const nearBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 240;

      if (nearBottom) {
        void fetchMoreTrips();
      }
    },
    [fetchMoreTrips, hasMoreTrips, isFetchingMoreTrips, isTripsLoading],
  );

  const renderActivityItem = useCallback(
    ({ item }: { item: CommunityFeedActivity }) => {
      const challengeId =
        item.activityType === "challenge_event" ? item.challengeActivity?.challengeId : null;
      const leaderboardTripId = item.activityType === "rank_change" ? item.tripId : null;
      const submissionGroupId =
        item.activityType === "submission"
          ? (item.submissionActivity?.groupId ?? item.submissionActivity?.group?.id)
          : null;

      const getAvatarUri = (activity: CommunityFeedActivity) => {
        const owner =
          activity.activityType === "user_post" ? activity.userPost?.author?.user : activity.admin;

        if (!owner?.id) return null;

        // Check if user has a direct avatar image
        if (activity.activityType === "submission" && activity.submissionActivity?.group?.image) {
          return activity.submissionActivity.group.image;
        }

        if (activity.activityType === "rank_change" && activity.rankChangeActivity?.group?.image) {
          return activity.rankChangeActivity.group.image;
        }

        // Use fetched avatar URL
        return avatarUrls[owner.id] ?? null;
      };

      return (
        <CommunityActivityCard
          activity={item}
          isFocused={item.id === focusActivityId}
          onToggleHeart={handleToggleHeart}
          onPress={
            challengeId
              ? () => router.push(`/trips/challenges/${challengeId}?tripId=${item.tripId}`)
              : leaderboardTripId
                ? () => router.push(`/trips/leaderboard?tripId=${leaderboardTripId}`)
                : undefined
          }
          onPressOwner={
            submissionGroupId ? () => router.push(`/trips/groups/${submissionGroupId}`) : undefined
          }
          rankingData={item.activityType === "rank_change" ? rankingData[item.tripId] : undefined}
          avatarUri={getAvatarUri(item)}
        />
      );
    },
    [focusActivityId, handleToggleHeart, router, rankingData, avatarUrls],
  );

  if (isLoadingSession || isTripsLoading || isLoadingSelectedTrip) {
    return <LoadingScreen message="Loading community..." />;
  }

  if (!session) {
    return <Redirect href="/auth/login" />;
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <LinearGradient
        colors={[palette.backgroundDark, palette.backgroundDarkAlt]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Deck sits above the opaque gradient (both act as the screen background) and
          below all interactive chrome, matching the trip hub's z-order pattern. */}
      <DeckBackground />

      <View style={[styles.headerWrap, { paddingTop: Math.max(insets.top - spacing.md, 0) }]}>
        <View style={styles.headerTopRow}>
          <View style={styles.brandRow}>
            <View style={styles.logoWrap}>
              <Logo size={96} />
            </View>
          </View>

          <TouchableOpacity
            style={styles.tripTile}
            onPress={handleOpenTripPicker}
            activeOpacity={0.8}
          >
            {tripImageStoragePath ? (
              <CachedImage
                storagePath={tripImageStoragePath}
                style={styles.tripTileImage}
                contentFit="cover"
              />
            ) : (
              <View style={styles.tripTileImagePlaceholder} />
            )}
            <View style={styles.tripTileOverlay}>
              <Text style={styles.tripTileName} numberOfLines={1}>
                {selectedTrip?.name ?? "Select trip"}
              </Text>
              <Ionicons name="swap-horizontal" size={12} color={colors.whiteOpacity70} />
            </View>
          </TouchableOpacity>
        </View>

        {selectedTrip ? (
          <FilterChipRow>
            {ACTIVITY_FILTERS.map((filter) => (
              <FilterChip
                key={filter.key}
                label={filter.label}
                selected={selectedFilter === filter.key}
                onPress={() => handleSelectFilter(filter.key)}
              />
            ))}
          </FilterChipRow>
        ) : null}

        {selectedTrip && feedQuery.isLoading ? (
          <View style={styles.feedSkeleton}>
            <Skeleton.Group testID="community-feed-loading-skeleton">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton
                  // biome-ignore lint/suspicious/noArrayIndexKey: deterministic placeholder rows
                  key={`feed-skeleton-${index}`}
                  variant="box"
                  width="100%"
                  height={200}
                />
              ))}
            </Skeleton.Group>
          </View>
        ) : null}

        {selectedTrip && feedQuery.isError ? (
          <ErrorState
            title="Failed to load feed"
            message={feedQuery.error?.message ?? "Something went wrong"}
            onRetry={() => void feedQuery.refetch()}
          />
        ) : null}
      </View>

      <FlatList
        style={styles.feedList}
        data={filteredActivities}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        onEndReached={handleFeedEndReached}
        onEndReachedThreshold={0.35}
        renderItem={renderActivityItem}
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        updateCellsBatchingPeriod={30}
        windowSize={10}
        removeClippedSubviews={true}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingTop: spacing.sm,
            paddingBottom: 96,
          },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.white}
            colors={[colors.white]}
            progressBackgroundColor={palette.cardDarkOpacity70}
          />
        }
        ListEmptyComponent={
          selectedTrip ? (
            feedQuery.isLoading ? null : (
              <EmptyState
                icon="chatbubbles-outline"
                iconSize={36}
                title="No activities yet"
                subtitle="Pull to refresh to load new community posts."
              />
            )
          ) : (
            <EmptyState
              icon="navigate-outline"
              iconSize={36}
              title="Select trip first"
              subtitle="Pick your trip to load the community feed."
            />
          )
        }
        ListFooterComponent={
          feedQuery.isFetchingNextPage ? (
            <View style={styles.listFooterLoading}>
              <ActivityIndicator size="small" color={palette.primary} />
              <Text style={styles.listFooterLoadingText}>Loading more...</Text>
            </View>
          ) : null
        }
      />

      <TripPickerModal
        visible={isTripPickerOpen}
        onClose={handleCloseTripPicker}
        onSelectTrip={handleSelectTrip}
        trips={trips}
        selectedTripId={selectedTrip?.id}
        isLoading={isTripsLoading}
        isFetchingMore={isFetchingMoreTrips}
        onLoadMore={handleTripPickerLoadMore}
      />
    </View>
  );
}

function makeStyles(palette: ThemePalette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: palette.backgroundDark,
    },
    feedList: {
      flex: 1,
    },
    listContent: {
      paddingHorizontal: spacing.lg,
      gap: spacing.lg,
    },
    listFooterLoading: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
      paddingVertical: spacing.md,
    },
    listFooterLoadingText: {
      color: colors.textSecondary,
      fontSize: typography.sm,
    },
    headerWrap: {
      gap: spacing.xs,
      marginBottom: 0,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xs,
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
      width: 96,
      height: 96,
      alignItems: "center",
      justifyContent: "center",
    },
    tripTile: {
      width: 130,
      height: 52,
      borderRadius: 10,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.whiteOpacity12,
    },
    tripTileImage: {
      ...StyleSheet.absoluteFillObject,
    },
    tripTileImagePlaceholder: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: palette.primaryOpacity10,
    },
    tripTileOverlay: {
      flex: 1,
      backgroundColor: colors.blackOpacity38,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 10,
      gap: 4,
    },
    tripTileName: {
      color: colors.white,
      fontSize: typography.xs,
      fontWeight: typography.semibold,
      flex: 1,
    },
    loadingState: {
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.md,
      paddingVertical: spacing.xl,
    },
    feedSkeleton: {
      gap: spacing.lg,
      paddingVertical: spacing.sm,
    },
    loadingStateText: {
      color: colors.textSecondary,
      fontSize: typography.lg,
      fontWeight: typography.semibold,
    },
  });
}
