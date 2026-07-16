import { Ionicons } from "@expo/vector-icons";
import { orpc } from "@mirai-app/orpc/client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AdminHeader } from "~/components/admin/AdminHeader";
import { DeckBackground } from "~/components/common/DeckBackground";
import { PrimaryLoadingButton } from "~/components/common/buttons/PrimaryLoadingButton";
import {
  DateTimePickerModal,
  FilterChip,
  FilterChipRow,
  FormField,
  ThemedTextInput,
} from "~/components/common/ui";
import { borderRadius, colors, spacing, typography } from "~/styles";
import { type ThemePalette, useThemedStyles, useTripTheme } from "~/theme/TripThemeProvider";

type DeliveryType = "instant" | "scheduled_once" | "recurring_daily";
type AudienceType = "all" | "group";
type ActivePicker = "date" | "time" | "datetime" | null;

const AUDIENCE_MODE_PARAM = "__audience";
const AUDIENCE_GROUP_PARAM = "__groupId";
const DEFAULT_NOTIFICATION_URL = "/alerts";

function buildInitialScheduleDateTime(): Date {
  const initial = new Date();
  initial.setDate(initial.getDate() + 1);
  initial.setHours(13, 0, 0, 0);
  return initial;
}

function formatDateLabel(date: Date): string {
  return new Intl.DateTimeFormat("pl-PL", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function formatTimeLabel(date: Date): string {
  return new Intl.DateTimeFormat("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function formatDateTimeLabel(date: Date): string {
  return `${formatDateLabel(date)} • ${formatTimeLabel(date)}`;
}

function mergePickedDate(base: Date, picked: Date): Date {
  const next = new Date(base);
  next.setFullYear(picked.getFullYear(), picked.getMonth(), picked.getDate());
  return next;
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

  return candidate;
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
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ tripId?: string | string[] }>();
  const tripId = typeof params.tripId === "string" ? params.tripId : (params.tripId?.[0] ?? "");
  const { palette } = useTripTheme();
  const styles = useThemedStyles(makeStyles);

  const [deliveryType, setDeliveryType] = useState<DeliveryType>("instant");
  const [audienceType, setAudienceType] = useState<AudienceType>("all");
  const [groupId, setGroupId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [scheduleDateTime, setScheduleDateTime] = useState<Date>(buildInitialScheduleDateTime);
  const [activePicker, setActivePicker] = useState<ActivePicker>(null);

  const groupsQuery = useQuery({
    ...orpc.group.getAllNames.queryOptions({ input: { tripId } }),
    enabled: !!tripId,
  });

  const groups = useMemo(() => groupsQuery.data ?? [], [groupsQuery.data]);

  const schedulesQueryOptions = orpc.notificationSchedule.getAll.queryOptions({
    input: {
      ...(tripId ? { filter: { tripId } } : {}),
      pagination: {
        limit: 100,
        offset: 0,
      },
    },
  });

  const sentNotificationsQueryOptions = orpc.notifications.getAll.queryOptions({
    input: tripId ? { tripId } : {},
  });

  const createScheduleMutation = useMutation(orpc.notificationSchedule.create.mutationOptions());
  const sendToAllMutation = useMutation(orpc.notifications.sendToAll.mutationOptions());
  const sendToGroupMutation = useMutation(orpc.notifications.sendToGroup.mutationOptions());

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

  const openPicker = (mode: Exclude<ActivePicker, null>) => {
    setActivePicker(mode);
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

      const hour = scheduleDateTime.getHours();
      const minute = scheduleDateTime.getMinutes();
      const now = new Date();
      const endDate = new Date(now);
      endDate.setFullYear(endDate.getFullYear() + 1);

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
          endDate,
          hour,
          minute,
          isActive: true,
        });

        await refreshAdminNotificationLists();
        Alert.alert("Success", "Recurring daily notification created.");
        router.back();
        return;
      }

      const startDate = new Date(scheduleDateTime);
      const minimumDate = new Date(Date.now() + 5 * 60 * 1000);
      if (startDate < minimumDate) {
        Alert.alert("Validation", "One-time schedule must be at least 5 minutes in the future.");
        return;
      }
      const oneTimeEndDate = new Date(startDate.getTime() + 2 * 60 * 1000);

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
        endDate: oneTimeEndDate,
        hour,
        minute,
        isActive: true,
      });

      await refreshAdminNotificationLists();
      Alert.alert("Success", "One-time scheduled notification created.");
      router.back();
    } catch {
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
      <DeckBackground />

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
          <FilterChipRow>
            {[
              { key: "instant", label: "Instant" },
              { key: "scheduled_once", label: "Scheduled (one-time)" },
              { key: "recurring_daily", label: "Recurring (daily)" },
            ].map((option) => (
              <FilterChip
                key={option.key}
                label={option.label}
                selected={deliveryType === option.key}
                onPress={() => setDeliveryType(option.key as DeliveryType)}
              />
            ))}
          </FilterChipRow>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Audience</Text>
          <FilterChipRow>
            {[
              { key: "all", label: "All users" },
              { key: "group", label: "Specific group" },
            ].map((option) => (
              <FilterChip
                key={option.key}
                label={option.label}
                selected={audienceType === option.key}
                onPress={() => setAudienceType(option.key as AudienceType)}
              />
            ))}
          </FilterChipRow>

          {audienceType === "group" ? (
            <View style={styles.groupList}>
              {groupsQuery.isLoading ? (
                <View style={styles.loadingInline}>
                  <ActivityIndicator size="small" color={palette.primary} />
                  <Text style={styles.loadingInlineText}>Loading groups...</Text>
                </View>
              ) : groups.length === 0 ? (
                <Text style={styles.helperText}>No groups available for selected trip.</Text>
              ) : (
                groups.map((group) => (
                  <TouchableOpacity
                    key={group.id}
                    style={[styles.groupButton, groupId === group.id && styles.groupButtonActive]}
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
          <FormField label="Title" required={true}>
            <ThemedTextInput value={title} onChangeText={setTitle} placeholder="Title" />
          </FormField>
          <FormField label="Description" required={true}>
            <ThemedTextInput
              value={body}
              onChangeText={setBody}
              placeholder="Description"
              multiline={true}
              numberOfLines={4}
              style={styles.textArea}
            />
          </FormField>
        </View>

        {deliveryType === "scheduled_once" ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>One-time schedule</Text>
            <TouchableOpacity style={styles.pickerButton} onPress={() => openPicker("datetime")}>
              <Text style={styles.pickerButtonText}>
                Date & time: {formatDateTimeLabel(scheduleDateTime)}
              </Text>
            </TouchableOpacity>
            <Text style={styles.helperText}>
              Notification will be sent once at the selected date and time.
            </Text>
          </View>
        ) : null}

        {deliveryType === "recurring_daily" ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recurring schedule</Text>
            <TouchableOpacity style={styles.pickerButton} onPress={() => openPicker("time")}>
              <Text style={styles.pickerButtonText}>
                Daily time: {formatTimeLabel(scheduleDateTime)}
              </Text>
            </TouchableOpacity>
            <Text style={styles.helperText}>Notification will run daily at the selected time.</Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Placeholder legend</Text>
          <Text style={styles.helperText}>Placeholders can be used in title and description.</Text>
          <View style={styles.legendList}>
            {placeholderLegend.map((item) => (
              <View key={item.key} style={styles.legendItem}>
                <Text style={styles.legendKey}>{item.key}</Text>
                <Text style={styles.legendDesc}>{item.description}</Text>
              </View>
            ))}
          </View>
        </View>

        <PrimaryLoadingButton
          label="Create / Send"
          isLoading={isSubmitting}
          onPress={() => void submit()}
          disabled={isSubmitting}
        />
      </ScrollView>

      <DateTimePickerModal
        visible={Boolean(activePicker)}
        value={scheduleDateTime}
        mode={activePicker === "datetime" ? "datetime" : (activePicker ?? "date")}
        onConfirm={(date) => {
          if (activePicker === "datetime") {
            setScheduleDateTime(date);
          } else if (activePicker === "time") {
            setScheduleDateTime(date);
          } else if (activePicker === "date") {
            const withDate = mergePickedDate(scheduleDateTime, date);
            setScheduleDateTime(withDate);
          }
          setActivePicker(null);
        }}
        onCancel={() => setActivePicker(null)}
      />
    </View>
  );
}

function makeStyles(palette: ThemePalette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundDark,
    },
    scroll: {
      flex: 1,
    },
    content: {
      paddingHorizontal: spacing.lg,
      paddingBottom: 96,
      gap: spacing.md,
    },
    section: {
      backgroundColor: palette.cardDark,
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
    helperText: {
      color: palette.textSecondary,
      fontSize: typography.sm,
    },
    textArea: {
      minHeight: 110,
      textAlignVertical: "top",
    },
    pickerButton: {
      backgroundColor: colors.backgroundDark,
      borderWidth: 1,
      borderColor: palette.borderDark,
      borderRadius: borderRadius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    pickerButtonText: {
      color: colors.white,
      fontSize: typography.base,
    },
    groupList: {
      gap: spacing.xs,
    },
    groupButton: {
      backgroundColor: colors.backgroundDark,
      borderWidth: 1,
      borderColor: palette.borderDark,
      borderRadius: borderRadius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    groupButtonActive: {
      backgroundColor: palette.primary,
      borderColor: palette.primary,
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
      color: palette.textSecondary,
      fontSize: typography.sm,
    },
    legendList: {
      gap: spacing.xs,
    },
    legendItem: {
      backgroundColor: colors.backgroundDark,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: palette.borderDark,
      padding: spacing.sm,
      gap: spacing.xs,
    },
    legendKey: {
      color: colors.white,
      fontSize: typography.sm,
      fontWeight: typography.medium,
    },
    legendDesc: {
      color: palette.textSecondary,
      fontSize: typography.sm,
    },
    pickerActionTextPrimary: {
      color: palette.primary,
      fontWeight: typography.bold,
    },
  });
}
