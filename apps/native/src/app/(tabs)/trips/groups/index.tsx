import { useGroups } from "~/hooks/groups";
import { View, ScrollView, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTRPC } from "@integral-2025-app/trpc/client";
import { colors, spacing } from "../../../../styles";
import { GroupsCreateButton } from "~/components/trips/groups/GroupsCreateButton";
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
  const groupsLoading = isLoading;

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
        {/* Create Group Button */}
        <GroupsCreateButton
          onPress={() => router.push(`/trips/groups/create?tripId=${tripId}`)}
        />

        {/* Search Bar */}
        <GroupsSearchBar value={searchQuery} onChangeText={setSearchQuery} />

        {/* Header */}
        <GroupsListHeader
          title="Active Trip Clusters"
          count={filteredGroups.length}
        />

        {/* Groups List */}
        {groupsLoading ? (
          <GroupsLoadingState />
        ) : (
          <GroupsList
            groups={filteredGroups}
            onSelectGroup={(group) => router.push(`/trips/groups/${group.id}`)}
          />
        )}
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
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
});
