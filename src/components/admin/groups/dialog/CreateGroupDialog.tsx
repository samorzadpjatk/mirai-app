"use client"

import { Dialog, Flex, TextField, Select, Button, Text, Skeleton } from "@radix-ui/themes";
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

    const { data: adminUsers, isLoading } = api.user.getAllAdminsNames.useQuery();
    const createGroupMutation = api.group.create.useMutation({
        onSuccess: async () => {
            setIsCreateDialogOpen(false);
            router.refresh();
        },
    });

    const handleCreateSubmit = () => {
        if (name.trim()) {
            // Generate a simple code from the name
            const generatedCode = name.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 8) + Math.floor(Math.random() * 100);
            
            createGroupMutation.mutate({
                name: name.trim(),
                code: generatedCode,
                organizerId: organizerId === "__default__" ? undefined : organizerId || undefined,
            });
            setName("");
            setOrganizerId("");
        }
    };

    return (
        <Skeleton loading={isLoading}><Dialog.Root open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <Dialog.Trigger>
                <Button size={{ "initial": "1", "xs": "2", "sm": "3" }}>
                    <PlusIcon />
                    Forge the Guild
                </Button>
            </Dialog.Trigger>
            <Dialog.Content>
                <Dialog.Title>Forge a new Guild</Dialog.Title>
                <Dialog.Description>
                    Forge a new Guild for the brave participants of the event.
                </Dialog.Description>

                <Flex direction="column" gap={{ "initial": "1" }} mt="4">
                    <div>
                        <Text as="label" size={{ "initial": "1", "xs": "2", "sm": "3" }} weight="bold">
                            The Guild’s Heralded Name
                        </Text>
                        <TextField.Root
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Knights of the Round Table"
                            required
                        />
                    </div>



                    <Flex gap={"2"} align={"center"}>
                        <Text as="label" size={{ "initial": "1", "xs": "2", "sm": "3" }} weight="bold">
                            Assigned <Text size="1" color="gray">(optional)</Text>
                        </Text>
                        <Select.Root value={organizerId} onValueChange={setOrganizerId}>
                            <Select.Trigger placeholder="Leave this field empty = the mantle of organizer falls upon you." />
                            <Select.Content>
                                <Select.Item value="__default__">
                                    <Text color="gray">(The role of organizer falls upon you)</Text>
                                </Select.Item>
                                {adminUsers?.map((user) => (
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
                            Cancel
                        </Button>
                    </Dialog.Close>
                    <Button
                        onClick={handleCreateSubmit}
                        disabled={!name.trim() || createGroupMutation.isPending}
                    >
                        {createGroupMutation.isPending ? "Forging..." : "Forge the Guild"}
                    </Button>
                </Flex>
            </Dialog.Content>
        </Dialog.Root>
        </Skeleton>
    );
}

export default CreateGroupDialog;