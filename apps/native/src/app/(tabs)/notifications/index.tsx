import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Pressable,
} from "react-native";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTRPC } from "@integral-2025-app/trpc/client";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { formatRelativeTime, formatDate } from "~/utils/format";
import { useAppSafeAreaInsets } from '~/contexts/safeArea';

export default function NotificationsScreen() {
  const trpc = useTRPC();
  const router = useRouter();

  // Check user permissions
  const { data: currentUser, isLoading: isLoadingUser } = useQuery(
    trpc.user.getMy.queryOptions(),
  );

  // Redirect if user doesn't have access
  useEffect(() => {
    if (!isLoadingUser && currentUser) {
      const hasAccess = [
        currentUser?.isAdmin,
        currentUser?.isModerator,
        currentUser?.isServiceAccount,
      ].some(Boolean);
      if (!hasAccess) {
        router.replace("/");
      }
    }
  }, [currentUser, isLoadingUser, router]);

  const {
    data: schedulesData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery(trpc.notificationSchedule.getAll.queryOptions());

  const insets = useAppSafeAreaInsets();

  const schedules = schedulesData?.schedules ?? [];

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createType, setCreateType] = useState<"custom" | "ranking">("custom");
  const [createTitle, setCreateTitle] = useState("");
  const [createBody, setCreateBody] = useState("");
  const [createStartDate, setCreateStartDate] = useState("");
  const [createEndDate, setCreateEndDate] = useState("");
  const [createHour, setCreateHour] = useState("9");
  const [createMinute, setCreateMinute] = useState("0");

  const [deletingScheduleId, setDeletingScheduleId] = useState<string | null>(
    null,
  );

  const createScheduleMutation = useMutation(
    trpc.notificationSchedule.create.mutationOptions({
      onSuccess: () => {
        void refetch();
        setIsCreateDialogOpen(false);
        // Reset form
        setCreateName("");
        setCreateType("custom");
        setCreateTitle("");
        setCreateBody("");
        setCreateStartDate("");
        setCreateEndDate("");
        setCreateHour("9");
        setCreateMinute("0");
      },
      onError: (err) => {
        console.error("Error creating schedule:", err);
      },
    }),
  );

  const deleteScheduleMutation = useMutation(
    trpc.notificationSchedule.delete.mutationOptions({
      onSuccess: () => {
        void refetch();
        setDeletingScheduleId(null);
      },
      onError: (err) => {
        console.error("Error deleting schedule:", err);
      },
    }),
  );

  const toggleActiveMutation = useMutation(
    trpc.notificationSchedule.toggleActive.mutationOptions({
      onSuccess: () => {
        void refetch();
      },
      onError: (err) => {
        console.error("Error toggling schedule:", err);
      },
    }),
  );

  const handleCreate = () => {
    if (createName.trim() && createStartDate && createEndDate) {
      createScheduleMutation.mutate({
        name: createName.trim(),
        notificationType: createType,
        notificationTitle: createType === "custom" ? createTitle : undefined,
        notificationBody: createType === "custom" ? createBody : undefined,
        startDate: new Date(createStartDate),
        endDate: new Date(createEndDate),
        hour: parseInt(createHour),
        minute: parseInt(createMinute),
        isActive: true,
      });
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      "Delete Schedule?",
      "Are you sure you want to delete this notification schedule? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteScheduleMutation.mutate({ id }),
        },
      ]
    );
  };

  const handleToggleActive = (id: string) => {
    toggleActiveMutation.mutate({ id });
  };

  if (isLoading || isLoadingUser) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00ced1" />
        <Text style={styles.loadingText}>Loading notifications...</Text>
      </View>
    );
  }

  // Don't render if user doesn't have access
  if (
    !currentUser?.isAdmin &&
    !currentUser?.isModerator &&
    !currentUser?.isServiceAccount
  ) {
    return null;
  }

  if (isError) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorTitle}>Error loading notifications</Text>
        <Text style={styles.errorMessage}>
          {error?.message ?? "Something went wrong"}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => void refetch()}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container,{paddingTop: insets.top , paddingBottom: insets.bottom }]}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={() => void refetch()}
            tintColor="#00ced1"
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Notification Schedules</Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setIsCreateDialogOpen(true)}
          >
            <Ionicons name="add" size={16} color="#17181c" />
            <Text style={styles.createButtonText}>Create</Text>
          </TouchableOpacity>
        </View>

        {/* Empty State */}
        {schedules.length === 0 && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              No notification schedules found. Create your first schedule!
            </Text>
          </View>
        )}

        {/* Schedules List */}
        {schedules?.map((schedule) => (
          <View key={schedule.id} style={styles.scheduleCard}>
            <View style={styles.scheduleHeader}>
              <View style={styles.scheduleInfo}>
                <Text style={styles.scheduleName}>{schedule.name}</Text>
                <Text style={styles.scheduleCreator}>
                  Created by {schedule.createdBy?.name} •{" "}
                  {formatRelativeTime(schedule.createdAt)}
                </Text>
              </View>
              <View style={styles.scheduleActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleToggleActive(schedule.id)}
                >
                  <Ionicons
                    name={schedule.isActive ? "notifications" : "notifications-off"}
                    size={16}
                    color="#9ca3af"
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDelete(schedule.id)}
                >
                  <Ionicons name="trash" size={16} color="#9ca3af" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.tagRow}>
              <View style={[styles.tag, schedule.isActive && styles.tagActive]}>
                <Text style={[styles.tagText, schedule.isActive && styles.tagTextActive]}>
                  {schedule.isActive ? "Active" : "Inactive"}
                </Text>
              </View>
              <View style={styles.tag}>
                <Text style={styles.tagText}>{schedule.notificationType}</Text>
              </View>
              <View style={styles.tag}>
                <Text style={styles.tagText}>
                  {String(schedule.hour).padStart(2, "0")}:
                  {String(schedule.minute).padStart(2, "0")}
                </Text>
              </View>
            </View>

            <View style={styles.scheduleDetails}>
              <Text style={styles.detailText}>
                Period: {formatDate(schedule.startDate)} - {formatDate(schedule.endDate)}
              </Text>
              {schedule.lastRun && (
                <Text style={styles.detailText}>
                  Last run: {formatRelativeTime(schedule.lastRun)}
                </Text>
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Create Schedule Modal */}
      <Modal
        visible={isCreateDialogOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsCreateDialogOpen(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create Notification Schedule</Text>
            <TouchableOpacity onPress={() => setIsCreateDialogOpen(false)}>
              <Ionicons name="close" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalDescription}>
              Schedule a notification to be sent at specific times
            </Text>

            {/* Schedule Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Schedule Name</Text>
              <TextInput
                style={styles.input}
                placeholder="E.g., Daily Ranking Update"
                placeholderTextColor="#6b7280"
                value={createName}
                onChangeText={setCreateName}
              />
            </View>

            {/* Notification Type */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Notification Type</Text>
              <View style={styles.typeSelector}>
                <TouchableOpacity
                  style={[styles.typeOption, createType === "custom" && styles.typeOptionActive]}
                  onPress={() => setCreateType("custom")}
                >
                  <Text style={[styles.typeOptionText, createType === "custom" && styles.typeOptionTextActive]}>
                    Custom Message
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeOption, createType === "ranking" && styles.typeOptionActive]}
                  onPress={() => setCreateType("ranking")}
                >
                  <Text style={[styles.typeOptionText, createType === "ranking" && styles.typeOptionTextActive]}>
                    Ranking Update
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Custom Message Fields */}
            {createType === "custom" && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Notification Title</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Title"
                    placeholderTextColor="#6b7280"
                    value={createTitle}
                    onChangeText={setCreateTitle}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Notification Body</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Message content"
                    placeholderTextColor="#6b7280"
                    value={createBody}
                    onChangeText={setCreateBody}
                  />
                </View>
              </>
            )}

            {/* Date Range */}
            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Start Date</Text>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#6b7280"
                  value={createStartDate}
                  onChangeText={setCreateStartDate}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>End Date</Text>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#6b7280"
                  value={createEndDate}
                  onChangeText={setCreateEndDate}
                />
              </View>
            </View>

            {/* Time */}
            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Hour (0-23)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="9"
                  placeholderTextColor="#6b7280"
                  keyboardType="numeric"
                  value={createHour}
                  onChangeText={setCreateHour}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Minute (0-59)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  placeholderTextColor="#6b7280"
                  keyboardType="numeric"
                  value={createMinute}
                  onChangeText={setCreateMinute}
                />
              </View>
            </View>
          </ScrollView>

          {/* Modal Footer */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setIsCreateDialogOpen(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!createName.trim() || !createStartDate || !createEndDate) && styles.submitButtonDisabled,
              ]}
              onPress={handleCreate}
              disabled={
                !createName.trim() ||
                !createStartDate ||
                !createEndDate ||
                createScheduleMutation.isPending
              }
            >
              <Text style={styles.submitButtonText}>
                {createScheduleMutation.isPending ? "Creating..." : "Create Schedule"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#17181c",
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#17181c",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  loadingText: {
    marginTop: 16,
    color: "#9ca3af",
    fontSize: 14,
  },
  errorTitle: {
    color: "#ef4444",
    fontSize: 18,
    fontWeight: "bold",
  },
  errorMessage: {
    color: "#9ca3af",
    marginTop: 8,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: "#23262b",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#ffffff",
    fontWeight: "600",
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#00ced1",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  createButtonText: {
    color: "#17181c",
    fontWeight: "600",
    fontSize: 14,
  },

  // Empty State
  emptyCard: {
    backgroundColor: "#23262b",
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: "#374151",
  },
  emptyText: {
    color: "#9ca3af",
    textAlign: "center",
  },

  // Schedule Card
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

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: "#17181c",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalDescription: {
    color: "#9ca3af",
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#23262b",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#374151",
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: "#ffffff",
    fontSize: 16,
  },
  rowInputs: {
    flexDirection: "row",
    gap: 12,
  },
  typeSelector: {
    flexDirection: "row",
    gap: 8,
  },
  typeOption: {
    flex: 1,
    backgroundColor: "#23262b",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#374151",
    paddingVertical: 12,
    alignItems: "center",
  },
  typeOptionActive: {
    borderColor: "#00ced1",
    backgroundColor: "rgba(0, 206, 209, 0.1)",
  },
  typeOptionText: {
    color: "#9ca3af",
    fontSize: 14,
  },
  typeOptionTextActive: {
    color: "#00ced1",
    fontWeight: "600",
  },
  modalFooter: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#374151",
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#374151",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#ffffff",
    fontWeight: "600",
  },
  submitButton: {
    flex: 1,
    backgroundColor: "#00ced1",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: "#17181c",
    fontWeight: "600",
  },
});
