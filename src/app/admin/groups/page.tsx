"use client"

import { useState } from "react";
import {
    Flex,
    Heading,
    Text,
} from "@radix-ui/themes";

import { api } from "~/trpc/react";
import CreateGroupDialog from "~/app/components/admin/groups/dialog/CreateGroupDialog";
import EditGroupDialog from "~/app/components/admin/groups/dialog/EditGroupDialog";
import DeleteGroupDialog from "~/app/components/admin/groups/dialog/DeleteGroupDialog";
import GroupCardList from "~/app/components/admin/groups/GroupCardList";
import type { Group } from "@prisma/client";

const GroupManagement = () => {
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    // Fetch groups
    const { data: groups, isLoading, refetch } = api.group.getAll.useQuery();
    const { data: users } = api.user.getAll.useQuery();

    if (isLoading) {
        return (
            <Flex direction="column" align="center" justify="center" style={{ padding: "1rem", width: "100%" }}>
                <Text>Ładowanie gildii...</Text>
            </Flex>
        );
    }

    return (
        <Flex direction="column" gap={{ "initial": "1" }} style={{ marginTop: "0.5em" }}>
            {/* Header with Create Button */}
            <Flex justify="between" align="center">
                <Heading size={{ "initial": "1" }}>Zarządzanie Gildiami</Heading>
                <CreateGroupDialog
                    users={users ?? []}
                    refetch={refetch}
                />
            </Flex>

            {/* Groups Card List */}
            <GroupCardList
                groups={groups ?? []}
                setSelectedGroup={setSelectedGroup}
                setIsEditDialogOpen={setIsEditDialogOpen}
                setIsDeleteDialogOpen={setIsDeleteDialogOpen}
            />

            {/* Edit Dialog */}
            {selectedGroup && (
                <EditGroupDialog
                    group={selectedGroup}
                    users={users ?? []}
                    isEditDialogOpen={isEditDialogOpen}
                    setIsEditDialogOpen={setIsEditDialogOpen}
                    setSelectedGroup={setSelectedGroup}
                    refetch={refetch}
                />
            )}
            {/* Delete Dialog */}
            {selectedGroup && (
                <DeleteGroupDialog
                    selectedGroup={selectedGroup}
                    setSelectedGroupAction={setSelectedGroup}
                    refetch={refetch}
                    isDeleteDialogOpen={isDeleteDialogOpen}
                    setIsDeleteDialogOpen={setIsDeleteDialogOpen}
                />
            )}

        </Flex>
    );
}

export default GroupManagement;
