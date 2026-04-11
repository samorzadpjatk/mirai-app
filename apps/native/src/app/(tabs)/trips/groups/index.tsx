import { useGroups } from "~/hooks/groups";
import { useTripDetails } from "~/hooks/trips";
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Text,
  RefreshControl,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  useGetGroupsByTripQuery,
  useGetCurrentUserQuery,
} from "@mirai-app/graphql-client";
import { graphqlClient } from "~/lib/graphql-client";
import { useMemo } from "react";
import { colors, spacing } from "../../../../styles";
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
  const { data: currentUserData, isLoading: isLoadingCurrentUserGroup } =
    useGetCurrentUserQuery(graphqlClient, {}, { enabled: !!tripId });
  const currentUserWithGroup = currentUserData?.currentUser;

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
    <View style={[styles.container]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent]}
        showsVerticalScrollIndicator={false}
        onScroll={handleScrollLoadMore}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching && !isFetchingNextPage}
            onRefresh={() => {
              void refetch();
            }}
            tintColor={colors.primary}
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
          <View style={styles.listFooter}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.listFooterText}>Loading more groups...</Text>
          </View>
        ) : null}
      </ScrollView>

      {!isLoadingCurrentUserGroup && !hasGroupInCurrentTrip && !isTripPast ? (
        <FloatingActionButton
          onPress={() => router.push(`/trips/groups/create?tripId=${tripId}`)}
          iconName="add"
          iconSize={32}
          activeOpacity={0.7}
          accessibilityLabel="Add group"
          style={styles.fab}
        />
      ) : null}
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
  listFooter: {
    marginTop: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  listFooterText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 96,
  },
});
