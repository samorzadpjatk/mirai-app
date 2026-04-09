import React, { useMemo, useState } from "react";
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminHeader } from "~/components/admin/AdminHeader";
import { AdminAddFab } from "~/components/admin/common/AdminAddFab";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { borderRadius, colors, spacing, typography } from "~/styles";
import { useTRPC } from "@mirai-app/frameworks/trpc/client";
import { FilterChip, FilterChipRow, EmptyState, ThemedTextInput } from "~/components/common/ui";
import { AdminActivityCard } from "~/components/admin/activity/AdminActivityCard";

type ActivityType =
  | "submission"
  | "challenge_event"
  | "rank_change"
  | "custom"
  | "user_post";

interface AdminActivity {
  id: string;
  tripId: string;
  activityType: ActivityType;
  title: string;
  description: string | null;
  imageUrl: string | null;
  isPinned: boolean;
  isHidden: boolean;
  createdAt: Date | string;
  admin?: { firstName?: string | null; lastName?: string | null } | null;
  submissionActivity?: {
    group?: { name?: string | null } | null;
  } | null;
  rankChangeActivity?: {
    group?: { name?: string | null } | null;
  } | null;
  userPost?: {
    author?: {
      group?: { name?: string | null } | null;
    } | null;
  } | null;
}

const activityTypeFilters: { label: string; value: "all" | ActivityType }[] = [
  { label: "All", value: "all" },
  { label: "Submission", value: "submission" },
  { label: "Challenge", value: "challenge_event" },
  { label: "Rank", value: "rank_change" },
  { label: "Custom", value: "custom" },
  { label: "User Post", value: "user_post" },
];


const getActivityGroupName = (activity: AdminActivity) =>
  activity.submissionActivity?.group?.name?.trim() ??
  activity.rankChangeActivity?.group?.name?.trim() ??
  activity.userPost?.author?.group?.name?.trim() ??
  "";


export default function AdminActivityScreen() {
  const trpc = useTRPC();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const router = useRouter();
  const params = useLocalSearchParams<{ tripId?: string }>();
  const tripId =
    typeof params.tripId === "string" ? params.tripId : params.tripId?.[0] ?? "";

  const [selectedType, setSelectedType] = useState<"all" | ActivityType>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const feedQueryOptions = trpc.activityFeed.getByTripModeration.queryOptions({
    tripId,
    page: 1,
    pageSize: 100,
  });

  const { data: currentUser } = useQuery(trpc.user.getMy.queryOptions());
  const { data, isLoading, isRefetching, refetch } = useQuery({
    ...feedQueryOptions,
    enabled: Boolean(tripId),
  });

  const invalidateFeed = async () => {
    await queryClient.invalidateQueries({ queryKey: feedQueryOptions.queryKey });
  };

  const pinMutation = useMutation(
    trpc.activityFeed.setPinned.mutationOptions({
      onSuccess: invalidateFeed,
      onError: (error) => Alert.alert("Error", error.message),
    }),
  );

  const hideMutation = useMutation(
    trpc.activityFeed.hide.mutationOptions({
      onSuccess: invalidateFeed,
      onError: (error) => Alert.alert("Error", error.message),
    }),
  );

  const unhideMutation = useMutation(
    trpc.activityFeed.unhide.mutationOptions({
      onSuccess: invalidateFeed,
      onError: (error) => Alert.alert("Error", error.message),
    }),
  );

  const deleteMutation = useMutation(
    trpc.activityFeed.delete.mutationOptions({
      onSuccess: invalidateFeed,
      onError: (error) => Alert.alert("Error", error.message),
    }),
  );

  const filteredActivities = useMemo(() => {
    const allActivities = (data?.activities ?? []) as AdminActivity[];
    const query = searchTerm.trim().toLowerCase();
    return allActivities.filter((activity) => {
      if (selectedType !== "all" && activity.activityType !== selectedType) {
        return false;
      }

      if (!query) return true;

      const groupName = getActivityGroupName(activity).toLowerCase();
      const title = activity.title.toLowerCase();
      return title.includes(query) || groupName.includes(query);
    });
  }, [data?.activities, searchTerm, selectedType]);

  const isBusy =
    pinMutation.isPending ||
    hideMutation.isPending ||
    unhideMutation.isPending ||
    deleteMutation.isPending;

  const canDelete = currentUser?.role === "ADMIN";

  const handleCreateActivity = () => {
    router.push({
      pathname: "/admin/activity/new",
      params: { tripId },
    });
  };

  const handleEditActivity = (activity: AdminActivity) => {
    router.push({
      pathname: "/admin/activity/edit/[activityId]",
      params: { activityId: activity.id, tripId },
    });
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
    <View style={[styles.container, { paddingTop: spacing.xl, paddingBottom: insets.bottom }]}>
      <StatusBar style="light" />

      <AdminHeader
        title="Activity"
        subtitle="Manage community activity feed"
      />

      <View style={styles.filtersWrap}>
        <ThemedTextInput
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholder="Filter by title or group..."
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
              onPin={(activity) =>
                pinMutation.mutate({
                  activityId: activity.id,
                  isPinned: !activity.isPinned,
                })
              }
              onHide={(activity) =>
                activity.isHidden
                  ? unhideMutation.mutate({ activityId: activity.id })
                  : hideMutation.mutate({ activityId: activity.id })
              }
              onDelete={(activity) => {
                Alert.alert("Delete activity", "Are you sure?", [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => deleteMutation.mutate({ activityId: activity.id }),
                  },
                ]);
              }}
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
