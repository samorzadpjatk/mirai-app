"use client";

import { useState } from "react";
import {
    Flex,
    Heading,
    Text,
} from "@radix-ui/themes";
import { api } from "~/trpc/react";
import type { Group, User } from "@prisma/client";
import AssignUserToGroupForm from "~/app/components/admin/users/dialog/AssignUserToGroupFormDialog";
import RemoveUserFromGroupFormDialog from "~/app/components/admin/users/dialog/RemoveUserFromGroupFormDialog";
import UserCardList from "~/app/components/admin/users/UserCardList";

export default function UserManagement() {
    const [selectedUser, setSelectedUser] = useState<User & { group: Group } | null>(null);
    const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
    const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);

    // Fetch data
    const { data: users, isLoading: usersLoading, refetch: refetchUsers } = api.user.getAll.useQuery();

    if (usersLoading) {
        return (
            <Flex direction="column" align="center" justify="center" style={{ minHeight: "400px" }}>
                <Text>Ładowanie użytkowników...</Text>
            </Flex>
        );
    }

    return (
        <Flex direction="column" gap="2" style={{ marginTop: "0.5em" }}>
            {/* Header */}
            <Flex gap={"2"} wrap={"wrap"} justify="between" align="center">
                <Heading size={{ "initial": "1" }}>Zarządzanie Użytkownikami</Heading>
                <Text size={{ "initial": "1" }} style={{ opacity: 0.7 }}>
                    Zarządzaj członkostwem w gildiach i uprawnieniami użytkowników
                </Text>
            </Flex>

            {/* Users CardList */}
            <UserCardList
                users={users}
                setSelectedUser={setSelectedUser}
                setIsAssignDialogOpen={setIsAssignDialogOpen}
                setIsRemoveDialogOpen={setIsRemoveDialogOpen}
                refetchUsers={refetchUsers}
            />

            {/* Assign to Group Dialog */}
            <AssignUserToGroupForm
                user={selectedUser}
                isAssignDialogOpen={isAssignDialogOpen}
                setIsAssignDialogOpen={setIsAssignDialogOpen}
                onMutationSuccess={async () => {
                    await refetchUsers();
                    setIsAssignDialogOpen(false);
                    setSelectedUser(null);
                }}
                onCancel={() => setIsAssignDialogOpen(false)}
            />


            {/* Remove from Group Dialog */}
            <RemoveUserFromGroupFormDialog
                isRemoveDialogOpen={isRemoveDialogOpen}
                setIsRemoveDialogOpen={setIsRemoveDialogOpen}
                selectedUser={selectedUser}
                onMutationSuccess={async () => {
                    await refetchUsers();
                    setIsRemoveDialogOpen(false);
                    setSelectedUser(null);
                }}
            />
        </Flex>
    );
}
