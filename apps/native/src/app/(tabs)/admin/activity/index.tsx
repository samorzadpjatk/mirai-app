import React, { useMemo, useState, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation, useClient } from "urql";
import {
  GetActivitiesByTripModerationDocument,
  GetCurrentUserDocument,
  SetActivityPinnedDocument,
  HideActivityDocument,
  UnhideActivityDocument,
  DeleteActivityDocument,
  ActivityType,
} from "@mirai-app/graphql-client";
import { AdminHeader } from "~/components/admin/AdminHeader";
import { AdminAddFab } from "~/components/admin/common/AdminAddFab";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { borderRadius, colors, spacing, typography } from "~/styles";
import { clientLogger } from "@mirai-app/shared";
import {
  FilterChip,
  FilterChipRow,
  EmptyState,
  ThemedTextInput,
} from "~/components/common/ui";
import { AdminActivityCard } from "~/components/admin/activity/AdminActivityCard";

// Use GraphQL ActivityType enum values
const activityTypeFilters: { label: string; value: "all" | ActivityType }[] = [
  { label: "All", value: "all" },
  { label: "Submission", value: ActivityType.Submission },
  { label: "Challenge", value: ActivityType.ChallengeEvent },
  { label: "Rank", value: ActivityType.RankChange },
  { label: "Custom", value: ActivityType.Custom },
  { label: "User Post", value: ActivityType.UserPost },
];

// GraphQL Activity type doesn't include nested group info, so we return empty
// This maintains backward compatibility with AdminActivityCard interface
const getActivityGroupName = () => "";

export default function AdminActivityScreen() {
  const insets = useSafeAreaInsets();
  const urqlClient = useClient();
  const router = useRouter();
  const params = useLocalSearchParams<{ tripId?: string }>();
  const tripId =
    typeof params.tripId === "string"
      ? params.tripId
      : (params.tripId?.[0] ?? "");

  const [selectedType, setSelectedType] = useState<"all" | ActivityType>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Get current user query
  const [{ data: currentUserData }] = useQuery({
    query: GetCurrentUserDocument,
    pause: false,
  });

  // Get activities by trip moderation query
  const [{ data, fetching: isLoading, error: queryError }, reexecuteQuery] =
    useQuery({
      query: GetActivitiesByTripModerationDocument,
      variables: { tripId, page: 1, perPage: 100 },
      pause: !tripId,
    });

  const invalidateFeed = useCallback(async () => {
    await urqlClient.invalidate(GetActivitiesByTripModerationDocument, {
      tripId,
      page: 1,
      perPage: 100,
    });
  }, [urqlClient, tripId]);

  // Mutations
  const [, pinMutation] = useMutation(SetActivityPinnedDocument);
  const [, hideMutation] = useMutation(HideActivityDocument);
  const [, unhideMutation] = useMutation(UnhideActivityDocument);
  const [, deleteMutation] = useMutation(DeleteActivityDocument);

  const handlePin = useCallback(
    async (activity: { id: string; isPinned: boolean }) => {
      const result = await pinMutation({
        id: activity.id,
        isPinned: !activity.isPinned,
      });
      if (result.error) {
        Alert.alert("Error", result.error.message || "Pin update failed.");
      } else {
        await invalidateFeed();
      }
    },
    [pinMutation, invalidateFeed],
  );

  const handleHide = useCallback(
    async (activity: { id: string; isHidden: boolean }) => {
      const result = activity.isHidden
        ? await unhideMutation({ id: activity.id })
        : await hideMutation({ id: activity.id });
      if (result.error) {
        Alert.alert(
          "Error",
          result.error.message ||
            (activity.isHidden ? "Unhide failed." : "Hide failed."),
        );
      } else {
        await invalidateFeed();
      }
    },
    [hideMutation, unhideMutation, invalidateFeed],
  );

  const handleDelete = useCallback(
    (activity: { id: string }) => {
      Alert.alert("Delete activity", "Are you sure?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const result = await deleteMutation({ id: activity.id });
            if (result.error) {
              Alert.alert("Error", result.error.message || "Delete failed.");
            } else {
              await invalidateFeed();
            }
          },
        },
      ]);
    },
    [deleteMutation, invalidateFeed],
  );

  const activities = data?.activitiesByTripModeration?.activities ?? [];

  const filteredActivities = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return activities.filter((activity) => {
      if (selectedType !== "all" && activity.activityType !== selectedType) {
        return false;
      }

      if (!query) return true;

      const title = activity.title.toLowerCase();
      return title.includes(query);
    });
  }, [activities, searchTerm, selectedType]);

  // Check if any mutation is in progress
  const [mutationInProgress, setMutationInProgress] = useState(false);

  const canDelete = currentUserData?.me?.role === "ADMIN";

  const handleCreateActivity = () => {
    router.push({
      pathname: "/admin/activity/new",
      params: { tripId },
    });
  };

  const handleEditActivity = (activity: (typeof activities)[0]) => {
    router.push({
      pathname: "/admin/activity/edit/[activityId]",
      params: { activityId: activity.id, tripId },
    });
  };

  const wrappedHandlePin = useCallback(
    async (activity: (typeof activities)[0]) => {
      setMutationInProgress(true);
      try {
        await handlePin(activity);
      } finally {
        setMutationInProgress(false);
      }
    },
    [handlePin],
  );

  const wrappedHandleHide = useCallback(
    async (activity: (typeof activities)[0]) => {
      setMutationInProgress(true);
      try {
        await handleHide(activity);
      } finally {
        setMutationInProgress(false);
      }
    },
    [handleHide],
  );

  const wrappedHandleDelete = useCallback(
    (activity: (typeof activities)[0]) => {
      handleDelete(activity);
    },
    [handleDelete],
  );

  // Show query error if present
  if (queryError) {
    clientLogger.error("Query error:", { error: queryError });
  }

  if (!tripId) {
    return (
      <View style={[styles.container, { paddingTop: spacing.xl }]}>
        <StatusBar style="light" />
        <EmptyState
          title="Trip ID is required"
          subtitle="Open this view from Admin Panel with selected trip."
        />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { paddingTop: spacing.xl, paddingBottom: insets.bottom },
      ]}
    >
      <StatusBar style="light" />

      <AdminHeader title="Activity" subtitle="Manage community activity feed" />

      <View style={styles.filtersWrap}>
        <ThemedTextInput
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholder="Filter by title..."
          style={styles.searchInput}
        />

        <FilterChipRow>
          {activityTypeFilters.map((filter) => (
            <FilterChip
              key={filter.value}
              label={filter.label}
              selected={selectedType === filter.value}
              onPress={() => setSelectedType(filter.value)}
            />
          ))}
        </FilterChipRow>
      </View>

      {isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.centerSubtitle}>Loading activities...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredActivities}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={() => {
                void reexecuteQuery({ requestPolicy: "network-only" });
              }}
              tintColor={colors.primary}
            />
          }
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <EmptyState
              icon="chatbubble-ellipses-outline"
              iconSize={38}
              title="No activities found"
              subtitle="Change filters or create custom activity."
            />
          }
          renderItem={({ item }) => (
            <AdminActivityCard
              item={item}
              canDelete={canDelete}
              isBusy={mutationInProgress}
              onEdit={handleEditActivity}
              onPin={wrappedHandlePin}
              onHide={wrappedHandleHide}
              onDelete={wrappedHandleDelete}
            />
          )}
        />
      )}
      <AdminAddFab
        onPress={handleCreateActivity}
        accessibilityLabel="Add activity"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  filtersWrap: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.cardDark,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.white,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 120,
    gap: spacing.md,
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  centerSubtitle: {
    color: colors.textSecondary,
    fontSize: typography.sm,
    textAlign: "center",
  },
});
