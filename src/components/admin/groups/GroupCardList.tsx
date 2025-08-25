import { Flex, Card, Strong, Badge, Text } from "@radix-ui/themes";
import { Suspense } from "react";
import { api } from "~/trpc/server";
import EditGroupDialog from "./dialog/EditGroupDialog";
import DeleteGroupDialog from "./dialog/DeleteGroupDialog";
import GroupCardListSkeleton from "~/components/skelethons/GroupCardListSkelethon";

const GroupCardList = async () => {
    const groups = await api.group.getGroupList();

    return (
        <Flex direction="column" justify="center">
            <Suspense fallback={<GroupCardListSkeleton />}>
                {groups?.length === 0 && (
                    <Card style={{ padding: "1rem" }}>
                        <Text size={{ "initial": "1", "xs": "2", "sm": "3" }} style={{ opacity: 0.6 }}>
                            Brak gildii do wyświetlenia
                        </Text><br />
                        <Text size={{ "initial": "1", "xs": "2", "sm": "3" }} style={{ opacity: 0.5 }}>
                            Utwórz pierwszą gildię, aby rozpocząć zarządzanie
                        </Text>
                    </Card>
                )}
                {groups?.map((group) => (
                    <Card key={group.id} size={{ "initial": "1", "xs": "2", "sm": "3" }} style={{ width: "100%" }}>
                        <Flex direction="column" gap={{ "initial": "1" }}>
                            <Flex justify="between" align="center">
                                <Strong>{group.name}</Strong>
                                <Flex gap={{ "initial": "1" }} justify="end">
                                    <EditGroupDialog
                                        selectedGroupId={group.id}
                                    />
                                    <DeleteGroupDialog
                                        selectedGroupId={group.id}
                                    />
                                </Flex>
                            </Flex>
                            <Text size={{ "initial": "1", "xs": "2", "sm": "3" }} style={{ opacity: 0.7 }}>
                                Przypisany: {(group.organizer.name ?? group.organizer.email) ?? "Nieznany"}
                            </Text>
                            <Flex justify="between" align="center">
                                <Badge variant="soft" color="green">
                                    {group._count.members} członków
                                </Badge>
                                <Badge variant="soft" color="gold">
                                    💰 {group.coins} monet
                                </Badge>
                            </Flex>

                        </Flex>
                    </Card>
                ))}
            </Suspense>
        </Flex>
    );
}

export default GroupCardList;
