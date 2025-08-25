import { Flex, Card, Strong, Badge, Text, Skeleton } from "@radix-ui/themes";

import DeleteGroupDialog from "../admin/groups/dialog/DeleteGroupDialog";
import EditGroupDialog from "../admin/groups/dialog/EditGroupDialog";

const GroupCardListSkeleton = () => {
    const group = {
        id: "1",
        name: "Nazwa grupy",
        code: "GRUPA-1",
        organizer: {
            name: "Jan Kowalski",
            email: "jan.kowalski@example.com"
        },
        _count: {
            members: 5
        },
        coins: 100
    }
    return (
        <Flex direction="column" justify="center">
            <Card size={{ "initial": "1", "xs": "2", "sm": "3" }} style={{ width: "100%" }}>
                <Flex direction="column" gap={{ "initial": "1" }}>
                    <Flex justify="between" align="center">
                        <Skeleton loading={true}><Strong>{group.name}</Strong></Skeleton>
                    </Flex>
                    <Skeleton loading={true}><Text size={{ "initial": "1", "xs": "2", "sm": "3" }} style={{ opacity: 0.7 }}>
                        Przypisany: {(group.organizer.name ?? group.organizer.email) ?? "Nieznany"}
                    </Text></Skeleton>
                    <Flex justify="between" align="center">
                        <Skeleton loading={true}><Badge variant="soft" color="green">
                            {group._count.members} członków
                        </Badge></Skeleton>
                        <Skeleton loading={true}><Badge variant="soft" color="gold">
                            💰 {group.coins} monet
                        </Badge></Skeleton>
                    </Flex>
                    <Flex gap={{ "initial": "1" }} justify="end">
                        <Skeleton loading={true}>
                            <EditGroupDialog
                                selectedGroupId={group.id}
                            /></Skeleton>
                        <Skeleton loading={true}><DeleteGroupDialog
                            selectedGroupId={group.id}
                        /></Skeleton>
                    </Flex>
                </Flex>
            </Card>
        </Flex>
    );
}

export default GroupCardListSkeleton;
