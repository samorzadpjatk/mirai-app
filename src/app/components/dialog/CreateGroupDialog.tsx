"use client"

import type { User } from "@prisma/client";
import { Dialog, Flex, TextField, Select, Button, Text } from "@radix-ui/themes";
import { useState } from "react";

// Create Group Dialog Component
const CreateGroupDialog = ({
    users,
    onSubmit,
    isLoading
}: {
    users: User[];
    onSubmit: (data: { name: string; organizerId?: string }) => void;
    isLoading: boolean;
}) => {
    const [name, setName] = useState("");
    const [organizerId, setOrganizerId] = useState("");

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (name.trim()) {
            onSubmit({
                name: name.trim(),
                organizerId: organizerId && organizerId !== "none" ? organizerId : undefined,
            });
            setName("");
            setOrganizerId("");
        }
    };

    return (
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
                            Przypisany (opcjonalnie)
                        </Text>
                        <Select.Root value={organizerId} onValueChange={setOrganizerId}>
                            <Select.Trigger placeholder="Wybierz przypisanego..." />
                            <Select.Content>
                                <Select.Item value="none">Bez przypisanego</Select.Item>
                                {users.map((user) => (
                                    <Select.Item key={user.id} value={user.id}>
                                        {user.name || user.email || `Użytkownik ${user.id}`}
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
                        disabled={!name.trim() || isLoading}
                    >
                        {isLoading ? "Tworzenie..." : "Utwórz Gildię"}
                    </Button>
                </Flex>
            </form>
        </Dialog.Content>
    );
}

export default CreateGroupDialog;