"use client";

import { useState } from "react";
import {
    Card,
    Flex,
    Heading,
    Text,
    Button,
    Dialog,
    Badge,
    AlertDialog,
    Strong,
    DataList,
} from "@radix-ui/themes";
import { PersonIcon, PlusIcon, TrashIcon, StarIcon } from "@radix-ui/react-icons";
import { api } from "~/trpc/react";
import type { Group, User } from "@prisma/client";
import AssignUserToGroupForm from "../dialog/AssignUserToGroupFormDialog";

export default function UserManagement() {
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
    const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
    const [selectedGroupForRemoval, setSelectedGroupForRemoval] = useState<Group | null>(null);

    // Fetch data
    const { data: users, isLoading: usersLoading, refetch: refetchUsers } = api.user.getAll.useQuery();
    

    // Mutations
    const assignUserMutation = api.group.assignUserToGroup.useMutation({
        onSuccess: async () => {
            await refetchUsers();
            setIsAssignDialogOpen(false);
            setSelectedUser(null);
        },
    });

    const removeUserMutation = api.group.removeUserFromGroup.useMutation({
        onSuccess: async () => {
            await refetchUsers();
            setIsRemoveDialogOpen(false);
            setSelectedUser(null);
            setSelectedGroupForRemoval(null);
        },
    });

    const updateAdminStatusMutation = api.user.updateUserAdminStatus.useMutation({
        onSuccess: async () => {
            await refetchUsers();
        },
    });

    if (usersLoading) {
        return (
            <Flex direction="column" align="center" justify="center" style={{ minHeight: "400px" }}>
                <Text>Ładowanie użytkowników...</Text>
            </Flex>
        );
    }

    return (
        <Flex direction="column" gap="2" style={{marginTop: "0.5em"}}>
            {/* Header */}
            <Flex wrap={"wrap"} justify="between" align="center">
                <Heading size={{ "initial": "1" }}>Zarządzanie Użytkownikami</Heading>
                <Text size={{ "initial": "1" }} style={{ opacity: 0.7 }}>
                    Zarządzaj członkostwem w gildiach i uprawnieniami użytkowników
                </Text>
            </Flex>

            {/* Users CardList */}
            <Flex direction="column" justify="center">
                {users?.length === 0 && (
                    <Card style={{ padding: "1rem" }}>
                        <Text size={{ "initial": "1" }} style={{ opacity: 0.6 }}>
                            Brak użytkowników do wyświetlenia
                        </Text>
                    </Card>
                )}
                {users?.map((user) => (
                    <Card size={{ "initial": "2" }} key={user.id}>
                        <DataList.Root>
                            <DataList.Item>
                                <DataList.Label>Użytkownik</DataList.Label>
                                <DataList.Value>
                                    <Strong>{user.name || "Nieznany użytkownik"}</Strong>
                                </DataList.Value>
                            </DataList.Item>
                            <DataList.Item>
                                <DataList.Label>Email</DataList.Label>
                                <DataList.Value>
                                    <Text size={{ "initial": "1" }} style={{ opacity: 0.6 }}>
                                        {user.email || "Brak email"}
                                    </Text>
                                </DataList.Value>
                            </DataList.Item>
                            <DataList.Item>
                                <DataList.Label>Status</DataList.Label>
                                <DataList.Value>
                                    <Flex direction={"column"} gap="2">
                                        {user.isAdmin && (
                                            <Badge variant="solid" color="gold">
                                                <StarIcon />
                                                Admin
                                            </Badge>
                                        )}
                                        <Badge variant="soft" color="blue">
                                            <PersonIcon />
                                            Użytkownik
                                        </Badge>
                                    </Flex>
                                </DataList.Value>
                            </DataList.Item><DataList.Item>
                                <DataList.Label>Gildie</DataList.Label>
                                <DataList.Value>
                                    {user.group != null && (
                                        <Badge key={user.group.id} variant="soft" color="purple">
                                            {user.group.name}
                                        </Badge>
                                    )}
                                    {user.organizerGroup != null && (
                                        <Badge key={user.organizerGroup.id} variant="solid" color="purple">
                                            {user.organizerGroup.name}
                                        </Badge>
                                    )}
                                    {user.group == null && user.organizerGroup == null &&  (
                                        <Text size={{ "initial": "1" }} style={{ opacity: 0.6 }}>
                                            Brak gildii
                                        </Text>
                                    )}
                                </DataList.Value>
                            </DataList.Item>
                            <DataList.Item>
                                <DataList.Label>Akcje</DataList.Label>
                                <DataList.Value>
                                    <Flex direction={"column"} gap="2">
                                        <Button
                                            size={{ "initial": "1" }}
                                            variant="soft"
                                            onClick={() => {
                                                setSelectedUser(user);
                                                setIsAssignDialogOpen(true);
                                            }}
                                        >
                                            <PlusIcon />
                                            Dodaj do gildii
                                        </Button>
                                        <Button
                                            size={{ "initial": "1" }}
                                            variant="soft"
                                            color={user.isAdmin ? "red" : "blue"}
                                            onClick={() => updateAdminStatusMutation.mutate({
                                                userId: user.id,
                                                isAdmin: !user.isAdmin
                                            })}
                                            disabled={updateAdminStatusMutation.isPending}
                                        >
                                            {user.isAdmin ? <><TrashIcon />Usuń admin</> : <><StarIcon />Nadaj admin</>}
                                        </Button>
                                    </Flex>
                                </DataList.Value>
                            </DataList.Item>
                        </DataList.Root>
                    </Card>
                ))}
            </Flex>

            {/* Assign to Group Dialog */}
            <Dialog.Root open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
                <Dialog.Content>
                    <Dialog.Title>Dodaj do Gildii</Dialog.Title>
                    <Dialog.Description>
                        Przypisz użytkownika &quot;{selectedUser?.name ?? selectedUser?.email}&quot; do gildii.
                    </Dialog.Description>

                    <AssignUserToGroupForm
                        user={selectedUser}
                        onSubmit={(groupId) => {
                            if (selectedUser) {
                                assignUserMutation.mutate({
                                    userId: selectedUser.id,
                                    groupId,
                                });
                            }
                        }}
                        isLoading={assignUserMutation.isPending}
                        onCancel={() => setIsAssignDialogOpen(false)}
                    />
                </Dialog.Content>
            </Dialog.Root>

            {/* Remove from Group Dialog */}
            <AlertDialog.Root open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
                <AlertDialog.Content>
                    <AlertDialog.Title>Usuń z Gildii</AlertDialog.Title>
                    <AlertDialog.Description>
                        Czy na pewno chcesz usunąć użytkownika &quot;{selectedUser?.name ?? selectedUser?.email}&quot;
                        z gildii &quot;{selectedGroupForRemoval?.name}&quot;?
                    </AlertDialog.Description>
                    <Flex gap="3" mt="4" justify="end">
                        <AlertDialog.Cancel>
                            <Button variant="soft" color="gray">
                                Anuluj
                            </Button>
                        </AlertDialog.Cancel>
                        <AlertDialog.Action>
                            <Button
                                variant="solid"
                                color="red"
                                onClick={() => {
                                    if (selectedUser && selectedGroupForRemoval) {
                                        removeUserMutation.mutate({
                                            userId: selectedUser.id,
                                            groupId: selectedGroupForRemoval.id,
                                        });
                                    }
                                }}
                                disabled={removeUserMutation.isPending}
                            >
                                {removeUserMutation.isPending ? "Usuwanie..." : "Usuń"}
                            </Button>
                        </AlertDialog.Action>
                    </Flex>
                </AlertDialog.Content>
            </AlertDialog.Root>
        </Flex>
    );
}
