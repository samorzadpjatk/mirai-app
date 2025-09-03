"use client"

import { Dialog, Flex, TextField, Select, Button, Text, Skeleton } from "@radix-ui/themes";
import { useEffect, useState } from "react";
import { api } from "~/trpc/react";
import { PlusIcon } from "@radix-ui/react-icons";
import { useRouter } from "next/navigation";
import { useOfflineGroupMutation } from "~/hooks/useUniversalOfflineMutation";

// Create Group Dialog Component
const CreateGroupDialog = () => {
    const router = useRouter();

    const [name, setName] = useState("");
    const [organizerId, setOrganizerId] = useState("");
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

    const { data: adminUsers, isLoading } = api.user.getAllAdminsNames.useQuery();
    
    // Enhanced group creation with offline handling
    const offlineGroupCreate = useOfflineGroupMutation('create');
    const { mutation: createGroupMutation, offlineStatus } = offlineGroupCreate(() => 
        api.group.create.useMutation({
            onSuccess: () => {
                setIsCreateDialogOpen(false);
                router.refresh();
            }
        })
    );

    // Auto-close dialog when saved for offline retry
    useEffect(() => {
        if (offlineStatus && offlineStatus.includes('saved for later')) {
            setIsCreateDialogOpen(false);
            setName("");
            setOrganizerId("");
        }
    }, [offlineStatus]);

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

                {/* Offline Status Indicator */}
                {offlineStatus && (
                    <div style={{ 
                        marginTop: '1rem',
                        padding: '0.75rem', 
                        borderRadius: '0.5rem',
                        backgroundColor: offlineStatus.includes('saved for later') ? 'var(--orange-2)' : 'var(--red-2)',
                        border: offlineStatus.includes('saved for later') ? '1px solid var(--orange-6)' : '1px solid var(--red-6)'
                    }}>
                        <Text 
                            size="2" 
                            color={offlineStatus.includes('saved for later') ? 'orange' : 'red'}
                        >
                            {offlineStatus}
                        </Text>
                        {offlineStatus.includes('saved for later') && (
                            <Text size="1" color="gray" style={{ display: 'block', marginTop: '0.5rem' }}>
                                Group will be created when connection is restored.
                            </Text>
                        )}
                    </div>
                )}

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