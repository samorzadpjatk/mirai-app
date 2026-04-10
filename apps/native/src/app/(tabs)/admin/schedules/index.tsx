import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useClient } from "urql";
import { colors, spacing, borderRadius, typography } from "../../../../styles";
import {
  GetNotificationSchedulesDocument,
  CreateNotificationScheduleDocument,
  type GetNotificationSchedulesQuery,
} from "@mirai-app/graphql-types";
import { AdminHeader } from "~/components/admin/AdminHeader";
import { ScheduleCard } from "~/components/admin/schedules/ScheduleCard";
import {
  CreateScheduleModal,
  EditScheduleModal,
  DeleteScheduleModal,
} from "~/components/admin/schedules/ScheduleModals";

// NotificationScheduleSummary type from GraphQL
interface NotificationSchedule {
  id: string;
  name: string;
  message: string;
  triggerTime: string;
  formattedTime: string;
  hour: number;
  minute: number;
  isActive: boolean;
  isCurrentlyActive: boolean;
  isExpired: boolean;
  isUpcoming: boolean;
  notificationType: string;
  notificationTitle?: string | null;
  notificationBody?: string | null;
  notificationUrl?: string | null;
  startDate: Date | string;
  endDate: Date | string;
  lastRun?: Date | string | null;
  tripId?: string | null;
  createdById: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

function parseTriggerTime(triggerTime: string): {
  hour: number;
  minute: number;
} {
  const [hoursRaw, minutesRaw] = triggerTime.split(":");
  const hour = parseInt(hoursRaw ?? "", 10);
  const minute = parseInt(minutesRaw ?? "", 10);

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

function getScheduleWindow(
  hour: number,
  minute: number,
): { startDate: Date; endDate: Date } {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setHours(hour, minute, 0, 0);

  const minFutureDate = new Date(now.getTime() + 5 * 60 * 1000);
  if (startDate < minFutureDate) {
    startDate.setDate(startDate.getDate() + 1);
  }

  const endDate = new Date(now);
  endDate.setFullYear(endDate.getFullYear() + 1);

  return { startDate, endDate };
}

// Transform GraphQL schedule to local NotificationSchedule format
function transformSchedule(
  schedule: GetNotificationSchedulesQuery["notificationSchedules"]["schedules"][number],
): NotificationSchedule {
  return {
    id: schedule.id,
    name: schedule.name,
    message: "", // NotificationScheduleSummary doesn't have message
    triggerTime: `${String(schedule.hour).padStart(2, "0")}:${String(schedule.minute).padStart(2, "0")}`,
    formattedTime: `${String(schedule.hour).padStart(2, "0")}:${String(schedule.minute).padStart(2, "0")}`,
    hour: schedule.hour,
    minute: schedule.minute,
    isActive: schedule.isActive,
    isCurrentlyActive: false, // Not available in summary
    isExpired: false, // Not available in summary
    isUpcoming: false, // Not available in summary
    notificationType: schedule.notificationType,
    startDate: schedule.startDate,
    endDate: schedule.endDate,
    tripId: schedule.tripId,
    createdById: "", // Not available in summary
    createdAt: "", // Not available in summary
    updatedAt: "", // Not available in summary
  };
}

export default function AdminSchedulesScreen() {
  const insets = useSafeAreaInsets();
  const client = useClient();
  const params = useLocalSearchParams<{ tripId?: string | string[] }>();
  const tripId =
    typeof params.tripId === "string"
      ? params.tripId
      : (params.tripId?.[0] ?? "");

  // Query for notification schedules
  const [{ data, fetching: isLoading }, refetchSchedules] = useQuery({
    query: GetNotificationSchedulesDocument,
    variables: {
      tripId,
      limit: 50,
      offset: 0,
    },
    pause: !tripId,
  });

  const schedules = useMemo(() => {
    if (!data?.notificationSchedules?.schedules) return [];
    return data.notificationSchedules.schedules.map(transformSchedule);
  }, [data]);

  // Create schedule mutation
  const [, executeCreateSchedule] = useMutation(
    CreateNotificationScheduleDocument,
  );

  const handleCreateSchedule = useCallback(
    async (name: string, message: string, triggerTime: string) => {
      try {
        if (!tripId) {
          Alert.alert("Error", "Trip context is required to create schedules");
          return;
        }
        const { hour, minute } = parseTriggerTime(triggerTime);
        const { startDate, endDate } = getScheduleWindow(hour, minute);

        const result = await executeCreateSchedule({
          name,
          hour,
          minute,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          notificationType: "CUSTOM",
          isActive: true,
          notificationTitle: name,
          notificationBody: message,
          notificationUrl: "/ranking",
          tripId,
        });

        if (result.error) {
          Alert.alert(
            "Error",
            `Failed to create schedule: ${result.error.message}`,
          );
          return;
        }

        // Invalidate and refetch schedules
        await client.invalidate(GetNotificationSchedulesDocument, {
          tripId,
          limit: 50,
          offset: 0,
        });
        setShowCreateModal(false);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to create schedule";
        Alert.alert("Error", message);
      }
    },
    [tripId, executeCreateSchedule, client],
  );

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] =
    useState<NotificationSchedule | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async (
    name: string,
    message: string,
    triggerTime: string,
  ) => {
    setIsCreating(true);
    try {
      await handleCreateSchedule(name, message, triggerTime);
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateSchedule = async (
    id: string,
    name: string,
    message: string,
    triggerTime: string,
  ) => {
    // Note: Update mutation not provided, would need to be added
    Alert.alert("Info", "Update schedule functionality will be available soon");
    setShowEditModal(false);
    setSelectedSchedule(null);
  };

  const handleDeleteSchedule = async (id: string) => {
    // Note: Delete mutation not provided, would need to be added
    Alert.alert("Info", "Delete schedule functionality will be available soon");
    setShowDeleteModal(false);
    setSelectedSchedule(null);
  };

  const handleToggleSchedule = async (schedule: NotificationSchedule) => {
    // Note: Toggle mutation not provided, would need to be added
    Alert.alert("Info", "Toggle schedule functionality will be available soon");
  };

  const handleTriggerSchedule = (schedule: NotificationSchedule) => {
    Alert.alert(
      "Trigger Schedule",
      `Are you sure you want to trigger "${schedule.name}" now?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Trigger",
          style: "default",
          onPress: () => {
            Alert.alert(
              "Info",
              "Manual trigger functionality will be available soon",
            );
          },
        },
      ],
    );
  };

  const openEditModal = (schedule: NotificationSchedule) => {
    setSelectedSchedule(schedule);
    setShowEditModal(true);
  };

  const openDeleteModal = (schedule: NotificationSchedule) => {
    setSelectedSchedule(schedule);
    setShowDeleteModal(true);
  };

  const renderSchedule = ({ item }: { item: NotificationSchedule }) => (
    <ScheduleCard
      schedule={item}
      onEdit={openEditModal}
      onDelete={openDeleteModal}
      onToggle={handleToggleSchedule}
      onTrigger={handleTriggerSchedule}
      isToggling={false}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="time" size={48} color={colors.textSecondary} />
      <Text style={styles.emptyText}>No schedules found</Text>
      <TouchableOpacity
        style={styles.emptyCreateButton}
        onPress={() => setShowCreateModal(true)}
      >
        <Text style={styles.emptyCreateButtonText}>
          Create your first schedule
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View
      style={[
        styles.container,
        { paddingTop: spacing.xl, paddingBottom: insets.bottom },
      ]}
    >
      <StatusBar style="light" />

      <AdminHeader
        title="Notification Schedules"
        subtitle="Manage automated notifications"
        rightComponent={
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Ionicons name="add" size={20} color={colors.white} />
          </TouchableOpacity>
        }
      />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading schedules...</Text>
        </View>
      ) : (
        <FlatList
          data={schedules}
          renderItem={renderSchedule}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.schedulesList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
          refreshing={isLoading}
          onRefresh={() => {
            void refetchSchedules({ requestPolicy: "network-only" });
          }}
        />
      )}

      <CreateScheduleModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateSchedule={handleCreate}
        isCreating={isCreating}
      />

      <EditScheduleModal
        visible={showEditModal}
        onClose={() => setShowEditModal(false)}
        schedule={selectedSchedule}
        onUpdateSchedule={handleUpdateSchedule}
        isUpdating={false}
      />

      <DeleteScheduleModal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        schedule={selectedSchedule}
        onDeleteSchedule={handleDeleteSchedule}
        isDeleting={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  createButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.base,
    color: colors.textSecondary,
  },
  schedulesList: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  emptyContainer: {
    alignItems: "center" as const,
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    marginTop: spacing.md,
    fontSize: typography.base,
    color: colors.textSecondary,
    textAlign: "center" as const,
    marginBottom: spacing.lg,
  },
  emptyCreateButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
  },
  emptyCreateButtonText: {
    fontSize: typography.base,
    color: colors.white,
    fontWeight: typography.medium,
  },
});
