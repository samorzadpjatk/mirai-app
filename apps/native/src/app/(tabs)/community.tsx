import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { YStack, XStack, Text } from "@mirai-app/ui";

import {
  CommunityActivityCard,
  type CommunityFeedActivity,
} from "~/components/community/CommunityActivityCard";

import LoadingScreen from "~/components/LoadingScreen";

import { useCommunityFeed } from "~/hooks/community/useCommunityFeed";
import { useCommunityActivityData } from "~/hooks/community/useCommunityActivityData";
import { useSelectedTrip, useTrips } from "~/hooks/trips";
import {
  EmptyState,
  FilterChip,
  FilterChipRow,
  TripPickerModal,
} from "~/components/common/ui";
import { useAuth } from "@mirai-app/frameworks/auth/client";
import { useTripBackgroundImageDownload } from "~/hooks/trips/useTripBackgroundImageDownload";
import { Logo } from "~/components";

// Spacing values from Tamagui tokens for React Native styles
const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
};

// Typography values for React Native styles
const typography = {
  xs: 12,
  sm: 14,
  semibold: "600" as const,
};

// Color values for React Native styles
const colors = {
  backgroundDark: "#17181c",
  backgroundDarkAlt: "#102222",
  primary: "#00ced1",
  white: "#ffffff",
  whiteOpacity70: "rgba(255, 255, 255, 0.7)",
  whiteOpacity12: "rgba(255, 255, 255, 0.12)",
  primaryOpacity10: "rgba(0, 206, 209, 0.1)",
  blackOpacity38: "rgba(0, 0, 0, 0.38)",
  textSecondary: "#9ca3af",
  cardDarkOpacity70: "rgba(27, 40, 40, 0.7)",
};

type ActivityFilter =
  | "all"
  | "submission"
  | "challenge_event"
  | "rank_change"
  | "custom"
  | "user_post";

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
  const {
    trips,
    isLoading: isTripsLoading,
    isRefetching: isTripsRefetching,
    hasNextPage: hasMoreTrips,
    isFetchingNextPage: isFetchingMoreTrips,
    fetchNextPage: fetchMoreTrips,
    refetch: refetchTrips,
  } = useTrips();
  const { selectedTripId, isLoadingSelectedTrip, setSelectedTripId } =
    useSelectedTrip();

  const [isTripPickerManuallyOpen, setIsTripPickerManuallyOpen] =
    useState(false);
  const [hasDismissedAutoPicker, setHasDismissedAutoPicker] = useState(false);

  useEffect(() => {
    if (!isLoadingSession && !session) {
      router.replace("/auth/login");
    }
  }, [isLoadingSession, session, router]);

  const selectedTrip = useMemo(() => {
    if (!selectedTripId) return null;
    return trips.find((trip) => trip.id === selectedTripId) ?? null;
  }, [selectedTripId, trips]);

  const { imageUrl: tripImageUrl } = useTripBackgroundImageDownload(
    selectedTrip?.backgroundImagePath,
  );

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

  const { feedQuery, filteredActivities, handleToggleHeart } = useCommunityFeed(
    {
      selectedTripId: selectedTrip?.id ?? null,
      selectedFilter,
      focusActivityId,
    },
  );

  const { rankingData, avatarUrls } = useCommunityActivityData({
    activities: filteredActivities,
  });

  const handleSelectFilter = useCallback(
    (filter: ActivityFilter) => {
      const paramValue = filter === "custom" ? "news" : filter;
      router.setParams({ filter: paramValue, focusActivityId: undefined });
    },
    [router],
  );

  const keyExtractor = useCallback(
    (item: CommunityFeedActivity) => item.id,
    [],
  );

  const getItemLayout = useCallback(
    (
      data: ArrayLike<CommunityFeedActivity> | null | undefined,
      index: number,
    ) => ({
      length: 200, // Approximate height of CommunityActivityCard
      offset: 200 * index,
      index,
    }),
    [],
  );

  const isRefreshing =
    isTripsRefetching ||
    (feedQuery.isRefetching && !feedQuery.isFetchingNextPage);

  const handleRefresh = useCallback((): void => {
    void refetchTrips();
    if (selectedTrip?.id) {
      void feedQuery.refetch();
    }
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

      const { contentOffset, contentSize, layoutMeasurement } =
        event.nativeEvent;
      const nearBottom =
        contentOffset.y + layoutMeasurement.height >= contentSize.height - 240;

      if (nearBottom) {
        void fetchMoreTrips();
      }
    },
    [fetchMoreTrips, hasMoreTrips, isFetchingMoreTrips, isTripsLoading],
  );

  const renderActivityItem = useCallback(
    ({ item }: { item: CommunityFeedActivity }) => {
      const challengeId =
        item.activityType === "challenge_event"
          ? item.challengeActivity?.challengeId
          : null;
      const leaderboardTripId =
        item.activityType === "rank_change" ? item.tripId : null;
      const submissionGroupId =
        item.activityType === "submission"
          ? (item.submissionActivity?.groupId ??
            item.submissionActivity?.group?.id)
          : null;

      const getAvatarUri = (activity: CommunityFeedActivity) => {
        const owner =
          activity.activityType === "user_post"
            ? activity.userPost?.author?.user
            : activity.admin;

        if (!owner?.id) return null;

        // Check if user has a direct avatar image
        if (
          activity.activityType === "submission" &&
          activity.submissionActivity?.group?.image
        ) {
          return activity.submissionActivity.group.image;
        }

        if (
          activity.activityType === "rank_change" &&
          activity.rankChangeActivity?.group?.image
        ) {
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
              ? () =>
                  router.push(
                    `/trips/challenges/${challengeId}?tripId=${item.tripId}`,
                  )
              : leaderboardTripId
                ? () =>
                    router.push(
                      `/trips/leaderboard?tripId=${leaderboardTripId}`,
                    )
                : undefined
          }
          onPressOwner={
            submissionGroupId
              ? () => router.push(`/trips/groups/${submissionGroupId}`)
              : undefined
          }
          rankingData={
            item.activityType === "rank_change"
              ? rankingData[item.tripId]
              : undefined
          }
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
    return null;
  }

  return (
    <YStack flex={1} backgroundColor="$backgroundDark">
      <StatusBar style="light" />

      <LinearGradient
        colors={[colors.backgroundDark, colors.backgroundDarkAlt]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
        }}
      />

      <YStack
        gap="$xs"
        marginBottom={0}
        paddingHorizontal="$lg"
        paddingBottom="$xs"
        paddingTop={Math.max(insets.top - spacing.md, 0)}
      >
        <XStack alignItems="center" justifyContent="space-between" gap="$sm">
          <XStack alignItems="center" gap="$sm" flexShrink={1}>
            <YStack
              width={96}
              height={96}
              alignItems="center"
              justifyContent="center"
            >
              <Logo size={96} />
            </YStack>
          </XStack>

          <TouchableOpacity onPress={handleOpenTripPicker} activeOpacity={0.8}>
            <YStack
              width={130}
              height={52}
              borderRadius={10}
              overflow="hidden"
              borderWidth={1}
              borderColor="$whiteOpacity12"
            >
              {tripImageUrl ? (
                <Image
                  source={{ uri: tripImageUrl }}
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: 0,
                    bottom: 0,
                  }}
                  contentFit="cover"
                />
              ) : (
                <YStack
                  position="absolute"
                  left={0}
                  right={0}
                  top={0}
                  bottom={0}
                  backgroundColor="$primaryOpacity10"
                />
              )}
              <XStack
                flex={1}
                backgroundColor="$blackOpacity38"
                alignItems="center"
                justifyContent="space-between"
                paddingHorizontal={10}
                gap={4}
              >
                <Text
                  color="$white"
                  fontSize="$xs"
                  fontWeight="600"
                  flex={1}
                  numberOfLines={1}
                >
                  {selectedTrip?.name ?? "Select trip"}
                </Text>
                <Ionicons
                  name="swap-horizontal"
                  size={12}
                  color={colors.whiteOpacity70}
                />
              </XStack>
            </YStack>
          </TouchableOpacity>
        </XStack>

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
          <XStack alignItems="center" gap="$sm" marginTop="$xs">
            <ActivityIndicator size="small" color={colors.primary} />
            <Text color="$textSecondary" fontSize="$sm">
              Loading feed...
            </Text>
          </XStack>
        ) : null}
      </YStack>

      <FlatList
        style={{ flex: 1 }}
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
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.sm,
          paddingBottom: insets.bottom + 120,
        }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => void handleRefresh()}
            tintColor={colors.white}
            colors={[colors.white]}
            progressBackgroundColor={colors.cardDarkOpacity70}
          />
        }
        ListEmptyComponent={
          !selectedTrip ? (
            <EmptyState
              icon="navigate-outline"
              iconSize={36}
              title="Select trip first"
              subtitle="Pick your trip to load the community feed."
            />
          ) : !feedQuery.isLoading ? (
            <EmptyState
              icon="chatbubbles-outline"
              iconSize={36}
              title="No activities yet"
              subtitle="Pull to refresh to load new community posts."
            />
          ) : null
        }
        ListFooterComponent={
          feedQuery.isFetchingNextPage ? (
            <XStack
              alignItems="center"
              justifyContent="center"
              gap="$sm"
              paddingVertical="$md"
            >
              <ActivityIndicator size="small" color={colors.primary} />
              <Text color="$textSecondary" fontSize="$sm">
                Loading more...
              </Text>
            </XStack>
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
    </YStack>
  );
}
