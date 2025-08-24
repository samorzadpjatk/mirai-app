"use client"

import type { User } from "@prisma/client";
import type { QueryObserver } from "@tanstack/react-query";
import { Dialog, Flex, TextField, Select, Button, Text } from "@radix-ui/themes";
import { useState } from "react";
import { api } from "~/trpc/react";
import { PlusIcon } from "@radix-ui/react-icons";

// Create Group Dialog Component
const CreateGroupDialog = ({
    users,
    refetch
}: {
    users: User[];
    refetch: QueryObserver["refetch"];
}) => {
    const [name, setName] = useState("");
    const [organizerId, setOrganizerId] = useState("");
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

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

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (name.trim() && organizerId) {
            createGroupMutation.mutate({
                name: name.trim(),
                organizerId: organizerId,
            });
            setName("");
            setOrganizerId("");
        }
    };

    return (
        <Dialog.Root open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <Dialog.Trigger>
                <Button size={{ "initial": "1" }}>
                    <PlusIcon />
                    Utwórz Gildię
                </Button>
            </Dialog.Trigger>
            <Dialog.Content>
                <Dialog.Title>Utwórz Nową Gildię</Dialog.Title>
                <Dialog.Description>
                    Stwórz nową gildię dla uczestników wydarzenia.
                </Dialog.Description>

                <form onSubmit={handleSubmit}>
                    <Flex direction="column" gap={{ "initial": "1" }} mt="4">
                        <div>
                            <Text as="label" size={{ "initial": "1" }} weight="bold">
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
                            <Text as="label" size={{ "initial": "1" }} weight="bold">
                                Przypisany
                            </Text>
                            <Select.Root value={organizerId} onValueChange={setOrganizerId}>
                                <Select.Trigger placeholder="Wybierz przypisanego..." />
                                <Select.Content>
                                    {users.map((user) => (
                                        <Select.Item key={user.id} value={user.id}>
                                            {user.name ?? user.email ?? `Użytkownik ${user.id}`}
                                        </Select.Item>
                                    ))}
                                </Select.Content>
                            </Select.Root>
                        </div>
                    </Flex>

                    <Flex gap={{ "initial": "1" }} mt="4" justify="end">
                        <Dialog.Close>
                            <Button type="button" variant="soft" color="gray">
                                Anuluj
                            </Button>
                        </Dialog.Close>
                        <Button
                            type="submit"
                            disabled={!name.trim() || createGroupMutation.isPending}
                        >
                            {createGroupMutation.isPending ? "Tworzenie..." : "Utwórz Gildię"}
                        </Button>
                    </Flex>
                </form>
            </Dialog.Content>
        </Dialog.Root>
    );
}

export default CreateGroupDialog;