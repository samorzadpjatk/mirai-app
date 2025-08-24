"use client"

import { type User } from "@prisma/client";
import { Dialog, Flex, TextField, Select, Separator, Badge, Button, Text } from "@radix-ui/themes";
import { useState } from "react";
import type { GroupWithAllFields } from "~/types/schema";

const EditGroupDialog = ({
    group,
    users,
    onSubmit,
    isLoading
}: {
    group: GroupWithAllFields;
    users: User[];
    onSubmit: (data: { name?: string; organizerId?: string }) => void;
    isLoading: boolean;
}) => {
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
                Modyfikuj informacje o gildii &quot;{group.name}&quot;.
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


export default EditGroupDialog;