import { useEffect, useState } from "react";
import { ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useMutation, useClient } from "urql";
import {
  useCreateNotificationScheduleMutation,
  useGetNotificationSchedulesQuery,
} from "@mirai-app/graphql-client";
import { useTrips } from "~/hooks/trips";
import { XStack, Text } from "@mirai-app/ui";
import { clientLogger } from "@mirai-app/shared";
import {
  AppModalShell,
  AppModalFooter,
  FormField,
  ThemedTextInput,
  SegmentedOption,
} from "~/components/common/ui";

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
  const client = useClient();
  const { trips, hasNextPage, isFetchingNextPage, fetchNextPage } = useTrips();

  const [createName, setCreateName] = useState("");
  const [createType, setCreateType] = useState<"custom" | "ranking">("custom");
  const [createTripId, setCreateTripId] = useState<string | null>(null);
  const [createTitle, setCreateTitle] = useState("");
  const [createBody, setCreateBody] = useState("");
  const [createStartDate, setCreateStartDate] = useState("");
  const [createEndDate, setCreateEndDate] = useState("");
  const [createHour, setCreateHour] = useState("9");
  const [createMinute, setCreateMinute] = useState("0");
  const [isCreating, setIsCreating] = useState(false);

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

  const [, createSchedule] = useMutation(
    useCreateNotificationScheduleMutation.document,
  );

  const isSubmitDisabled =
    !createName.trim() ||
    !createStartDate ||
    !createEndDate ||
    (createType === "ranking" && !createTripId) ||
    isCreating;

  const handleSubmit = async () => {
    if (
      createName.trim() &&
      createStartDate &&
      createEndDate &&
      (createType !== "ranking" || createTripId)
    ) {
      setIsCreating(true);
      const result = await createSchedule({
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

      if (!result.error) {
        // Invalidate schedules so list refreshes without parent needing to refetch
        await client.invalidate(useGetNotificationSchedulesQuery.document);
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
      } else {
        clientLogger.error("Error creating schedule:", result.error as Error);
      }
      setIsCreating(false);
    }
  };

  const handleSelectType = (type: "custom" | "ranking") => {
    setCreateType(type);
    setCreateTripId(type === "ranking" ? (trips[0]?.id ?? null) : null);
  };

  return (
    <AppModalShell
      visible={isOpen}
      title="Create Notification Schedule"
      onClose={onClose}
      variant="pageSheet"
    >
      <ScrollView style={{ padding: 24 }}>
        <Text color="#9ca3af" marginBottom={24}>
          Schedule a notification to be sent at specific times
        </Text>

        <FormField label="Schedule Name" required>
          <ThemedTextInput
            placeholder="E.g., Daily Ranking Update"
            value={createName}
            onChangeText={setCreateName}
          />
        </FormField>

        <FormField label="Notification Type">
          <XStack gap={8}>
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
          </XStack>
        </FormField>

        {createType === "custom" && (
          <>
            <FormField label="Notification Title" required>
              <ThemedTextInput
                placeholder="Title"
                value={createTitle}
                onChangeText={setCreateTitle}
              />
            </FormField>

            <FormField label="Notification Body" required>
              <ThemedTextInput
                placeholder="Message content"
                value={createBody}
                onChangeText={setCreateBody}
              />
            </FormField>
          </>
        )}

        {createType === "ranking" && (
          <FormField label="Trip" required>
            {trips.length === 0 ? (
              <Text color="#9ca3af">(No trips available)</Text>
            ) : (
              <XStack gap={8} flexWrap="wrap">
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
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: "#00ced1",
                      paddingVertical: 8,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "rgba(0, 206, 209, 0.1)",
                    }}
                    onPress={() => {
                      void fetchNextPage();
                    }}
                    disabled={isFetchingNextPage}
                  >
                    {isFetchingNextPage ? (
                      <ActivityIndicator size="small" color="#00ced1" />
                    ) : (
                      <Text color="#00ced1" fontSize={14} fontWeight="600">
                        Load more trips
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
              </XStack>
            )}
          </FormField>
        )}

        <XStack gap={16}>
          <FormField label="Start Date" required style={{ flex: 1 }}>
            <ThemedTextInput
              placeholder="YYYY-MM-DD"
              value={createStartDate}
              onChangeText={setCreateStartDate}
            />
          </FormField>
          <FormField label="End Date" required style={{ flex: 1 }}>
            <ThemedTextInput
              placeholder="YYYY-MM-DD"
              value={createEndDate}
              onChangeText={setCreateEndDate}
            />
          </FormField>
        </XStack>

        <XStack gap={16}>
          <FormField label="Hour (0-23)" required style={{ flex: 1 }}>
            <ThemedTextInput
              placeholder="9"
              keyboardType="numeric"
              value={createHour}
              onChangeText={setCreateHour}
            />
          </FormField>
          <FormField label="Minute (0-59)" required style={{ flex: 1 }}>
            <ThemedTextInput
              placeholder="0"
              keyboardType="numeric"
              value={createMinute}
              onChangeText={setCreateMinute}
            />
          </FormField>
        </XStack>
      </ScrollView>
      <AppModalFooter
        primaryLabel={isCreating ? "Creating..." : "Create Schedule"}
        onPrimary={handleSubmit}
        isPrimaryLoading={isCreating}
        isPrimaryDisabled={isSubmitDisabled}
        secondaryLabel="Cancel"
        onSecondary={onClose}
      />
    </AppModalShell>
  );
}
