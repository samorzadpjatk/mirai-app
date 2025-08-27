import { Flex } from "@radix-ui/themes";
import NotificationScheduleList from "~/components/admin/notificationSchedule/NotificationScheduleList";
import ManualTrigger from "~/components/admin/notificationSchedule/ManualTrigger";

export default function NotificationSchedulesPage() {
  return (
    <Flex direction="column" gap="4">
      <ManualTrigger />
      <NotificationScheduleList />
    </Flex>
  );
}
