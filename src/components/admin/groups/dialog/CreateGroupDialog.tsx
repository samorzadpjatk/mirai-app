"use client"

import { Dialog, Flex, TextField, Select, Button, Text } from "@radix-ui/themes";
import { useState } from "react";
import { api } from "~/trpc/react";
import { PlusIcon } from "@radix-ui/react-icons";
import { useRouter } from "next/navigation";

// Create Group Dialog Component
const CreateGroupDialog = () => {
    const router = useRouter();

    const [name, setName] = useState("");
    const [organizerId, setOrganizerId] = useState("");
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

    const { data: adminUsers } = api.user.getAllAdminsNames.useQuery();
    const createGroupMutation = api.group.create.useMutation({
        onSuccess: async () => {
            setIsCreateDialogOpen(false);
            router.refresh();
        },
        onError: (error) => {
            console.error("Error creating group:", error);
        },
    });
    if (!adminUsers) return null;

    const handleCreateSubmit = () => {
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
                <Button size={{ "initial": "1", "xs": "2", "sm": "3" }}>
                    <PlusIcon />
                    Utwórz Gildię
                </Button>
            </Dialog.Trigger>
            <Dialog.Content>
                <Dialog.Title>Utwórz Nową Gildię</Dialog.Title>
                <Dialog.Description>
                    Stwórz nową gildię dla uczestników wydarzenia.
                </Dialog.Description>

                <Flex direction="column" gap={{ "initial": "1" }} mt="4">
                    <div>
                        <Text as="label" size={{ "initial": "1", "xs": "2", "sm": "3" }} weight="bold">
                            Nazwa Gildii
                        </Text>
                        <TextField.Root
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="np. Rycerze Okrągłego Stołu"
                            required
                        />
                    </div>

                    <Flex gap={"2"} align={"center"}>
                        <Text as="label" size={{ "initial": "1", "xs": "2", "sm": "3" }} weight="bold">
                            Przypisany
                        </Text>
                        <Select.Root value={organizerId} onValueChange={setOrganizerId}>
                            <Select.Trigger placeholder="Wybierz przypisanego..." />
                            <Select.Content>
                                {adminUsers.map((user) => (
                                    <Select.Item key={user.id} value={user.id}>
                                        {user.name}
                                    </Select.Item>
                                ))}
                            </Select.Content>
                        </Select.Root>
                    </Flex>
                </Flex>

                <Flex gap={{ "initial": "1" }} mt="4" justify="end">
                    <Dialog.Close>
                        <Button type="button" variant="soft" color="gray">
                            Anuluj
                        </Button>
                    </Dialog.Close>
                    <Button
                        onClick={handleCreateSubmit}
                        disabled={!name.trim() || createGroupMutation.isPending}
                    >
                        {createGroupMutation.isPending ? "Tworzenie..." : "Utwórz Gildię"}
                    </Button>
                </Flex>
            </Dialog.Content>
        </Dialog.Root>
    );
}

export default CreateGroupDialog;