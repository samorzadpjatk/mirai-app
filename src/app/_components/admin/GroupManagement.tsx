"use client";

import { useState } from "react";
import {
    Card,
    Flex,
    Heading,
    Text,
    Button,
    TextField,
    Select,
    Dialog,
    Table,
    Badge,
    AlertDialog,
    Separator,
    Strong,
} from "@radix-ui/themes";
import { PlusIcon, Pencil1Icon, TrashIcon, PersonIcon } from "@radix-ui/react-icons";
import { api } from "~/trpc/react";

interface Group {
    id: string;
    name: string;
    code: string;
    coins: number;
    organizer: {
        id: string;
        name: string | null;
        email: string | null;
    };
    members: Array<{
        user: {
            id: string;
            name: string | null;
            email: string | null;
        };
    }>;
}

export default function GroupManagement() {
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    // Fetch groups
    const { data: groups, isLoading, refetch } = api.admin.getAllGroups.useQuery();
    const { data: users } = api.admin.getAllUsers.useQuery();

    // Mutations
    const createGroupMutation = api.admin.createGroup.useMutation({
        onSuccess: () => {
            refetch();
            setIsCreateDialogOpen(false);
        },
        onError: (error) => {
            console.error("Error creating group:", error);
        },
    });

    const updateGroupMutation = api.admin.updateGroup.useMutation({
        onSuccess: () => {
            refetch();
            setIsEditDialogOpen(false);
            setSelectedGroup(null);
        },
        onError: (error) => {
            console.error("Error updating group:", error);
        },
    });

    const deleteGroupMutation = api.admin.deleteGroup.useMutation({
        onSuccess: () => {
            refetch();
            setIsDeleteDialogOpen(false);
            setSelectedGroup(null);
        },
        onError: (error) => {
            console.error("Error deleting group:", error);
        },
    });

    if (isLoading) {
        return (
            <Flex direction="column" align="center" justify="center" style={{ minHeight: "400px" }}>
                <Text>Ładowanie gildii...</Text>
            </Flex>
        );
    }

    return (
        <Flex direction="column" gap="4">
            {/* Header with Create Button */}
            <Flex justify="between" align="center">
                <Heading size="5">Zarządzanie Gildiami</Heading>
                <Dialog.Root open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <Dialog.Trigger>
                        <Button size="2">
                            <PlusIcon />
                            Utwórz Gildię
                        </Button>
                    </Dialog.Trigger>
                    <CreateGroupDialog
                        users={users || []}
                        onSubmit={(data) => createGroupMutation.mutate(data)}
                        isLoading={createGroupMutation.isPending}
                    />
                </Dialog.Root>
            </Flex>

            {/* Groups Table */}
            <Card>
                <Table.Root>
                    <Table.Header>
                        <Table.Row>
                            <Table.ColumnHeaderCell>Nazwa Gildii</Table.ColumnHeaderCell>
                            <Table.ColumnHeaderCell>Kod</Table.ColumnHeaderCell>
                            <Table.ColumnHeaderCell>Przypisany</Table.ColumnHeaderCell>
                            <Table.ColumnHeaderCell>Członkowie</Table.ColumnHeaderCell>
                            <Table.ColumnHeaderCell>Monety</Table.ColumnHeaderCell>
                            <Table.ColumnHeaderCell>Akcje</Table.ColumnHeaderCell>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {groups?.map((group) => (
                            <Table.Row key={group.id}>
                                <Table.Cell>
                                    <Strong>{group.name}</Strong>
                                </Table.Cell>
                                <Table.Cell>
                                    <Badge variant="soft" color="blue">
                                        {group.code}
                                    </Badge>
                                </Table.Cell>
                                <Table.Cell>
                                    <Flex align="center" gap="2">
                                        <PersonIcon />
                                        <Text size="2">
                                            {group.organizer.name || group.organizer.email || "Nieznany"}
                                        </Text>
                                    </Flex>
                                </Table.Cell>
                                <Table.Cell>
                                    <Badge variant="soft" color="green">
                                        {group.members.length} członków
                                    </Badge>
                                </Table.Cell>
                                <Table.Cell>
                                    <Badge variant="soft" color="gold">
                                        💰 {group.coins}
                                    </Badge>
                                </Table.Cell>
                                <Table.Cell>
                                    <Flex gap="2">
                                        <Button
                                            size="1"
                                            variant="soft"
                                            onClick={() => {
                                                setSelectedGroup(group);
                                                setIsEditDialogOpen(true);
                                            }}
                                        >
                                            <Pencil1Icon />
                                        </Button>
                                        <Button
                                            size="1"
                                            variant="soft"
                                            color="red"
                                            onClick={() => {
                                                setSelectedGroup(group);
                                                setIsDeleteDialogOpen(true);
                                            }}
                                        >
                                            <TrashIcon />
                                        </Button>
                                    </Flex>
                                </Table.Cell>
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table.Root>

                {groups?.length === 0 && (
                    <Flex direction="column" align="center" justify="center" style={{ padding: "4rem" }}>
                        <Text size="4" style={{ opacity: 0.6 }}>
                            Brak gildii do wyświetlenia
                        </Text>
                        <Text size="2" style={{ opacity: 0.5 }}>
                            Utwórz pierwszą gildię, aby rozpocząć zarządzanie
                        </Text>
                    </Flex>
                )}
            </Card>

            {/* Edit Dialog */}
            <Dialog.Root open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                {selectedGroup && (
                    <EditGroupDialog
                        group={selectedGroup}
                        users={users || []}
                        onSubmit={(data) => updateGroupMutation.mutate({ id: selectedGroup.id, ...data })}
                        isLoading={updateGroupMutation.isPending}
                    />
                )}
            </Dialog.Root>

            {/* Delete Dialog */}
            <AlertDialog.Root open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialog.Content>
                    <AlertDialog.Title>Usuń Gildię</AlertDialog.Title>
                    <AlertDialog.Description>
                        Czy na pewno chcesz usunąć gildię "{selectedGroup?.name}"? 
                        Ta akcja jest nieodwracalna i usunie wszystkich członków oraz historię transakcji.
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
                                onClick={() => selectedGroup && deleteGroupMutation.mutate({ id: selectedGroup.id })}
                                disabled={deleteGroupMutation.isPending}
                            >
                                {deleteGroupMutation.isPending ? "Usuwanie..." : "Usuń"}
                            </Button>
                        </AlertDialog.Action>
                    </Flex>
                </AlertDialog.Content>
            </AlertDialog.Root>
        </Flex>
    );
}

// Create Group Dialog Component
function CreateGroupDialog({ 
    users, 
    onSubmit, 
    isLoading 
}: {
    users: any[];
    onSubmit: (data: { name: string; organizerId?: string }) => void;
    isLoading: boolean;
}) {
    const [name, setName] = useState("");
    const [organizerId, setOrganizerId] = useState("");

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (name.trim()) {
            onSubmit({
                name: name.trim(),
                organizerId: organizerId && organizerId !== "none" ? organizerId : undefined,
            });
            setName("");
            setOrganizerId("");
        }
    };

    return (
        <Dialog.Content>
            <Dialog.Title>Utwórz Nową Gildię</Dialog.Title>
            <Dialog.Description>
                Stwórz nową gildię dla uczestników wydarzenia.
            </Dialog.Description>

            <form onSubmit={handleSubmit}>
                <Flex direction="column" gap="4" mt="4">
                    <div>
                        <Text as="label" size="2" weight="bold">
                            Nazwa Gildii
                        </Text>
                        <TextField.Root
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="np. Rycerze Okrągłego Stołu"
                            required
                        />
                    </div>

                    <div>
                        <Text as="label" size="2" weight="bold">
                            Przypisany (opcjonalnie)
                        </Text>
                        <Select.Root value={organizerId} onValueChange={setOrganizerId}>
                            <Select.Trigger placeholder="Wybierz przypisanego..." />
                            <Select.Content>
                                <Select.Item value="none">Bez przypisanego</Select.Item>
                                {users.map((user) => (
                                    <Select.Item key={user.id} value={user.id}>
                                        {user.name || user.email || `Użytkownik ${user.id}`}
                                    </Select.Item>
                                ))}
                            </Select.Content>
                        </Select.Root>
                    </div>
                </Flex>

                <Flex gap="3" mt="4" justify="end">
                    <Dialog.Close>
                        <Button type="button" variant="soft" color="gray">
                            Anuluj
                        </Button>
                    </Dialog.Close>
                    <Button
                        type="submit"
                        disabled={!name.trim() || isLoading}
                    >
                        {isLoading ? "Tworzenie..." : "Utwórz Gildię"}
                    </Button>
                </Flex>
            </form>
        </Dialog.Content>
    );
}

// Edit Group Dialog Component
function EditGroupDialog({ 
    group, 
    users, 
    onSubmit, 
    isLoading 
}: {
    group: Group;
    users: any[];
    onSubmit: (data: { name?: string; organizerId?: string }) => void;
    isLoading: boolean;
}) {
    const [name, setName] = useState(group.name);
    const [organizerId, setOrganizerId] = useState(group.organizer.id);

    const handleSubmit = () => {
        const updateData: { name?: string; organizerId?: string } = {};
        
        if (name.trim() !== group.name) {
            updateData.name = name.trim();
        }
        
        if (organizerId !== group.organizer.id) {
            updateData.organizerId = organizerId;
        }

        if (Object.keys(updateData).length > 0) {
            onSubmit(updateData);
        }
    };

    return (
        <Dialog.Content>
            <Dialog.Title>Edytuj Gildię</Dialog.Title>
            <Dialog.Description>
                Modyfikuj informacje o gildii "{group.name}".
            </Dialog.Description>

            <Flex direction="column" gap="4" mt="4">
                <div>
                    <Text as="label" size="2" weight="bold">
                        Nazwa Gildii
                    </Text>
                    <TextField.Root
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="np. Rycerze Okrągłego Stołu"
                    />
                </div>

                <div>
                    <Text as="label" size="2" weight="bold">
                        Przypisany
                    </Text>
                    <Select.Root value={organizerId} onValueChange={setOrganizerId}>
                        <Select.Trigger />
                        <Select.Content>
                            {users.map((user) => (
                                <Select.Item key={user.id} value={user.id}>
                                    {user.name || user.email || `Użytkownik ${user.id}`}
                                </Select.Item>
                            ))}
                        </Select.Content>
                    </Select.Root>
                </div>

                <Separator />

                <div>
                    <Text size="2" weight="bold">Aktualne statystyki:</Text>
                    <Flex gap="4" mt="2">
                        <Badge variant="soft" color="blue">
                            Kod: {group.code}
                        </Badge>
                        <Badge variant="soft" color="green">
                            {group.members.length} członków
                        </Badge>
                        <Badge variant="soft" color="gold">
                            💰 {group.coins} monet
                        </Badge>
                    </Flex>
                </div>
            </Flex>

            <Flex gap="3" mt="4" justify="end">
                <Dialog.Close>
                    <Button variant="soft" color="gray">
                        Anuluj
                    </Button>
                </Dialog.Close>
                <Button
                    onClick={handleSubmit}
                    disabled={!name.trim() || isLoading}
                >
                    {isLoading ? "Zapisywanie..." : "Zapisz Zmiany"}
                </Button>
            </Flex>
        </Dialog.Content>
    );
}
