import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { formatRelativeTime, formatDate } from "~/utils/format";
import type { NotificationScheduleItem } from "~/types/notifications";
import { useTRPC } from "@mirai-app/frameworks/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface NotificationScheduleCardProps {
  schedule: NotificationScheduleItem;
}

export function NotificationScheduleCard({
  schedule,
}: NotificationScheduleCardProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation(
    trpc.notificationSchedule.delete.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.notificationSchedule.getAll.queryOptions().queryKey,
        });
      },
      onError: (err) => {
        console.error("Error deleting schedule:", err);
      },
    }),
  );

  const toggleMutation = useMutation(
    trpc.notificationSchedule.toggleActive.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.notificationSchedule.getAll.queryOptions().queryKey,
        });
      },
      onError: (err) => {
        console.error("Error toggling schedule:", err);
      },
    }),
  );

  const handleDelete = () => {
    Alert.alert(
      "Delete Schedule?",
      "Are you sure you want to delete this notification schedule? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteMutation.mutate({ id: schedule.id }),
        },
      ],
    );
  };

  const handleToggle = () => {
    toggleMutation.mutate({ id: schedule.id });
  };

  return (
    <View style={styles.scheduleCard}>
      <View style={styles.scheduleHeader}>
        <View style={styles.scheduleInfo}>
          <Text style={styles.scheduleName}>{schedule.name}</Text>
          <Text style={styles.scheduleCreator}>
            Created by{" "}
            {schedule.createdBy
              ? `${schedule.createdBy.firstName ?? ""} ${schedule.createdBy.lastName ?? ""}`.trim()
              : "Unknown"}{" "}
            • {formatRelativeTime(schedule.createdAt)}
          </Text>
        </View>
        <View style={styles.scheduleActions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleToggle}>
            <Ionicons
              name={schedule.isActive ? "notifications" : "notifications-off"}
              size={16}
              color="#9ca3af"
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
            <Ionicons name="trash" size={16} color="#9ca3af" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tagRow}>
        <View style={[styles.tag, schedule.isActive && styles.tagActive]}>
          <Text
            style={[styles.tagText, schedule.isActive && styles.tagTextActive]}
          >
            {schedule.isActive ? "Active" : "Inactive"}
          </Text>
        </View>
        <View style={styles.tag}>
          <Text style={styles.tagText}>{schedule.notificationType}</Text>
        </View>
        {schedule?.trip?.name && (
          <View style={styles.tag}>
            <Text style={styles.tagText}>{schedule.trip.name}</Text>
          </View>
        )}
        <View style={styles.tag}>
          <Text style={styles.tagText}>
            {String(schedule.hour).padStart(2, "0")}:
            {String(schedule.minute).padStart(2, "0")}
          </Text>
        </View>
      </View>

      <View style={styles.scheduleDetails}>
        <Text style={styles.detailText}>
          Period: {formatDate(schedule.startDate)} -{" "}
          {formatDate(schedule.endDate)}
        </Text>
        {schedule.lastRun && (
          <Text style={styles.detailText}>
            Last run: {formatRelativeTime(schedule.lastRun)}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scheduleCard: {
    backgroundColor: "#23262b",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#374151",
    gap: 12,
  },
  scheduleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  scheduleInfo: {
    flex: 1,
  },
  scheduleName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
  },
  scheduleCreator: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  scheduleActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#374151",
    alignItems: "center",
    justifyContent: "center",
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    backgroundColor: "#374151",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagActive: {
    backgroundColor: "rgba(0, 206, 209, 0.2)",
  },
  tagText: {
    fontSize: 12,
    color: "#9ca3af",
  },
  tagTextActive: {
    color: "#00ced1",
  },
  scheduleDetails: {
    gap: 4,
  },
  detailText: {
    fontSize: 13,
    color: "#9ca3af",
  },
});
