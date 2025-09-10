"use client";

import { PlusIcon } from "@radix-ui/react-icons";
import { Flex, Button, Select, Text, Dialog, Skeleton } from "@radix-ui/themes";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "~/trpc/react";

const AssignUserToGroupFormDialog = ({
    selectedUserId
}: {
    selectedUserId: string;
}) => {
    const router = useRouter();
    const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
    const [selectedGroupId, setSelectedGroupId] = useState("");
    
    const { data: user, isLoading: isLoadingUser } = api.user.getByIdWithGroup.useQuery({ id: selectedUserId });
    const { data: groups, isLoading: isLoadingGroups } = api.group.getAll.useQuery();


    const availableGroups = groups?.filter(group =>
        user?.group?.id !== group.id && user?.organizerGroup?.id !== group.id
    ) ?? [];
    
    const assignUserMutation = api.group.assignUserToGroup.useMutation({
        onSuccess: () => {
            setIsAssignDialogOpen(false);
            router.refresh();
        },
    });

    if (!user || !groups) return null;
    if (availableGroups.length === 0) return null;

    return (
        <Skeleton loading={isLoadingUser || isLoadingGroups}>
            <Dialog.Root open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
                <Dialog.Trigger>
                    <Button
                        size={{ "initial": "1", "xs": "2", "sm": "3" }}
                        variant="soft"
                        onClick={() => {
                            setIsAssignDialogOpen(true);
                        }}
                    >
                        <>
                            <PlusIcon />
                            Enlist into the Guild
                        </>

                    </Button>
                </Dialog.Trigger>
                <Dialog.Content>
                    <Dialog.Title>Enlist into the Guild</Dialog.Title>
                    <Dialog.Description>
                        Enlist companion &quot;{user?.name}&quot; into the Guild.
                    </Dialog.Description>
                    <Flex direction="column" gap="4" mt="4">
                        <div>
                            <Text as="label" size={{ "initial": "1", "xs": "2", "sm": "3" }} weight="bold">
                                Choose a Guild
                            </Text>
                            <Select.Root value={selectedGroupId} onValueChange={setSelectedGroupId}>
                                <Select.Trigger placeholder="Select guild..." />
                                <Select.Content>
                                    {availableGroups.map((group) => (
                                        <Select.Item key={group.id} value={group.id}>
                                            {group.name}
                                        </Select.Item>
                                    ))}
                                </Select.Content>
                            </Select.Root>
                        </div>

                        <Flex gap="3" justify="end">
                            <Button variant="soft" color="gray" onClick={() => setIsAssignDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                onClick={() => assignUserMutation.mutate({ userId: user.id, groupId: selectedGroupId })}
                                disabled={!selectedGroupId || assignUserMutation.isPending}
                            >
                                {assignUserMutation.isPending ? "Enlisting..." : "Enlist into the Guild"}
                            </Button>
                        </Flex>
                    </Flex>
                </Dialog.Content>
            </Dialog.Root>
        </Skeleton>
    );
}

export default AssignUserToGroupFormDialog;