import { Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useClient } from "urql";
import {
  useDeleteNotificationScheduleMutation,
  useToggleNotificationScheduleActiveMutation,
  useGetNotificationSchedulesQuery,
} from "@mirai-app/graphql-client";
import { Card, XStack, YStack, Text, Button } from "@mirai-app/ui";
import { formatRelativeTime, formatDate } from "~/utils/format";
import type { NotificationScheduleItem } from "~/types/notifications";

interface NotificationScheduleCardProps {
  schedule: NotificationScheduleItem;
}

export function NotificationScheduleCard({
  schedule,
}: NotificationScheduleCardProps) {
  const client = useClient();

  const [, deleteSchedule] = useMutation(
    useDeleteNotificationScheduleMutation.document,
  );
  const [, toggleSchedule] = useMutation(
    useToggleNotificationScheduleActiveMutation.document,
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
          onPress: async () => {
            const result = await deleteSchedule({ id: schedule.id });
            if (!result.error) {
              // Invalidate schedules so list refreshes
              await client.invalidate(
                useGetNotificationSchedulesQuery.document,
              );
            }
          },
        },
      ],
    );
  };

  const handleToggle = async () => {
    const result = await toggleSchedule({ id: schedule.id });
    if (!result.error) {
      // Invalidate schedules so list refreshes
      await client.invalidate(useGetNotificationSchedulesQuery.document);
    }
  };

  return (
    <Card
      backgroundColor="#23262b"
      borderRadius={12}
      padding={16}
      borderWidth={1}
      borderColor="#374151"
      gap={12}
    >
      <XStack justifyContent="space-between" alignItems="flex-start">
        <YStack flex={1}>
          <Text fontSize={18} fontWeight="bold" color="#ffffff">
            {schedule.name}
          </Text>
          <Text fontSize={12} color="#6b7280" marginTop={4}>
            Created by{" "}
            {schedule.createdBy
              ? `${schedule.createdBy.firstName ?? ""} ${schedule.createdBy.lastName ?? ""}`.trim()
              : "Unknown"}{" "}
            • {formatRelativeTime(schedule.createdAt)}
          </Text>
        </YStack>
        <XStack gap={8}>
          <Button
            onPress={handleToggle}
            chromeless
            width={36}
            height={36}
            borderRadius={8}
            backgroundColor="#374151"
            alignItems="center"
            justifyContent="center"
            padding={0}
          >
            <Ionicons
              name={schedule.isActive ? "notifications" : "notifications-off"}
              size={16}
              color="#9ca3af"
            />
          </Button>
          <Button
            onPress={handleDelete}
            chromeless
            width={36}
            height={36}
            borderRadius={8}
            backgroundColor="#374151"
            alignItems="center"
            justifyContent="center"
            padding={0}
          >
            <Ionicons name="trash" size={16} color="#9ca3af" />
          </Button>
        </XStack>
      </XStack>

      <XStack flexWrap="wrap" gap={8}>
        <YStack
          backgroundColor={
            schedule.isActive ? "rgba(0, 206, 209, 0.2)" : "#374151"
          }
          paddingHorizontal={8}
          paddingVertical={4}
          borderRadius={6}
        >
          <Text fontSize={12} color={schedule.isActive ? "#00ced1" : "#9ca3af"}>
            {schedule.isActive ? "Active" : "Inactive"}
          </Text>
        </YStack>
        <YStack
          backgroundColor="#374151"
          paddingHorizontal={8}
          paddingVertical={4}
          borderRadius={6}
        >
          <Text fontSize={12} color="#9ca3af">
            {schedule.notificationType}
          </Text>
        </YStack>
        {schedule?.trip?.name && (
          <YStack
            backgroundColor="#374151"
            paddingHorizontal={8}
            paddingVertical={4}
            borderRadius={6}
          >
            <Text fontSize={12} color="#9ca3af">
              {schedule.trip.name}
            </Text>
          </YStack>
        )}
        <YStack
          backgroundColor="#374151"
          paddingHorizontal={8}
          paddingVertical={4}
          borderRadius={6}
        >
          <Text fontSize={12} color="#9ca3af">
            {String(schedule.hour).padStart(2, "0")}:
            {String(schedule.minute).padStart(2, "0")}
          </Text>
        </YStack>
      </XStack>

      <YStack gap={4}>
        <Text fontSize={13} color="#9ca3af">
          Period: {formatDate(schedule.startDate)} -{" "}
          {formatDate(schedule.endDate)}
        </Text>
        {schedule.lastRun && (
          <Text fontSize={13} color="#9ca3af">
            Last run: {formatRelativeTime(schedule.lastRun)}
          </Text>
        )}
      </YStack>
    </Card>
  );
}
