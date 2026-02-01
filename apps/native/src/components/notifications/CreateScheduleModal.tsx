import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
} from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useTRPC } from "@integral-2025-app/trpc/client";

interface CreateScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function CreateScheduleModal({
  isOpen,
  onClose,
  onCreated,
}: CreateScheduleModalProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: tripsData } = useQuery(trpc.trip.getAll.queryOptions());
  const trips = useMemo(() => tripsData ?? [], [tripsData]);

  const [createName, setCreateName] = useState("");
  const [createType, setCreateType] = useState<"custom" | "ranking">("custom");
  const [createTripId, setCreateTripId] = useState<string | null>(null);
  const [createTitle, setCreateTitle] = useState("");
  const [createBody, setCreateBody] = useState("");
  const [createStartDate, setCreateStartDate] = useState("");
  const [createEndDate, setCreateEndDate] = useState("");
  const [createHour, setCreateHour] = useState("9");
  const [createMinute, setCreateMinute] = useState("0");

  useEffect(() => {
    if (!isOpen) return;
    const id = setTimeout(() => {
      setCreateType("custom");
      setCreateTripId(null);
    }, 0);
    return () => clearTimeout(id);
  }, [isOpen]);

  useEffect(() => {
    if (createType === "ranking" && !createTripId && trips.length > 0) {
      const id = setTimeout(() => {
        setCreateTripId(trips[0]?.id ?? null);
      }, 0);
      return () => clearTimeout(id);
    }
    return;
  }, [createTripId, createType, trips]);

  const createScheduleMutation = useMutation(
    trpc.notificationSchedule.create.mutationOptions({
      onSuccess: async () => {
        // Invalidate schedules so list refreshes without parent needing to refetch
        await queryClient.invalidateQueries({
          queryKey: trpc.notificationSchedule.getAll.queryOptions().queryKey,
        });
        onCreated?.();
        onClose();
        setCreateName("");
        setCreateType("custom");
        setCreateTripId(null);
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

  const isSubmitDisabled =
    !createName.trim() ||
    !createStartDate ||
    !createEndDate ||
    (createType === "ranking" && !createTripId) ||
    createScheduleMutation.isPending;

  const handleSubmit = () => {
    if (
      createName.trim() &&
      createStartDate &&
      createEndDate &&
      (createType !== "ranking" || createTripId)
    ) {
      createScheduleMutation.mutate({
        name: createName.trim(),
        ...(createTripId ? { tripId: createTripId } : {}),
        notificationType: createType,
        notificationTitle: createType === "custom" ? createTitle : undefined,
        notificationBody: createType === "custom" ? createBody : undefined,
        startDate: new Date(createStartDate),
        endDate: new Date(createEndDate),
        hour: parseInt(createHour, 10),
        minute: parseInt(createMinute, 10),
        isActive: true,
      });
    }
  };

  const handleSelectType = (type: "custom" | "ranking") => {
    setCreateType(type);
    setCreateTripId(type === "ranking" ? (trips[0]?.id ?? null) : null);
  };

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Create Notification Schedule</Text>
          <TouchableOpacity onPress={onClose}>
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
                style={[
                  styles.typeOption,
                  createType === "custom" && styles.typeOptionActive,
                ]}
                onPress={() => handleSelectType("custom")}
              >
                <Text
                  style={[
                    styles.typeOptionText,
                    createType === "custom" && styles.typeOptionTextActive,
                  ]}
                >
                  Custom Message
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeOption,
                  createType === "ranking" && styles.typeOptionActive,
                ]}
                onPress={() => handleSelectType("ranking")}
              >
                <Text
                  style={[
                    styles.typeOptionText,
                    createType === "ranking" && styles.typeOptionTextActive,
                  ]}
                >
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

          {createType === "ranking" && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Trip</Text>
              {trips.length === 0 ? (
                <Text style={styles.emptyTripsText}>(No trips available)</Text>
              ) : (
                <View style={styles.typeSelector}>
                  {trips.map((trip) => (
                    <TouchableOpacity
                      key={trip.id}
                      style={[
                        styles.typeOption,
                        createTripId === trip.id && styles.typeOptionActive,
                      ]}
                      onPress={() => setCreateTripId(trip.id)}
                    >
                      <Text
                        style={[
                          styles.typeOptionText,
                          createTripId === trip.id &&
                            styles.typeOptionTextActive,
                        ]}
                      >
                        {trip.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
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
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.submitButton,
              isSubmitDisabled && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={isSubmitDisabled || createScheduleMutation.isPending}
          >
            <Text style={styles.submitButtonText}>
              {createScheduleMutation.isPending
                ? "Creating..."
                : "Create Schedule"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
  emptyTripsText: {
    color: "#9ca3af",
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
