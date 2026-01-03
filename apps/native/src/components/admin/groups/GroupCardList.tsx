import { YStack, Card, Paragraph, XStack, Spinner } from "tamagui";
import { Badge } from "../../Badge";
import { Suspense } from "react";
import EditGroupDialog from "./dialog/EditGroupDialog";
import DeleteGroupDialog from "./dialog/DeleteGroupDialog";
import GroupCardListSkeleton from "~/components/skelethons/GroupCardListSkelethon";

interface Group {
    id: string;
    name: string;
    coins: number;
    organizer: {
        name: string | null;
    };
    _count: {
        members: number;
    };
}

interface GroupCardListProps {
    groups: Group[];
    isLoading?: boolean;
    onRefresh?: () => void;
}

const GroupCardList = ({ groups, isLoading, onRefresh }: GroupCardListProps) => {
    if (isLoading) {
        return <GroupCardListSkeleton />;
    }

    return (
        <YStack justifyContent="center">
            <Suspense fallback={<GroupCardListSkeleton />}>
                {groups?.length === 0 && (
                    <Card padding="$4" bordered>
                        <Paragraph opacity={0.6}>
                            There are no Guilds in realm to display
                        </Paragraph>
                        <Paragraph opacity={0.5} marginTop="$2">
                            Forge your first guild and embark on your path of leadership
                        </Paragraph>
                    </Card>
                )}
                {groups?.map((group) => (
                    <Card key={group.id} bordered padding="$3" width="100%" marginBottom="$2">
                        <YStack gap="$2">
                            <XStack justifyContent="space-between" alignItems="center">
                                <Paragraph fontWeight="bold">{group.name}</Paragraph>
                                <XStack gap="$2" justifyContent="flex-end">
                                    <EditGroupDialog
                                        selectedGroupId={group.id}
                                        onRefresh={onRefresh}
                                    />
                                    <DeleteGroupDialog
                                        selectedGroupId={group.id}
                                        onRefresh={onRefresh}
                                    />
                                </XStack>
                            </XStack>
                            <Paragraph opacity={0.7}>
                                Assigned: {group.organizer.name ?? "Unknown"}
                            </Paragraph>
                            <XStack justifyContent="space-between" alignItems="center">
                                <Badge backgroundColor="$green10" color="$background">
                                    {group._count.members} companions
                                </Badge>
                                <Badge backgroundColor="$yellow10" color="$background">
                                    💰 {group.coins} coins
                                </Badge>
                            </XStack>
                        </YStack>
                    </Card>
                ))}
            </Suspense>
        </YStack>
    );
}

export default GroupCardList;
