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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { GraphQLClient } from "graphql-request";
import * as SecureStore from "expo-secure-store";
import {
  useGetActivitiesByTripModerationQuery,
  useGetCurrentUserQuery,
  useSetActivityPinnedMutation,
  useHideActivityMutation,
  useUnhideActivityMutation,
  useDeleteActivityMutation,
  ActivityType,
} from "@mirai-app/graphql-types";
import { AdminHeader } from "~/components/admin/AdminHeader";
import { AdminAddFab } from "~/components/admin/common/AdminAddFab";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { borderRadius, colors, spacing, typography } from "~/styles";
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

// Create GraphQL client with auth token from SecureStore
const createGraphQLClient = async () => {
  const graphqlUrl =
    process.env.EXPO_PUBLIC_GRAPHQL_URL || "http://localhost:3000/graphql";
  const token = await SecureStore.getItemAsync("token");

  return new GraphQLClient(graphqlUrl, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
};

export default function AdminActivityScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const router = useRouter();
  const params = useLocalSearchParams<{ tripId?: string }>();
  const tripId =
    typeof params.tripId === "string"
      ? params.tripId
      : (params.tripId?.[0] ?? "");

  const [selectedType, setSelectedType] = useState<"all" | ActivityType>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [client, setClient] = useState<GraphQLClient | null>(null);

  // Initialize GraphQL client
  React.useEffect(() => {
    void createGraphQLClient().then(setClient);
  }, []);

  // Get current user query
  const { data: currentUserData } = useGetCurrentUserQuery(
    client ?? new GraphQLClient(""),
    {},
    { enabled: !!client },
  );

  // Get activities by trip moderation query
  const { data, isLoading, isRefetching, refetch } =
    useGetActivitiesByTripModerationQuery(
      client ?? new GraphQLClient(""),
      { tripId, page: 1, perPage: 100 },
      { enabled: !!client && Boolean(tripId) },
    );

  const invalidateFeed = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: [
        "GetActivitiesByTripModeration",
        { tripId, page: 1, perPage: 100 },
      ],
    });
  }, [queryClient, tripId]);

  // Mutations
  const pinMutation = useSetActivityPinnedMutation(
    client ?? new GraphQLClient(""),
    {
      onSuccess: invalidateFeed,
      onError: (error) =>
        Alert.alert(
          "Error",
          error instanceof Error ? error.message : "Pin update failed.",
        ),
    },
  );

  const hideMutation = useHideActivityMutation(
    client ?? new GraphQLClient(""),
    {
      onSuccess: invalidateFeed,
      onError: (error) =>
        Alert.alert(
          "Error",
          error instanceof Error ? error.message : "Hide failed.",
        ),
    },
  );

  const unhideMutation = useUnhideActivityMutation(
    client ?? new GraphQLClient(""),
    {
      onSuccess: invalidateFeed,
      onError: (error) =>
        Alert.alert(
          "Error",
          error instanceof Error ? error.message : "Unhide failed.",
        ),
    },
  );

  const deleteMutation = useDeleteActivityMutation(
    client ?? new GraphQLClient(""),
    {
      onSuccess: invalidateFeed,
      onError: (error) =>
        Alert.alert(
          "Error",
          error instanceof Error ? error.message : "Delete failed.",
        ),
    },
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

  const isBusy =
    pinMutation.isPending ||
    hideMutation.isPending ||
    unhideMutation.isPending ||
    deleteMutation.isPending;

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

  const handlePin = async (activity: (typeof activities)[0]) => {
    await pinMutation.mutateAsync({
      id: activity.id,
      isPinned: !activity.isPinned,
    });
  };

  const handleHide = async (activity: (typeof activities)[0]) => {
    if (activity.isHidden) {
      await unhideMutation.mutateAsync({ id: activity.id });
    } else {
      await hideMutation.mutateAsync({ id: activity.id });
    }
  };

  const handleDelete = (activity: (typeof activities)[0]) => {
    Alert.alert("Delete activity", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteMutation.mutate({ id: activity.id }),
      },
    ]);
  };

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
              refreshing={isRefetching}
              onRefresh={() => {
                void refetch();
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
              isBusy={isBusy}
              onEdit={handleEditActivity}
              onPin={handlePin}
              onHide={handleHide}
              onDelete={handleDelete}
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
