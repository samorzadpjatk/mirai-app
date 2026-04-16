import { useGroups } from "~/hooks/groups";
import { useTripDetails } from "~/hooks/trips";
import { ScrollView, ActivityIndicator, RefreshControl } from "react-native";
import { YStack, XStack, Text } from "@mirai-app/ui";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useGetCurrentUserQuery } from "@mirai-app/frameworks";
import { useMemo } from "react";
import { FloatingActionButton } from "~/components/common/FloatingActionButton";
import { GroupsSearchBar } from "~/components/trips/groups/GroupsSearchBar";
import { GroupsListHeader } from "~/components/trips/groups/GroupsListHeader";
import { GroupsList } from "~/components/trips/groups/GroupsList";
import { GroupsLoadingState } from "~/components/trips/groups/GroupsLoadingState";
import { GroupsNoTripState } from "~/components/trips/groups/GroupsNoTripState";

export default function GroupsListScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const tripId =
    typeof params.tripId === "string" ? params.tripId : params.tripId?.[0];

  const { isTripPast } = useTripDetails(tripId);
  const {
    filteredGroups,
    isLoading,
    isRefetching,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
    searchQuery,
    setSearchQuery,
  } = useGroups(tripId);

  // GraphQL query for current user with group
  const [{ data: currentUserData, fetching: isLoadingCurrentUserGroup }] =
    useGetCurrentUserQuery({ pause: !tripId });
  const currentUserWithGroup = currentUserData?.me;

  const groupsLoading = isLoading;

  // Check if user has a group in current trip from their trips data
  const hasGroupInCurrentTrip = Boolean(
    currentUserWithGroup?.trips?.some(
      (trip) => trip.tripId === tripId && trip.group,
    ),
  );

  const myGroupId = useMemo(() => {
    if (!currentUserWithGroup?.trips?.length) return null;
    const match = currentUserWithGroup?.trips.find(
      (trip) => trip.tripId === tripId,
    );
    return match?.group?.id ?? null;
  }, [currentUserWithGroup, tripId]);

  const orderedGroups = useMemo(() => {
    if (!myGroupId) return filteredGroups;
    const index = filteredGroups.findIndex((group) => group.id === myGroupId);
    if (index === -1 || index <= 0) return filteredGroups;
    const mine = filteredGroups[index];
    if (!mine) return filteredGroups;
    return [
      mine,
      ...filteredGroups.slice(0, index),
      ...filteredGroups.slice(index + 1),
    ];
  }, [filteredGroups, myGroupId]);

  if (!tripId) {
    return <GroupsNoTripState onGoBack={() => router.back()} />;
  }

  const handleScrollLoadMore = (event: {
    nativeEvent: {
      contentOffset: { y: number };
      contentSize: { height: number };
      layoutMeasurement: { height: number };
    };
  }) => {
    if (!hasNextPage || isFetchingNextPage || isLoading) return;

    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const nearBottom =
      contentOffset.y + layoutMeasurement.height >= contentSize.height - 240;

    if (nearBottom) {
      void fetchNextPage();
    }
  };

  return (
    <YStack flex={1} backgroundColor="$background">
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 24, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
        onScroll={handleScrollLoadMore}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching && !isFetchingNextPage}
            onRefresh={() => {
              void refetch();
            }}
            tintColor="#2B2B2B"
          />
        }
      >
        {/* Search Bar */}
        <GroupsSearchBar value={searchQuery} onChangeText={setSearchQuery} />

        {/* Header */}
        <GroupsListHeader title="Groups" count={orderedGroups.length} />

        {/* Groups List */}
        {groupsLoading ? (
          <GroupsLoadingState />
        ) : (
          <GroupsList
            groups={orderedGroups}
            myGroupId={myGroupId}
            onSelectGroup={(group) => router.push(`/trips/groups/${group.id}`)}
          />
        )}

        {isFetchingNextPage ? (
          <XStack
            marginTop="$3"
            alignItems="center"
            justifyContent="center"
            gap="$2"
          >
            <ActivityIndicator size="small" color="#2B2B2B" />
            <Text fontSize={12} color="$color">
              Loading more groups...
            </Text>
          </XStack>
        ) : null}
      </ScrollView>

      {!isLoadingCurrentUserGroup && !hasGroupInCurrentTrip && !isTripPast ? (
        <FloatingActionButton
          onPress={() => router.push(`/trips/groups/create?tripId=${tripId}`)}
          iconName="add"
          iconSize={32}
          accessibilityLabel="Add group"
          style={{
            position: "absolute",
            right: 20,
            bottom: 96,
          }}
        />
      ) : null}
    </YStack>
  );
}
