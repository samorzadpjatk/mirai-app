import { XStack, YStack, Text, Card } from "@mirai-app/ui";
import { Ionicons } from "@expo/vector-icons";
import type { NotificationItem } from "~/types/notifications";

interface NotificationCardProps {
  notification: NotificationItem;
  timeLabel: string;
}

export function NotificationCard({
  notification,
  timeLabel,
}: NotificationCardProps) {
  return (
    <Card
      flexDirection="row"
      backgroundColor="rgba(23, 24, 28, 0.8)"
      borderRadius="$6"
      padding="$4"
      borderWidth={1}
      borderColor="rgba(255, 255, 255, 0.05)"
      gap="$3"
    >
      <YStack
        width={40}
        height={40}
        borderRadius="$3"
        backgroundColor="rgba(0, 206, 209, 0.1)"
        alignItems="center"
        justifyContent="center"
      >
        <Ionicons name="notifications" size={20} color="#00ced1" />
      </YStack>
      <YStack flex={1}>
        <Text fontSize="$4" fontWeight="bold" color="white" marginBottom="$1">
          {notification.title}
        </Text>
        <Text fontSize="$3" color="#9ca3af" marginBottom="$2" lineHeight={20}>
          {notification.body}
        </Text>
        <XStack
          justifyContent="space-between"
          alignItems="center"
          flexWrap="wrap"
          gap="$1"
        >
          {notification.createdBy && (
            <Text fontSize="$2" color="#00ced1">
              From: {notification.createdBy.firstName}{" "}
              {notification.createdBy.lastName}
            </Text>
          )}
          <Text fontSize="$2" color="#9ca3af">
            {timeLabel}
          </Text>
        </XStack>
      </YStack>
    </Card>
  );
}
