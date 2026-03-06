import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@integral-2025-app/trpc/client";
import { AdminHeader } from "~/components/admin/AdminHeader";
import { AdminAddFab } from "~/components/admin/common/AdminAddFab";
import { NotificationCard } from "~/components/admin/notifications/NotificationCard";
import { NotificationFilters } from "~/components/admin/notifications/NotificationFilters";
import { ScheduleCard } from "~/components/admin/schedules/ScheduleCard";
import {
  DeleteScheduleModal,
  EditScheduleModal,
} from "~/components/admin/schedules/ScheduleModals";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAdminNotifications, type Notification } from "~/hooks/admin/useAdminNotifications";
import {
  useAdminSchedules,
  type NotificationSchedule,
} from "~/hooks/admin/useAdminSchedules";
import { borderRadius, colors, spacing, typography } from "~/styles";
import { EmptyState } from "~/components/common/ui";

type AdminNotificationsTab = "sent" | "planned";
type PlannedSchedulesTab = "recurring" | "scheduled";

const AUDIENCE_MODE_PARAM = "__audience";
const AUDIENCE_GROUP_PARAM = "__groupId";

function parseTriggerTime(triggerTime: string): { hour: number; minute: number } {
  const [hourRaw, minuteRaw] = triggerTime.split(":");
  const hour = Number.parseInt(hourRaw ?? "", 10);
  const minute = Number.parseInt(minuteRaw ?? "", 10);

  if (
    Number.isNaN(hour) ||
    Number.isNaN(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    throw new Error("Invalid trigger time format");
  }

  return { hour, minute };
}

function parseNotificationAudience(url: string): {
  audienceMode: "all" | "group" | null;
  groupId: string | null;
} {
  try {
    const parsed = url.startsWith("/")
      ? new URL(url, "https://integral.local")
      : new URL(url);
    const audienceMode = parsed.searchParams.get(AUDIENCE_MODE_PARAM);
    const groupId = parsed.searchParams.get(AUDIENCE_GROUP_PARAM);
    return {
      audienceMode:
        audienceMode === "group" || audienceMode === "all"
          ? audienceMode
          : null,
      groupId: groupId?.trim() ? groupId : null,
    };
  } catch {
    return { audienceMode: null, groupId: null };
  }
}

export default function AdminNotificationsScreen() {
  const router = useRouter();
  const trpc = useTRPC();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ tripId?: string | string[] }>();
  const tripId =
    typeof params.tripId === "string" ? params.tripId : params.tripId?.[0] ?? "";

  const [searchTerm, setSearchTerm] = useState("");
  const [plannedSearchTerm, setPlannedSearchTerm] = useState("");
  const [tab, setTab] = useState<AdminNotificationsTab>("sent");
  const [plannedTab, setPlannedTab] = useState<PlannedSchedulesTab>("recurring");
  const [selectedGroupFilterId, setSelectedGroupFilterId] = useState<string>("all");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<NotificationSchedule | null>(null);

  const {
    notifications,
    isLoading: areNotificationsLoading,
    isRefetching: areNotificationsRefetching,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
    status,
    setStatus,
    retryNotification,
    deleteNotification,
    isRetrying,
    isDeleting,
  } = useAdminNotifications(tripId || undefined);

  const {
    schedules,
    isLoading: areSchedulesLoading,
    updateSchedule,
    deleteSchedule,
    toggleSchedule,
    isUpdating,
    isDeleting: isDeletingSchedule,
    isToggling,
  } = useAdminSchedules(tripId || undefined);

  const groupsQuery = useQuery({
    ...trpc.group.getAllNames.queryOptions({ tripId }),
    enabled: !!tripId,
  });
  const groups = groupsQuery.data ?? [];

  const sentNotifications = useMemo(() => {
    let filtered = notifications || [];

    if (status !== "all") {
      filtered = filtered.filter((notification) =>
        notification.pushes.some((push) => push.status === status),
      );
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (notification) =>
          notification.title.toLowerCase().includes(term) ||
          notification.body.toLowerCase().includes(term) ||
          notification.createdBy.firstName?.toLowerCase().includes(term) ||
          notification.createdBy.lastName?.toLowerCase().includes(term),
      );
    }

    if (selectedGroupFilterId !== "all") {
      filtered = filtered.filter((notification) => {
        const audience = parseNotificationAudience(notification.url);
        return (
          audience.audienceMode === "group" && audience.groupId === selectedGroupFilterId
        );
      });
    }

    return filtered;
  }, [notifications, searchTerm, selectedGroupFilterId, status]);

  const plannedSchedules = useMemo(() => {
    return schedules.filter((schedule) => schedule.isActive);
  }, [schedules]);

  const normalizedPlannedSearchTerm = plannedSearchTerm.trim().toLowerCase();

  const recurringSchedules = useMemo(
    () =>
      plannedSchedules.filter((schedule) => {
        if (!schedule.isRecurring) return false;
        if (!normalizedPlannedSearchTerm) return true;
        const title = (schedule.notificationTitle ?? schedule.name).toLowerCase();
        return title.includes(normalizedPlannedSearchTerm);
      }),
    [plannedSchedules, normalizedPlannedSearchTerm],
  );

  const oneTimeScheduled = useMemo(
    () =>
      plannedSchedules.filter(
        (schedule) =>
          !schedule.isRecurring &&
          schedule.executionCount === 0 &&
          !schedule.lastTriggered &&
          (!normalizedPlannedSearchTerm ||
            (schedule.notificationTitle ?? schedule.name)
              .toLowerCase()
              .includes(normalizedPlannedSearchTerm)),
      ),
    [plannedSchedules, normalizedPlannedSearchTerm],
  );

  const handleRetry = async (notificationId: string) => {
    try {
      await retryNotification(notificationId);
    } catch {
      Alert.alert("Error", "Failed to retry notification");
    }
  };

  const handleDelete = (notificationId: string) => {
    Alert.alert("Delete Notification", "Are you sure you want to delete this notification?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteNotification(notificationId).catch(() => {
            Alert.alert("Error", "Failed to delete notification");
          });
        },
      },
    ]);
  };

  const handleToggleSchedule = async (schedule: NotificationSchedule) => {
    try {
      await toggleSchedule(schedule.id);
    } catch {
      Alert.alert("Error", "Failed to toggle schedule");
    }
  };

  const handleUpdateSchedule = async (
    id: string,
    name: string,
    message: string,
    triggerTime: string,
  ) => {
    try {
      const { hour, minute } = parseTriggerTime(triggerTime);
      await updateSchedule({
        id,
        name,
        notificationTitle: name,
        notificationBody: message,
        hour,
        minute,
      });
      setShowEditModal(false);
      setSelectedSchedule(null);
    } catch {
      Alert.alert("Error", "Failed to update schedule");
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    try {
      await deleteSchedule(id);
      setShowDeleteModal(false);
      setSelectedSchedule(null);
    } catch {
      Alert.alert("Error", "Failed to delete schedule");
    }
  };

  const openEditModal = (schedule: NotificationSchedule) => {
    setSelectedSchedule(schedule);
    setShowEditModal(true);
  };

  const openDeleteModal = (schedule: NotificationSchedule) => {
    setSelectedSchedule(schedule);
    setShowDeleteModal(true);
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <NotificationCard
      notification={item}
      onRetry={handleRetry}
      onDelete={handleDelete}
      isRetrying={isRetrying}
      isDeleting={isDeleting}
    />
  );

  const handleLoadMoreNotifications = () => {
    if (!hasNextPage || isFetchingNextPage || areNotificationsLoading) {
      return;
    }

    void fetchNextPage();
  };

  return (
    <View style={[styles.container, { paddingTop: spacing.xl, paddingBottom: insets.bottom }]}>
      <StatusBar style="light" />

      <AdminHeader
        title="Notifications"
      />

      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabButton, tab === "sent" && styles.tabButtonActive]}
          onPress={() => setTab("sent")}
        >
          <Text style={[styles.tabText, tab === "sent" && styles.tabTextActive]}>Sent</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, tab === "planned" && styles.tabButtonActive]}
          onPress={() => setTab("planned")}
        >
          <Text style={[styles.tabText, tab === "planned" && styles.tabTextActive]}>Planned</Text>
        </TouchableOpacity>
      </View>

      {tab === "sent" ? (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Sent notifications</Text>
          </View>

          <NotificationFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            status={status}
            onStatusChange={setStatus}
            groups={groups}
            selectedGroupId={selectedGroupFilterId}
            onGroupChange={setSelectedGroupFilterId}
          />

          {areNotificationsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading notifications...</Text>
            </View>
          ) : (
            <FlatList
              data={sentNotifications}
              renderItem={renderNotification}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.notificationsList}
              showsVerticalScrollIndicator={false}
              onEndReached={handleLoadMoreNotifications}
              onEndReachedThreshold={0.35}
              refreshControl={
                <RefreshControl
                  refreshing={areNotificationsRefetching && !isFetchingNextPage}
                  onRefresh={() => {
                    void refetch();
                  }}
                  tintColor={colors.primary}
                />
              }
              ListFooterComponent={
                isFetchingNextPage ? (
                  <View style={styles.listFooter}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={styles.inlineLoadingText}>Loading more notifications...</Text>
                  </View>
                ) : null
              }
              ListEmptyComponent={
                <EmptyState
                  icon="notifications-off"
                  title="No sent notifications found."
                />
              }
            />
          )}
        </>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Planned notifications</Text>
          </View>

          <View style={styles.searchSection}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color={colors.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search planned by title..."
                value={plannedSearchTerm}
                onChangeText={setPlannedSearchTerm}
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </View>

          <View style={styles.plannedTabsRow}>
            <TouchableOpacity
              style={[styles.tabButton, plannedTab === "recurring" && styles.tabButtonActive]}
              onPress={() => setPlannedTab("recurring")}
            >
              <Text style={[styles.tabText, plannedTab === "recurring" && styles.tabTextActive]}>
                Recurring
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, plannedTab === "scheduled" && styles.tabButtonActive]}
              onPress={() => setPlannedTab("scheduled")}
            >
              <Text style={[styles.tabText, plannedTab === "scheduled" && styles.tabTextActive]}>
                Scheduled
              </Text>
            </TouchableOpacity>
          </View>

          {plannedTab === "recurring" ? (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recurring schedules</Text>
              </View>

              {areSchedulesLoading ? (
                <View style={styles.inlineLoadingContainer}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.inlineLoadingText}>Loading schedules...</Text>
                </View>
              ) : recurringSchedules.length === 0 ? (
                <View style={styles.inlineEmptyContainer}>
                  <Text style={styles.inlineEmptyText}>
                    No recurring schedules matching title.
                  </Text>
                </View>
              ) : (
                recurringSchedules.map((schedule) => (
                  <ScheduleCard
                    key={schedule.id}
                    schedule={schedule}
                    onEdit={openEditModal}
                    onDelete={openDeleteModal}
                    onToggle={handleToggleSchedule}
                    onTrigger={() => {
                      Alert.alert("Info", "Manual trigger is not available yet.");
                    }}
                    isToggling={isToggling}
                  />
                ))
              )}
            </>
          ) : (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Scheduled (one-time)</Text>
              </View>

              {areSchedulesLoading ? (
                <View style={styles.inlineLoadingContainer}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.inlineLoadingText}>Loading schedules...</Text>
                </View>
              ) : oneTimeScheduled.length === 0 ? (
                <View style={styles.inlineEmptyContainer}>
                  <Text style={styles.inlineEmptyText}>
                    No pending one-time schedules matching title.
                  </Text>
                </View>
              ) : (
                oneTimeScheduled.map((schedule) => (
                  <ScheduleCard
                    key={schedule.id}
                    schedule={schedule}
                    onEdit={openEditModal}
                    onDelete={openDeleteModal}
                    onToggle={handleToggleSchedule}
                    onTrigger={() => {
                      Alert.alert("Info", "Manual trigger is not available yet.");
                    }}
                    isToggling={isToggling}
                  />
                ))
              )}
            </>
          )}
        </ScrollView>
      )}

      <EditScheduleModal
        visible={showEditModal}
        onClose={() => setShowEditModal(false)}
        schedule={selectedSchedule}
        onUpdateSchedule={handleUpdateSchedule}
        isUpdating={isUpdating}
      />

      <DeleteScheduleModal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        schedule={selectedSchedule}
        onDeleteSchedule={handleDeleteSchedule}
        isDeleting={isDeletingSchedule}
      />

      <AdminAddFab
        onPress={() =>
          router.push({
            pathname: "/admin/notifications/new",
            params: { tripId },
          })
        }
        accessibilityLabel="Create notification"
        bottom={Math.max(insets.bottom + 18, 96)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  tabsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  tabButton: {
    flex: 1,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.borderDark,
    backgroundColor: colors.cardDark,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  tabButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabText: {
    color: colors.textSecondary,
    fontSize: typography.sm,
    fontWeight: typography.medium,
  },
  tabTextActive: {
    color: colors.white,
  },
  sectionHeader: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  sectionTitle: {
    color: colors.white,
    fontSize: typography.base,
    fontWeight: typography.medium,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.base,
    color: colors.textSecondary,
  },
  notificationsList: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  listFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  plannedTabsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  searchSection: {
    marginBottom: spacing.md,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.cardDark,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: typography.base,
    color: colors.white,
  },
  inlineLoadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  inlineLoadingText: {
    color: colors.textSecondary,
    fontSize: typography.sm,
  },
  inlineEmptyContainer: {
    marginBottom: spacing.md,
  },
  inlineEmptyText: {
    color: colors.textSecondary,
    fontSize: typography.sm,
  },
});
