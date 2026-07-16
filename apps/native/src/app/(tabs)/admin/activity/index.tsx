import type { Activity } from "@mirai-app/orpc";
import { orpc } from "@mirai-app/orpc/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import { Alert, FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AdminHeader } from "~/components/admin/AdminHeader";
import { AdminActivityCard } from "~/components/admin/activity/AdminActivityCard";
import { AdminAddFab } from "~/components/admin/common/AdminAddFab";
import { DeckBackground } from "~/components/common/DeckBackground";
import { EmptyState, FilterChip, FilterChipRow, ThemedTextInput } from "~/components/common/ui";
import { Skeleton } from "~/components/ui/Skeleton";
import { borderRadius, colors, spacing, typography } from "~/styles";
import { type ThemePalette, useThemedStyles, useTripTheme } from "~/theme/TripThemeProvider";

type ActivityType = Activity["activityType"];

type AdminActivity = Activity;

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
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const router = useRouter();
  const params = useLocalSearchParams<{ tripId?: string }>();
  const tripId = typeof params.tripId === "string" ? params.tripId : (params.tripId?.[0] ?? "");
  const { palette } = useTripTheme();
  const styles = useThemedStyles(makeStyles);

  const [selectedType, setSelectedType] = useState<"all" | ActivityType>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const feedQueryOptions = orpc.activityFeed.getByTripModeration.queryOptions({
    input: {
      tripId,
      page: 1,
      pageSize: 100,
    },
  });

  const { data: currentUser } = useQuery(orpc.user.getMy.queryOptions({ input: {} }));
  const { data, isLoading, isRefetching, refetch } = useQuery({
    ...feedQueryOptions,
    enabled: Boolean(tripId),
  });

  const invalidateFeed = async () => {
    await queryClient.invalidateQueries({ queryKey: feedQueryOptions.queryKey });
  };

  const pinMutation = useMutation(
    orpc.activityFeed.setPinned.mutationOptions({
      onSuccess: invalidateFeed,
      onError: (error) => Alert.alert("Error", error.message),
    }),
  );

  const hideMutation = useMutation(
    orpc.activityFeed.hide.mutationOptions({
      onSuccess: invalidateFeed,
      onError: (error) => Alert.alert("Error", error.message),
    }),
  );

  const unhideMutation = useMutation(
    orpc.activityFeed.unhide.mutationOptions({
      onSuccess: invalidateFeed,
      onError: (error) => Alert.alert("Error", error.message),
    }),
  );

  const deleteMutation = useMutation(
    orpc.activityFeed.delete.mutationOptions({
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
      <DeckBackground />

      <AdminHeader title="Activity" subtitle="Manage community activity feed" />

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
        <View style={styles.skeletonList}>
          <Skeleton.Group testID="activity-loading-skeleton">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton
                // biome-ignore lint/suspicious/noArrayIndexKey: deterministic placeholder rows
                key={`activity-skeleton-${index}`}
                variant="box"
                width="100%"
                height={120}
              />
            ))}
          </Skeleton.Group>
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
              tintColor={palette.primary}
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
      <AdminAddFab onPress={handleCreateActivity} accessibilityLabel="Add activity" />
    </View>
  );
}

function makeStyles(palette: ThemePalette) {
  return StyleSheet.create({
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
      borderColor: palette.borderDark,
      borderRadius: borderRadius.lg,
      backgroundColor: palette.cardDark,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      color: colors.white,
    },
    listContent: {
      paddingHorizontal: spacing.lg,
      paddingBottom: 96,
      gap: spacing.md,
    },
    skeletonList: {
      flex: 1,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
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
      color: palette.textSecondary,
      fontSize: typography.sm,
      textAlign: "center",
    },
  });
}
