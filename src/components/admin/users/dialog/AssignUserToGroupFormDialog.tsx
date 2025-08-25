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

    const { data: user, isLoading: isLoadingUser } = api.user.getByIdWithGroup.useQuery({ id: selectedUserId });
    const { data: groups, isLoading: isLoadingGroups } = api.group.getAll.useQuery();

    const availableGroups = groups?.filter(group =>
        group.id !== user?.group?.id
    ) ?? [];
    const [selectedGroupId, setSelectedGroupId] = useState("");

    const assignUserMutation = api.group.assignUserToGroup.useMutation({
        onSuccess: () => {
            setIsAssignDialogOpen(false);
            router.refresh();
        },
    });

    if (!user) return null;

    if (availableGroups.length === 0) {
        return (
            <Flex direction="column" gap="4" mt="4">
                <Text>
                    Użytkownik już należy do wszystkich dostępnych gildii lub nie ma żadnych gildii do przypisania.
                </Text>
                <Flex gap="3" justify="end">
                    <Button variant="soft" onClick={() => setIsAssignDialogOpen(false)}>
                        Zamknij
                    </Button>
                </Flex>
            </Flex>
        );
    }

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
                            Dodaj do gildii
                        </>

                    </Button>
                </Dialog.Trigger>
                <Dialog.Content>
                    <Dialog.Title>Dodaj do Gildii</Dialog.Title>
                    <Dialog.Description>
                        Przypisz użytkownika &quot;{user?.name}&quot; do gildii.
                    </Dialog.Description>
                    <Flex direction="column" gap="4" mt="4">
                        <div>
                            <Text as="label" size={{ "initial": "1", "xs": "2", "sm": "3" }} weight="bold">
                                Wybierz Gildię
                            </Text>
                            <Select.Root value={selectedGroupId} onValueChange={setSelectedGroupId}>
                                <Select.Trigger placeholder="Wybierz gildię..." />
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
                                Anuluj
                            </Button>
                            <Button
                                onClick={() => assignUserMutation.mutate({ userId: user.id, groupId: selectedGroupId })}
                                disabled={!selectedGroupId || assignUserMutation.isPending}
                            >
                                {assignUserMutation.isPending ? "Dodawanie..." : "Dodaj do Gildii"}
                            </Button>
                        </Flex>
                    </Flex>
                </Dialog.Content>
            </Dialog.Root>
        </Skeleton>
    );
}

export default AssignUserToGroupFormDialog;