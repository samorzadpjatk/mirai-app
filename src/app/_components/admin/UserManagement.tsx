"use client";

import { useState } from "react";
import {
    Card,
    Flex,
    Heading,
    Text,
    Button,
    Select,
    Dialog,
    Table,
    Badge,
    AlertDialog,
    Avatar,
    Strong,
} from "@radix-ui/themes";
import { PersonIcon, PlusIcon, TrashIcon, StarIcon } from "@radix-ui/react-icons";
import { api } from "~/trpc/react";

interface User {
    id: string;
    name: string | null;
    email: string | null;
    isAdmin: boolean;
    groups: Array<{
        group: {
            id: string;
            name: string;
            code: string;
        };
    }>;
}

interface Group {
    id: string;
    name: string;
    code: string;
}

export default function UserManagement() {
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
    const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
    const [selectedGroupForRemoval, setSelectedGroupForRemoval] = useState<Group | null>(null);

    // Fetch data
    const { data: users, isLoading: usersLoading, refetch: refetchUsers } = api.admin.getAllUsers.useQuery();
    const { data: groups, isLoading: groupsLoading } = api.admin.getAllGroups.useQuery();

    // Mutations
    const assignUserMutation = api.admin.assignUserToGroup.useMutation({
        onSuccess: () => {
            refetchUsers();
            setIsAssignDialogOpen(false);
            setSelectedUser(null);
        },
    });

    const removeUserMutation = api.admin.removeUserFromGroup.useMutation({
        onSuccess: () => {
            refetchUsers();
            setIsRemoveDialogOpen(false);
            setSelectedUser(null);
            setSelectedGroupForRemoval(null);
        },
    });

    const updateAdminStatusMutation = api.admin.updateUserAdminStatus.useMutation({
        onSuccess: () => {
            refetchUsers();
        },
    });

    if (usersLoading || groupsLoading) {
        return (
            <Flex direction="column" align="center" justify="center" style={{ minHeight: "400px" }}>
                <Text>Ładowanie użytkowników...</Text>
            </Flex>
        );
    }

    return (
        <Flex direction="column" gap="4">
            {/* Header */}
            <Flex justify="between" align="center">
                <Heading size="5">Zarządzanie Użytkownikami</Heading>
                <Text size="2" style={{ opacity: 0.7 }}>
                    Zarządzaj członkostwem w gildiach i uprawnieniami użytkowników
                </Text>
            </Flex>

            {/* Users Table */}
            <Card>
                <Table.Root>
                    <Table.Header>
                        <Table.Row>
                            <Table.ColumnHeaderCell>Użytkownik</Table.ColumnHeaderCell>
                            <Table.ColumnHeaderCell>Email</Table.ColumnHeaderCell>
                            <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                            <Table.ColumnHeaderCell>Gildie</Table.ColumnHeaderCell>
                            <Table.ColumnHeaderCell>Akcje</Table.ColumnHeaderCell>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {users?.map((user) => (
                            <Table.Row key={user.id}>
                                <Table.Cell>
                                    <Flex align="center" gap="3">
                                        <Avatar
                                            size="2"
                                            fallback={user.name?.split(' ').map(n => n[0]).join('') || user.email?.[0]?.toUpperCase() || '?'}
                                        />
                                        <div>
                                            <Strong>{user.name || "Nieznany użytkownik"}</Strong>
                                            <Text as="div" size="1" style={{ opacity: 0.6 }}>
                                                ID: {user.id.slice(0, 8)}...
                                            </Text>
                                        </div>
                                    </Flex>
                                </Table.Cell>
                                <Table.Cell>
                                    <Text size="2">{user.email || "Brak email"}</Text>
                                </Table.Cell>
                                <Table.Cell>
                                    <Flex gap="2" align="center">
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
                                </Table.Cell>
                                <Table.Cell>
                                    <Flex gap="1" wrap="wrap">
                                        {user.groups.length > 0 ? (
                                            user.groups.map((membership) => (
                                                <Badge
                                                    key={membership.group.id}
                                                    variant="soft"
                                                    color="green"
                                                    style={{ cursor: "pointer" }}
                                                    onClick={() => {
                                                        setSelectedUser(user);
                                                        setSelectedGroupForRemoval(membership.group);
                                                        setIsRemoveDialogOpen(true);
                                                    }}
                                                >
                                                    {membership.group.name}
                                                </Badge>
                                            ))
                                        ) : (
                                            <Text size="1" style={{ opacity: 0.5 }}>
                                                Brak gildii
                                            </Text>
                                        )}
                                    </Flex>
                                </Table.Cell>
                                <Table.Cell>
                                    <Flex gap="2">
                                        <Button
                                            size="1"
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
                                            size="1"
                                            variant="soft"
                                            color={user.isAdmin ? "red" : "blue"}
                                            onClick={() => updateAdminStatusMutation.mutate({
                                                userId: user.id,
                                                isAdmin: !user.isAdmin
                                            })}
                                            disabled={updateAdminStatusMutation.isPending}
                                        >
                                            <StarIcon />
                                            {user.isAdmin ? "Usuń admin" : "Nadaj admin"}
                                        </Button>
                                    </Flex>
                                </Table.Cell>
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table.Root>

                {users?.length === 0 && (
                    <Flex direction="column" align="center" justify="center" style={{ padding: "4rem" }}>
                        <Text size="4" style={{ opacity: 0.6 }}>
                            Brak użytkowników do wyświetlenia
                        </Text>
                    </Flex>
                )}
            </Card>

            {/* Assign to Group Dialog */}
            <Dialog.Root open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
                <Dialog.Content>
                    <Dialog.Title>Dodaj do Gildii</Dialog.Title>
                    <Dialog.Description>
                        Przypisz użytkownika "{selectedUser?.name || selectedUser?.email}" do gildii.
                    </Dialog.Description>

                    <AssignUserToGroupForm
                        user={selectedUser}
                        availableGroups={groups?.filter(group => 
                            !selectedUser?.groups.some(membership => membership.group.id === group.id)
                        ) || []}
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
                        Czy na pewno chcesz usunąć użytkownika "{selectedUser?.name || selectedUser?.email}" 
                        z gildii "{selectedGroupForRemoval?.name}"?
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

// Assign User to Group Form Component
function AssignUserToGroupForm({
    user,
    availableGroups,
    onSubmit,
    isLoading,
    onCancel,
}: {
    user: User | null;
    availableGroups: Group[];
    onSubmit: (groupId: string) => void;
    isLoading: boolean;
    onCancel: () => void;
}) {
    const [selectedGroupId, setSelectedGroupId] = useState("");

    const handleSubmit = () => {
        if (selectedGroupId) {
            onSubmit(selectedGroupId);
        }
    };

    if (availableGroups.length === 0) {
        return (
            <Flex direction="column" gap="4" mt="4">
                <Text>
                    Użytkownik już należy do wszystkich dostępnych gildii lub nie ma żadnych gildii do przypisania.
                </Text>
                <Flex gap="3" justify="end">
                    <Button variant="soft" onClick={onCancel}>
                        Zamknij
                    </Button>
                </Flex>
            </Flex>
        );
    }

    return (
        <Flex direction="column" gap="4" mt="4">
            <div>
                <Text as="label" size="2" weight="bold">
                    Wybierz Gildię
                </Text>
                <Select.Root value={selectedGroupId} onValueChange={setSelectedGroupId}>
                    <Select.Trigger placeholder="Wybierz gildię..." />
                    <Select.Content>
                        {availableGroups.map((group) => (
                            <Select.Item key={group.id} value={group.id}>
                                {group.name} ({group.code})
                            </Select.Item>
                        ))}
                    </Select.Content>
                </Select.Root>
            </div>

            <Flex gap="3" justify="end">
                <Button variant="soft" color="gray" onClick={onCancel}>
                    Anuluj
                </Button>
                <Button
                    onClick={handleSubmit}
                    disabled={!selectedGroupId || isLoading}
                >
                    {isLoading ? "Dodawanie..." : "Dodaj do Gildii"}
                </Button>
            </Flex>
        </Flex>
    );
}
