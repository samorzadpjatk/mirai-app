"use client";

import type { User } from "@prisma/client";
import { Flex, Button, Select, Text, Dialog } from "@radix-ui/themes";
import { on } from "events";
import { useState } from "react";
import { api } from "~/trpc/react";

const AssignUserToGroupForm = ({
    user,
    isAssignDialogOpen,
    setIsAssignDialogOpen,
    onMutationSuccess,
    onCancel,
}: {
    user: User | null;
    isAssignDialogOpen: boolean;
    setIsAssignDialogOpen: (open: boolean) => void;
    onMutationSuccess: () => void;
    onCancel: () => void;
}) => {
    const { data: groups } = api.group.getAll.useQuery();
    const availableGroups = groups?.filter(group =>
        group.id !== user?.groupId
    ) ?? [];
    const [selectedGroupId, setSelectedGroupId] = useState("");

    const assignUserMutation = api.group.assignUserToGroup.useMutation({
        onSuccess: onMutationSuccess,
    });

    const handleSubmit = () => {
        if (selectedGroupId) {
            assignUserMutation.mutate({ userId: user.id, groupId: selectedGroupId });
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
        <Dialog.Root open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
            <Dialog.Content>
                <Dialog.Title>Dodaj do Gildii</Dialog.Title>
                <Dialog.Description>
                    Przypisz użytkownika &quot;{user?.name ?? user?.email}&quot; do gildii.
                </Dialog.Description>
                <Flex direction="column" gap="4" mt="4">
                    <div>
                        <Text as="label" size={{ "initial": "1" }} weight="bold">
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
                            disabled={!selectedGroupId || assignUserMutation.isPending}
                        >
                            {assignUserMutation.isPending ? "Dodawanie..." : "Dodaj do Gildii"}
                        </Button>
                    </Flex>
                </Flex>
            </Dialog.Content>
        </Dialog.Root>
    );
}

export default AssignUserToGroupForm;