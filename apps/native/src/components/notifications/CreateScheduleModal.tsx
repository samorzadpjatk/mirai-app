import { orpc } from "@mirai-app/orpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import {
  AppModalFooter,
  AppModalShell,
  FormField,
  SegmentedOption,
  ThemedTextInput,
} from "~/components/common/ui";
import { useTrips } from "~/hooks/trips";
import { spacing } from "~/styles";
import { useTripTheme } from "~/theme/TripThemeProvider";

interface CreateScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function canSubmitSchedule(
  createName: string,
  createStartDate: string,
  createEndDate: string,
  createType: "custom" | "ranking",
  createTripId: string,
): boolean {
  return (
    createName.trim().length > 0 &&
    createStartDate.length > 0 &&
    createEndDate.length > 0 &&
    (createType !== "ranking" || !!createTripId)
  );
}

export function isScheduleSubmitDisabled(
  createName: string,
  createStartDate: string,
  createEndDate: string,
  createType: "custom" | "ranking",
  createTripId: string,
  isPending: boolean,
): boolean {
  return (
    !canSubmitSchedule(createName, createStartDate, createEndDate, createType, createTripId) ||
    isPending
  );
}

export function buildScheduleInput(
  createName: string,
  createType: "custom" | "ranking",
  createTripId: string,
  createTitle: string,
  createBody: string,
  createStartDate: string,
  createEndDate: string,
  createHour: string,
  createMinute: string,
) {
  return {
    name: createName.trim(),
    ...(createTripId ? { tripId: createTripId } : {}),
    notificationType: createType,
    notificationTitle: createType === "custom" ? createTitle : "",
    notificationBody: createType === "custom" ? createBody : "",
    startDate: new Date(createStartDate),
    endDate: new Date(createEndDate),
    hour: Number.parseInt(createHour, 10),
    minute: Number.parseInt(createMinute, 10),
    isActive: true,
  };
}

export function CreateScheduleModal({ isOpen, onClose, onCreated }: CreateScheduleModalProps) {
  const queryClient = useQueryClient();
  const { palette } = useTripTheme();
  const { trips, hasNextPage, isFetchingNextPage, fetchNextPage } = useTrips();

  const [createName, setCreateName] = useState("");
  const [createType, setCreateType] = useState<"custom" | "ranking">("custom");
  const [createTripId, setCreateTripId] = useState<string>("");
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
      setCreateTripId("");
    }, 0);
    return () => clearTimeout(id);
  }, [isOpen]);

  useEffect(() => {
    if (createType === "ranking" && !createTripId && trips.length > 0) {
      const id = setTimeout(() => {
        setCreateTripId(trips[0]?.id ?? "");
      }, 0);
      return () => clearTimeout(id);
    }
    return;
  }, [createTripId, createType, trips]);

  const createScheduleMutation = useMutation(
    orpc.notificationSchedule.create.mutationOptions({
      onSuccess: async () => {
        // Invalidate schedules so list refreshes without parent needing to refetch
        await queryClient.invalidateQueries({
          queryKey: orpc.notificationSchedule.getAll.queryOptions({ input: {} }).queryKey,
        });
        onCreated?.();
        onClose();
        setCreateName("");
        setCreateType("custom");
        setCreateTripId("");
        setCreateTitle("");
        setCreateBody("");
        setCreateStartDate("");
        setCreateEndDate("");
        setCreateHour("9");
        setCreateMinute("0");
      },
      onError: () => {
        // TODO: Add Sentry crash reporting for production errors
      },
    }),
  );

  const isSubmitDisabled = isScheduleSubmitDisabled(
    createName,
    createStartDate,
    createEndDate,
    createType,
    createTripId,
    createScheduleMutation.isPending,
  );

  const handleSelectType = (type: "custom" | "ranking") => {
    setCreateType(type);
    setCreateTripId(type === "ranking" ? (trips[0]?.id ?? "") : "");
  };

  const handleSubmit = () => {
    if (canSubmitSchedule(createName, createStartDate, createEndDate, createType, createTripId)) {
      createScheduleMutation.mutate(
        buildScheduleInput(
          createName,
          createType,
          createTripId,
          createTitle,
          createBody,
          createStartDate,
          createEndDate,
          createHour,
          createMinute,
        ),
      );
    }
  };

  return (
    <AppModalShell
      visible={isOpen}
      title="Create Notification Schedule"
      onClose={onClose}
      variant="pageSheet"
    >
      <ScrollView testID="schedule-modal-scrollview" style={{ padding: spacing.lg }}>
        <Text style={{ color: palette.textSecondary, marginBottom: spacing.lg }}>
          Schedule a notification to be sent at specific times
        </Text>

        <FormField label="Schedule Name" required={true}>
          <ThemedTextInput
            placeholder="E.g., Daily Ranking Update"
            value={createName}
            onChangeText={setCreateName}
          />
        </FormField>

        <FormField label="Notification Type">
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <SegmentedOption
              label="Custom Message"
              selected={createType === "custom"}
              onPress={() => handleSelectType("custom")}
            />
            <SegmentedOption
              label="Ranking Update"
              selected={createType === "ranking"}
              onPress={() => handleSelectType("ranking")}
            />
          </View>
        </FormField>

        {createType === "custom" && (
          <>
            <FormField label="Notification Title" required={true}>
              <ThemedTextInput
                placeholder="Title"
                value={createTitle}
                onChangeText={setCreateTitle}
              />
            </FormField>

            <FormField label="Notification Body" required={true}>
              <ThemedTextInput
                placeholder="Message content"
                value={createBody}
                onChangeText={setCreateBody}
              />
            </FormField>
          </>
        )}

        {createType === "ranking" && (
          <FormField label="Trip" required={true}>
            {trips.length === 0 ? (
              <Text style={{ color: palette.textSecondary }}>(No trips available)</Text>
            ) : (
              <View style={{ flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" }}>
                {trips.map((trip) => (
                  <SegmentedOption
                    key={trip.id}
                    label={trip.name}
                    selected={createTripId === trip.id}
                    onPress={() => setCreateTripId(trip.id)}
                    style={{ flexBasis: "45%" }}
                  />
                ))}

                {hasNextPage && (
                  <TouchableOpacity
                    style={{
                      flexBasis: "45%",
                      borderRadius: spacing.sm,
                      borderWidth: 1,
                      borderColor: palette.primary,
                      paddingVertical: spacing.sm,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: palette.primaryOpacity10,
                    }}
                    onPress={() => {
                      void fetchNextPage();
                    }}
                    disabled={isFetchingNextPage}
                  >
                    {isFetchingNextPage ? (
                      <ActivityIndicator
                        testID="loading-indicator"
                        size="small"
                        color={palette.primary}
                      />
                    ) : (
                      <Text style={{ color: palette.primary, fontSize: 14, fontWeight: "600" }}>
                        Load more trips
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            )}
          </FormField>
        )}

        <View style={{ flexDirection: "row", gap: spacing.md }}>
          <FormField label="Start Date" required={true} style={{ flex: 1 }}>
            <ThemedTextInput
              placeholder="YYYY-MM-DD"
              value={createStartDate}
              onChangeText={setCreateStartDate}
            />
          </FormField>
          <FormField label="End Date" required={true} style={{ flex: 1 }}>
            <ThemedTextInput
              placeholder="YYYY-MM-DD"
              value={createEndDate}
              onChangeText={setCreateEndDate}
            />
          </FormField>
        </View>

        <View style={{ flexDirection: "row", gap: spacing.md }}>
          <FormField label="Hour (0-23)" required={true} style={{ flex: 1 }}>
            <ThemedTextInput
              placeholder="9"
              keyboardType="numeric"
              value={createHour}
              onChangeText={setCreateHour}
            />
          </FormField>
          <FormField label="Minute (0-59)" required={true} style={{ flex: 1 }}>
            <ThemedTextInput
              placeholder="0"
              keyboardType="numeric"
              value={createMinute}
              onChangeText={setCreateMinute}
            />
          </FormField>
        </View>
      </ScrollView>
      <AppModalFooter
        primaryLabel={createScheduleMutation.isPending ? "Creating..." : "Create Schedule"}
        onPrimary={handleSubmit}
        isPrimaryLoading={createScheduleMutation.isPending}
        isPrimaryDisabled={isSubmitDisabled}
        secondaryLabel="Cancel"
        onSecondary={onClose}
      />
    </AppModalShell>
  );
}
