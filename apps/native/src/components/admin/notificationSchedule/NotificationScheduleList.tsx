import { Card, YStack, XStack, H3, Paragraph, Badge, Button } from "tamagui";
import { Suspense } from "react";

interface NotificationSchedule {
    id: string;
    title: string;
    message: string;
    scheduledFor: Date;
    sent: boolean;
}

interface NotificationScheduleListProps {
    schedules: NotificationSchedule[];
    onDelete?: (id: string) => void;
}

const NotificationScheduleList = ({ schedules, onDelete }: NotificationScheduleListProps) => {
    return (
        <Suspense fallback={<Paragraph>Loading...</Paragraph>}>
            <YStack gap="$4">
                <H3>Scheduled Notifications</H3>
                {schedules.map((schedule) => (
                    <Card key={schedule.id} bordered padding="$4">
                        <YStack gap="$2">
                            <XStack justifyContent="space-between" alignItems="center">
                                <Paragraph fontWeight="bold">{schedule.title}</Paragraph>
                                <Badge backgroundColor={schedule.sent ? "$green10" : "$yellow10"} color="$background">
                                    {schedule.sent ? "Sent" : "Pending"}
                                </Badge>
                            </XStack>
                            <Paragraph opacity={0.7}>{schedule.message}</Paragraph>
                            <Paragraph opacity={0.6}>
                                Scheduled: {schedule.scheduledFor.toLocaleString()}
                            </Paragraph>
                            {onDelete && (
                                <Button size="$2" theme="red" onPress={() => onDelete(schedule.id)}>
                                    Delete
                                </Button>
                            )}
                        </YStack>
                    </Card>
                ))}
            </YStack>
        </Suspense>
    );
};

export default NotificationScheduleList;
