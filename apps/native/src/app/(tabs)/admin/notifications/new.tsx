import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@integral-2025-app/trpc/client";
import { Ionicons } from "@expo/vector-icons";
import { AdminHeader } from "~/components/admin/AdminHeader";
import { useAppSafeAreaInsets } from "~/contexts/SafeAreaInsetsContext";
import { borderRadius, colors, spacing, typography } from "~/styles";

type DeliveryType = "instant" | "scheduled_once" | "recurring_daily";
type AudienceType = "all" | "group";

const AUDIENCE_MODE_PARAM = "__audience";
const AUDIENCE_GROUP_PARAM = "__groupId";
const DEFAULT_NOTIFICATION_URL = "/alerts";

function parseTime(value: string): { hour: number; minute: number } {
  const [hourRaw, minuteRaw] = value.trim().split(":");
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
    throw new Error("Invalid time format");
  }

  return { hour, minute };
}

function parseDate(value: string): Date {
  const [yearRaw, monthRaw, dayRaw] = value.trim().split("-");
  const year = Number.parseInt(yearRaw ?? "", 10);
  const month = Number.parseInt(monthRaw ?? "", 10);
  const day = Number.parseInt(dayRaw ?? "", 10);

  if (
    Number.isNaN(year) ||
    Number.isNaN(month) ||
    Number.isNaN(day) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    throw new Error("Invalid date format");
  }

  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid date");
  }

  return date;
}

function formatDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildNotificationUrl(audience: AudienceType, groupId?: string): string {
  const parsed = new URL(DEFAULT_NOTIFICATION_URL, "https://integral.local");
  parsed.searchParams.set(AUDIENCE_MODE_PARAM, audience);

  if (audience === "group" && groupId) {
    parsed.searchParams.set(AUDIENCE_GROUP_PARAM, groupId);
  }

  return `${parsed.pathname}${parsed.search}`;
}

function getNextDailyOccurrence(hour: number, minute: number): Date {
  const now = new Date();
  const candidate = new Date(now);
  candidate.setHours(hour, minute, 0, 0);

  const minimumDate = new Date(now.getTime() + 5 * 60 * 1000);
  if (candidate < minimumDate) {
    candidate.setDate(candidate.getDate() + 1);
  }

  return toUTC(candidate);
}

function combineDateAndTime(date: Date, hour: number, minute: number): Date {
  const combined = new Date(date);
  combined.setHours(hour, minute, 0, 0);
  return toUTC(combined);
}

function toUTC(date: Date): Date {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000);
}

const placeholderLegend = [
  { key: "<nazwa-grupy>", description: "Nazwa grupy użytkownika" },
  { key: "<miejsce-w-rankingu>", description: "Pozycja grupy w rankingu" },
  {
    key: "<liczba-aktywnych-wyzwan>",
    description: "Liczba aktywnych wyzwań w wycieczce",
  },
  { key: "<nazwa-wycieczki>", description: "Nazwa aktualnej wycieczki" },
  { key: "<liczba-grup>", description: "Liczba grup w wycieczce" },
  { key: "<liczba-czlonkow-grupy>", description: "Liczba członków grupy" },
  { key: "<data-dzisiaj>", description: "Bieżąca data (format PL)" },
  { key: "<godzina-teraz>", description: "Bieżąca godzina (format PL)" },
];

export default function AdminCreateNotificationScreen() {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const insets = useAppSafeAreaInsets();
  const params = useLocalSearchParams<{ tripId?: string | string[] }>();
  const tripId =
    typeof params.tripId === "string" ? params.tripId : params.tripId?.[0] ?? "";

  const [deliveryType, setDeliveryType] = useState<DeliveryType>("instant");
  const [audienceType, setAudienceType] = useState<AudienceType>("all");
  const [groupId, setGroupId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [scheduleDate, setScheduleDate] = useState<string>(
    formatDateInput(new Date(Date.now() + 24 * 60 * 60 * 1000)),
  );
  const [scheduleTime, setScheduleTime] = useState<string>("13:00");

  const groupsQuery = useQuery({
    ...trpc.group.getAllNames.queryOptions({ tripId }),
    enabled: !!tripId,
  });

  const groups = groupsQuery.data ?? [];

  const schedulesQueryOptions = trpc.notificationSchedule.getAll.queryOptions({
    ...(tripId ? { filter: { tripId } } : {}),
    pagination: {
      limit: 100,
      offset: 0,
    },
  });

  const sentNotificationsQueryOptions = trpc.notifications.getAll.queryOptions(
    tripId ? { tripId } : undefined,
  );

  const createScheduleMutation = useMutation(
    trpc.notificationSchedule.create.mutationOptions(),
  );
  const sendToAllMutation = useMutation(trpc.notifications.sendToAll.mutationOptions());
  const sendToGroupMutation = useMutation(trpc.notifications.sendToGroup.mutationOptions());

  const isSubmitting =
    createScheduleMutation.isPending ||
    sendToAllMutation.isPending ||
    sendToGroupMutation.isPending;

  const selectedGroupName = useMemo(
    () => groups.find((group) => group.id === groupId)?.name,
    [groups, groupId],
  );

  const refreshAdminNotificationLists = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: schedulesQueryOptions.queryKey,
      }),
      queryClient.invalidateQueries({
        queryKey: sentNotificationsQueryOptions.queryKey,
      }),
    ]);
  };

  const submit = async () => {
    if (!tripId) {
      Alert.alert("Error", "Trip context is required.");
      return;
    }

    const normalizedTitle = title.trim();
    const normalizedBody = body.trim();
    if (!normalizedTitle || !normalizedBody) {
      Alert.alert("Validation", "Title and description are required.");
      return;
    }

    if (audienceType === "group" && !groupId) {
      Alert.alert("Validation", "Select a target group.");
      return;
    }

    const notificationUrl = buildNotificationUrl(audienceType, groupId);

    try {
      if (deliveryType === "instant") {
        if (audienceType === "all") {
          await sendToAllMutation.mutateAsync({
            tripId,
            title: normalizedTitle,
            body: normalizedBody,
            url: notificationUrl,
          });
        } else {
          await sendToGroupMutation.mutateAsync({
            tripId,
            groupId,
            title: normalizedTitle,
            body: normalizedBody,
            url: notificationUrl,
          });
        }

        await refreshAdminNotificationLists();
        Alert.alert("Success", "Notification sent instantly.");
        router.back();
        return;
      }

      const { hour, minute } = parseTime(scheduleTime);
      const now = new Date();
      const endDate = new Date(now);
      endDate.setFullYear(endDate.getFullYear() + 1);
      const endDateUtc = toUTC(endDate);

      if (deliveryType === "recurring_daily") {
        const startDate = getNextDailyOccurrence(hour, minute);

        await createScheduleMutation.mutateAsync({
          tripId,
          name:
            audienceType === "group"
              ? `Daily (${selectedGroupName ?? "Group"}): ${normalizedTitle}`
              : `Daily (All): ${normalizedTitle}`,
          notificationType: "custom",
          notificationTitle: normalizedTitle,
          notificationBody: normalizedBody,
          notificationUrl,
          startDate,
          endDate: endDateUtc,
          hour,
          minute,
          isActive: true,
        });

        await refreshAdminNotificationLists();
        Alert.alert("Success", "Recurring daily notification created.");
        router.back();
        return;
      }

      const parsedDate = parseDate(scheduleDate);
      const startDate = combineDateAndTime(parsedDate, hour, minute);
      const minimumDate = new Date(Date.now() + 5 * 60 * 1000);
      if (startDate < minimumDate) {
        Alert.alert(
          "Validation",
          "One-time schedule must be at least 5 minutes in the future.",
        );
        return;
      }
      const oneTimeEndDate = new Date(startDate.getTime() + 2 * 60 * 1000);
      const oneTimeEndDateUtc = toUTC(oneTimeEndDate);

      await createScheduleMutation.mutateAsync({
        tripId,
        name:
          audienceType === "group"
            ? `One-time (${selectedGroupName ?? "Group"}): ${normalizedTitle}`
            : `One-time (All): ${normalizedTitle}`,
        notificationType: "custom",
        notificationTitle: normalizedTitle,
        notificationBody: normalizedBody,
        notificationUrl,
        startDate,
        endDate: oneTimeEndDateUtc,
        hour,
        minute,
        isActive: true,
      });

      await refreshAdminNotificationLists();
      Alert.alert("Success", "One-time scheduled notification created.");
      router.back();
    } catch (error) {
      console.error("Failed to create/send notification", error);
      Alert.alert("Error", "Operation failed. Check input values and try again.");
    }
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: spacing.xl, paddingBottom: Math.max(insets.bottom, spacing.lg) },
      ]}
    >
      <StatusBar style="light" />

      <AdminHeader
        title="Create Notification"
        subtitle="Instant, one-time schedule, or recurring daily"
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery type</Text>
          <View style={styles.segmentRow}>
            {[
              { key: "instant", label: "Instant" },
              { key: "scheduled_once", label: "Scheduled (one-time)" },
              { key: "recurring_daily", label: "Recurring (daily)" },
            ].map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.segmentButton,
                  deliveryType === option.key && styles.segmentButtonActive,
                ]}
                onPress={() => setDeliveryType(option.key as DeliveryType)}
              >
                <Text
                  style={[
                    styles.segmentButtonText,
                    deliveryType === option.key && styles.segmentButtonTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Audience</Text>
          <View style={styles.segmentRow}>
            {[
              { key: "all", label: "All users" },
              { key: "group", label: "Specific group" },
            ].map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.segmentButton,
                  audienceType === option.key && styles.segmentButtonActive,
                ]}
                onPress={() => setAudienceType(option.key as AudienceType)}
              >
                <Text
                  style={[
                    styles.segmentButtonText,
                    audienceType === option.key && styles.segmentButtonTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {audienceType === "group" ? (
            <View style={styles.groupList}>
              {groupsQuery.isLoading ? (
                <View style={styles.loadingInline}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.loadingInlineText}>Loading groups...</Text>
                </View>
              ) : groups.length === 0 ? (
                <Text style={styles.helperText}>No groups available for selected trip.</Text>
              ) : (
                groups.map((group) => (
                  <TouchableOpacity
                    key={group.id}
                    style={[
                      styles.groupButton,
                      groupId === group.id && styles.groupButtonActive,
                    ]}
                    onPress={() => setGroupId(group.id)}
                  >
                    <Text
                      style={[
                        styles.groupButtonText,
                        groupId === group.id && styles.groupButtonTextActive,
                      ]}
                    >
                      {group.name}
                    </Text>
                    {groupId === group.id ? (
                      <Ionicons name="checkmark-circle" size={18} color={colors.white} />
                    ) : null}
                  </TouchableOpacity>
                ))
              )}
            </View>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Message</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Title"
            placeholderTextColor={colors.textSecondary}
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            value={body}
            onChangeText={setBody}
            placeholder="Description"
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={4}
          />
        </View>

        {deliveryType === "scheduled_once" ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>One-time schedule</Text>
            <TextInput
              style={styles.input}
              value={scheduleDate}
              onChangeText={setScheduleDate}
              placeholder="Date (YYYY-MM-DD)"
              placeholderTextColor={colors.textSecondary}
            />
            <TextInput
              style={styles.input}
              value={scheduleTime}
              onChangeText={setScheduleTime}
              placeholder="Time (HH:MM)"
              placeholderTextColor={colors.textSecondary}
            />
            <Text style={styles.helperText}>
              Notification will be sent once at the selected date and time.
            </Text>
          </View>
        ) : null}

        {deliveryType === "recurring_daily" ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recurring schedule</Text>
            <TextInput
              style={styles.input}
              value={scheduleTime}
              onChangeText={setScheduleTime}
              placeholder="Daily time (HH:MM)"
              placeholderTextColor={colors.textSecondary}
            />
            <Text style={styles.helperText}>
              Notification will run daily at the selected time.
            </Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Placeholder legend</Text>
          <Text style={styles.helperText}>
            Placeholders can be used in title and description.
          </Text>
          <View style={styles.legendList}>
            {placeholderLegend.map((item) => (
              <View key={item.key} style={styles.legendItem}>
                <Text style={styles.legendKey}>{item.key}</Text>
                <Text style={styles.legendDesc}>{item.description}</Text>
              </View>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={() => void submit()}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={styles.submitButtonText}>Create / Send</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  section: {
    backgroundColor: colors.cardDark,
    borderWidth: 1,
    borderColor: colors.borderWhite5,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.base,
    fontWeight: typography.medium,
    color: colors.white,
  },
  segmentRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  segmentButton: {
    backgroundColor: colors.backgroundDark,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.borderDark,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  segmentButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  segmentButtonText: {
    color: colors.textSecondary,
    fontSize: typography.sm,
    fontWeight: typography.medium,
  },
  segmentButtonTextActive: {
    color: colors.white,
  },
  input: {
    backgroundColor: colors.backgroundDark,
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: borderRadius.md,
    color: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.base,
  },
  textArea: {
    minHeight: 110,
    textAlignVertical: "top",
  },
  helperText: {
    color: colors.textSecondary,
    fontSize: typography.sm,
  },
  groupList: {
    gap: spacing.xs,
  },
  groupButton: {
    backgroundColor: colors.backgroundDark,
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  groupButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  groupButtonText: {
    color: colors.white,
    fontSize: typography.base,
  },
  groupButtonTextActive: {
    color: colors.white,
    fontWeight: typography.medium,
  },
  loadingInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  loadingInlineText: {
    color: colors.textSecondary,
    fontSize: typography.sm,
  },
  legendList: {
    gap: spacing.xs,
  },
  legendItem: {
    backgroundColor: colors.backgroundDark,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderDark,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  legendKey: {
    color: colors.white,
    fontSize: typography.sm,
    fontWeight: typography.medium,
  },
  legendDesc: {
    color: colors.textSecondary,
    fontSize: typography.sm,
  },
  submitButton: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: typography.base,
    fontWeight: typography.medium,
  },
});
