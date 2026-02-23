import { useGroups } from "~/hooks/groups";
import { View, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTRPC } from "@integral-2025-app/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { colors, spacing } from "../../../../styles";
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
  const trpc = useTRPC();

  const { filteredGroups, isLoading, searchQuery, setSearchQuery } =
    useGroups(tripId);
  const { data: currentUserWithGroup, isLoading: isLoadingCurrentUserGroup } =
    useQuery({
      ...trpc.user.getMyWithGroup.queryOptions({ tripId: tripId ?? "" }),
      enabled: !!tripId,
    });
  const groupsLoading = isLoading;
  const hasGroupInCurrentTrip = Boolean(
    currentUserWithGroup?.trips?.some((trip) => trip.group),
  );
  const myGroupId = useMemo(() => {
    if (!currentUserWithGroup?.trips?.length) return null;
    const match = currentUserWithGroup.trips.find(
      (trip) => trip.tripId === tripId,
    );
    return match?.group?.id ?? null;
}, [currentUserWithGroup.trips, tripId]);

  const orderedGroups = useMemo(() => {
    if (!myGroupId) return filteredGroups;
    const index = filteredGroups.findIndex((group) => group.id === myGroupId);
    if (index <= 0) return filteredGroups;
    const mine = filteredGroups[index];
    return [
      mine,
      ...filteredGroups.slice(0, index),
      ...filteredGroups.slice(index + 1),
    ];
  }, [filteredGroups, myGroupId]);

  if (!tripId) {
    return <GroupsNoTripState onGoBack={() => router.back()} />;
  }

  return (
    <View style={[styles.container]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent]}
        showsVerticalScrollIndicator={false}
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
      </ScrollView>

      {!isLoadingCurrentUserGroup && !hasGroupInCurrentTrip ? (
        <TouchableOpacity
          onPress={() => router.push(`/trips/groups/create?tripId=${tripId}`)}
          style={styles.fab}
          accessibilityRole="button"
          accessibilityLabel="Add group"
        >
          <Ionicons name="add" size={32} color={colors.backgroundDark} />
        </TouchableOpacity>
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
  fab: {
    position: "absolute",
    right: 20,
    bottom: 96,
    width: 58,
    height: 58,
    borderRadius: 999,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
});
