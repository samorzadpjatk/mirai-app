import { Flex } from "@radix-ui/themes";
import ManualTrigger from "~/components/admin/notificationSchedule/ManualTrigger";
import NotificationScheduleList from "~/components/admin/notificationSchedule/NotificationScheduleList";

export default function NotificationSchedulesPage() {
  return (
    <Flex direction="column" gap="4">
      <ManualTrigger />
      <NotificationScheduleList />
    </Flex>
  );
}
