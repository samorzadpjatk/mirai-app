import React, { useState, useMemo } from "react";
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
import { GraphQLClient } from "graphql-request";
import * as SecureStore from "expo-secure-store";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { colors, spacing, borderRadius, typography } from "../../../../styles";
import {
  useGetNotificationSchedulesQuery,
  useCreateNotificationScheduleMutation,
  type GetNotificationSchedulesQuery,
} from "@mirai-app/graphql-types";
import { AdminHeader } from "~/components/admin/AdminHeader";
import { ScheduleCard } from "~/components/admin/schedules/ScheduleCard";
import {
  CreateScheduleModal,
  EditScheduleModal,
  DeleteScheduleModal,
} from "~/components/admin/schedules/ScheduleModals";

type NotificationSchedule = NonNullable<
  GetNotificationSchedulesQuery["notificationSchedules"]
>[number];

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

// GraphQL Client setup with SecureStore
const createGraphQLClient = async (): Promise<GraphQLClient> => {
  const token = await SecureStore.getItemAsync("sb-access-token");
  return new GraphQLClient(
    process.env.EXPO_PUBLIC_GRAPHQL_URL || "http://localhost:4000/graphql",
    {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    },
  );
};

export default function AdminSchedulesScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ tripId?: string | string[] }>();
  const tripId =
    typeof params.tripId === "string"
      ? params.tripId
      : (params.tripId?.[0] ?? "");

  const [client, setClient] = useState<GraphQLClient | null>(null);

  useMemo(() => {
    createGraphQLClient().then(setClient);
  }, []);

  // Query for notification schedules
  const { data: schedulesData, isLoading } = useQuery({
    queryKey: ["GetNotificationSchedules", { tripId }],
    enabled: Boolean(tripId) && Boolean(client),
    queryFn: async () => {
      if (!client) throw new Error("GraphQL client not initialized");
      return useGetNotificationSchedulesQuery.fetcher(client, { tripId })();
    },
  });

  const schedules =
    (schedulesData as GetNotificationSchedulesQuery | undefined)
      ?.notificationSchedules ?? [];

  // Create schedule mutation
  const createScheduleMutation = useMutation({
    mutationFn: async (input: {
      name: string;
      tripId: string;
      notificationTitle: string;
      notificationBody: string;
      notificationUrl: string;
      hour: number;
      minute: number;
      notificationType: string;
      startDate: Date;
      endDate: Date;
    }) => {
      if (!client) throw new Error("GraphQL client not initialized");
      return useCreateNotificationScheduleMutation.fetcher(client, {
        input: {
          name: input.name,
          tripId: input.tripId,
          notificationTitle: input.notificationTitle,
          notificationBody: input.notificationBody,
          notificationUrl: input.notificationUrl,
          hour: input.hour,
          minute: input.minute,
          notificationType: input.notificationType,
          startDate: input.startDate.toISOString(),
          endDate: input.endDate.toISOString(),
        },
      })();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["GetNotificationSchedules"],
      });
    },
    onError: (error) => {
      Alert.alert(
        "Error",
        `Failed to create schedule: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    },
  });

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] =
    useState<NotificationSchedule | null>(null);

  // Event handlers
  const handleCreateSchedule = async (
    name: string,
    message: string,
    triggerTime: string,
  ) => {
    try {
      if (!tripId) {
        Alert.alert("Error", "Trip context is required to create schedules");
        return;
      }
      const { hour, minute } = parseTriggerTime(triggerTime);
      const { startDate, endDate } = getScheduleWindow(hour, minute);

      await createScheduleMutation.mutateAsync({
        name,
        tripId,
        notificationTitle: name,
        notificationBody: message,
        notificationUrl: "/ranking",
        hour,
        minute,
        notificationType: "custom",
        startDate,
        endDate,
      });
      setShowCreateModal(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create schedule";
      Alert.alert("Error", message);
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

      {isLoading || !client ? (
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
        />
      )}

      <CreateScheduleModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateSchedule={handleCreateSchedule}
        isCreating={createScheduleMutation.isPending}
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
