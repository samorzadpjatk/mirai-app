import { Ionicons } from "@expo/vector-icons";
import { XStack, Text, Button } from "@mirai-app/ui";

interface NotificationsHeaderProps {
  title?: string;
  buttonLabel?: string;
  onCreate: () => void;
}

export function NotificationsHeader({
  title = "Notification Schedules",
  buttonLabel = "Create",
  onCreate,
}: NotificationsHeaderProps) {
  return (
    <XStack justifyContent="space-between" alignItems="center">
      <Text fontSize={24} fontWeight="bold" color="#ffffff">
        {title}
      </Text>
      <Button
        onPress={onCreate}
        flexDirection="row"
        alignItems="center"
        backgroundColor="#00ced1"
        paddingHorizontal={12}
        paddingVertical={8}
        borderRadius={8}
        gap={4}
      >
        <Ionicons name="add" size={16} color="#17181c" />
        <Text color="#17181c" fontWeight="600" fontSize={14}>
          {buttonLabel}
        </Text>
      </Button>
    </XStack>
  );
}
