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
} from "@radix-ui/themes";

import { PlusIcon, Pencil1Icon, TrashIcon } from "@radix-ui/react-icons";
import { api } from "~/trpc/react";
import { type Group } from "@prisma/client";

import CreateGroupDialog from "../dialog/CreateGroupDialog";
import EditGroupDialog from "../dialog/EditGroupDialog";

const GroupManagement = () => {
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    // Fetch groups
    const { data: groups, isLoading, refetch } = api.group.getAll.useQuery();
    const { data: users } = api.user.getAll.useQuery();

    // Mutations
    const createGroupMutation = api.group.create.useMutation({
        onSuccess: async () => {
            await refetch();
            setIsCreateDialogOpen(false);
        },
        onError: (error) => {
            console.error("Error creating group:", error);
        },
    });

    const updateGroupMutation = api.group.update.useMutation({
        onSuccess: async () => {
            await refetch();
            setIsEditDialogOpen(false);
            setSelectedGroup(null);
        },
        onError: (error) => {
            console.error("Error updating group:", error);
        },
    });

    const deleteGroupMutation = api.group.delete.useMutation({
        onSuccess: async () => {
            await refetch();
            setIsDeleteDialogOpen(false);
            setSelectedGroup(null);
        },
        onError: (error) => {
            console.error("Error deleting group:", error);
        },
    });

    if (isLoading) {
        return (
            <Flex direction="column" align="center" justify="center">
                <Text>Ładowanie gildii...</Text>
            </Flex>
        );
    }

    return (
        <Flex direction="column" gap={{ "initial": "1" }} style={{marginTop: "0.5em"}}>
            {/* Header with Create Button */}
            <Flex justify="between" align="center">
                <Heading size={{ "initial": "1" }}>Zarządzanie Gildiami</Heading>
                <Dialog.Root open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <Dialog.Trigger>
                        <Button size={{ "initial": "1" }}>
                            <PlusIcon />
                            Utwórz Gildię
                        </Button>
                    </Dialog.Trigger>
                    <CreateGroupDialog
                        users={users ?? []}
                        onSubmit={(data) => createGroupMutation.mutate(data)}
                        isLoading={createGroupMutation.isPending}
                    />
                </Dialog.Root>
            </Flex>

            {/* Groups Card List */}
            <Flex direction="column" justify="center">
                {groups?.length === 0 && (
                    <Card style={{ padding: "1rem" }}>
                        <Text size={{ "initial": "1" }} style={{ opacity: 0.6 }}>
                            Brak gildii do wyświetlenia
                        </Text><br />
                        <Text size={{ "initial": "1" }} style={{ opacity: 0.5 }}>
                            Utwórz pierwszą gildię, aby rozpocząć zarządzanie
                        </Text>
                    </Card>
                )}
                {groups?.map((group) => (
                    <Card key={group.id} size={{ "initial": "2" }} style={{ width: "100%", maxWidth: "500px" }}>
                        <Flex direction="column" gap={{ "initial": "1" }}>
                            <Flex justify="between" align="center">
                                <Strong>{group.name}</Strong>
                                <Badge variant="soft" color="blue">
                                    {group.code}
                                </Badge>
                            </Flex>
                            <Text size={{ "initial": "1" }} style={{ opacity: 0.7 }}>
                                Przypisany: {group.organizer.name || group.organizer.email || "Nieznany"}
                            </Text>
                            <Flex justify="between" align="center">
                                <Badge variant="soft" color="green">
                                    {group.members.length} członków
                                </Badge>
                                <Badge variant="soft" color="gold">
                                    💰 {group.coins} monet
                                </Badge>
                            </Flex>
                            <Flex gap={{ "initial": "1" }} justify="end">
                                <Button
                                    size={{ "initial": "1" }}
                                    variant="soft"
                                    onClick={() => {
                                        setSelectedGroup(group);
                                        setIsEditDialogOpen(true);
                                    }}
                                >
                                    <Pencil1Icon />
                                </Button>
                                <Button
                                    size={{ "initial": "1" }}
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
                        </Flex>
                    </Card>
                ))}
            </Flex>
            
            {/* Edit Dialog */}
            <Dialog.Root open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                {selectedGroup && (
                    <EditGroupDialog
                        group={selectedGroup}
                        users={users ?? []}
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
                        Czy na pewno chcesz usunąć gildię &quot;{selectedGroup?.name}&quot;?
                        Ta akcja jest nieodwracalna i usunie wszystkich członków oraz historię transakcji.
                    </AlertDialog.Description>
                    <Flex gap={{ "initial": "1" }} mt="4" justify="end">
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

export default GroupManagement;
