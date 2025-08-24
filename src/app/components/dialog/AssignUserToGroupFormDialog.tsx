"use client";

import type { User } from "@prisma/client";
import { Flex, Button, Select, Text } from "@radix-ui/themes";
import { useState } from "react";
import { api } from "~/trpc/react";

const AssignUserToGroupForm = ({
    user,
    onSubmit,
    isLoading,
    onCancel,
}: {
    user: User | null;
    onSubmit: (groupId: string) => void;
    isLoading: boolean;
    onCancel: () => void;
}) => {
    const { data: groups } = api.group.getAll.useQuery();
    const availableGroups = groups?.filter(group =>
        group.id !== user?.groupId
    ) ?? [];
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
                    disabled={!selectedGroupId || isLoading}
                >
                    {isLoading ? "Dodawanie..." : "Dodaj do Gildii"}
                </Button>
            </Flex>
        </Flex>
    );
}

export default AssignUserToGroupForm;