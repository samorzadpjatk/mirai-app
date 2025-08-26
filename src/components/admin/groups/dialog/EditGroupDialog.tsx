"use client"

import { Pencil1Icon } from "@radix-ui/react-icons";
import { Dialog, Flex, TextField, Select, Separator, Badge, Button, Text, Skeleton } from "@radix-ui/themes";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "~/trpc/react";

const EditGroupDialog = ({
    selectedGroupId,
}: {
    selectedGroupId: string;
}) => {
    const [name, setName] = useState<string | undefined>(undefined);
    const [organizerId, setOrganizerId] = useState<string | undefined>(undefined);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    const router = useRouter();
    const { data: adminUsers, isLoading: isLoadingAdmins } = api.user.getAllAdminsNames.useQuery();
    const { data: group, isLoading: isLoadingGroup } = api.group.getByIdWithOrganizer.useQuery({ groupId: selectedGroupId });

    const updateGroupMutation = api.group.update.useMutation({
        onSuccess: async () => {
            router.refresh();
            setIsEditDialogOpen(false);
        },
        onError: (error) => {
            console.error("Error updating group:", error);
        },
    });

    const handleEditSubmit = () => {
        if (!group) return;
        updateGroupMutation.mutate({ id: group?.id, name: group?.name, organizerId: group?.organizer.id });
    };

    return (
        <Skeleton loading={isLoadingGroup || isLoadingAdmins}>
            <Dialog.Root open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <Dialog.Trigger>
                    <Button
                        size={{ "initial": "1", "xs": "2", "sm": "3" }}
                        variant="soft"
                        onClick={() => {
                            setName(group?.name);
                            setOrganizerId(group?.organizer.id);
                            setIsEditDialogOpen(true);
                        }}
                    >
                        <Pencil1Icon />
                    </Button>
                </Dialog.Trigger>
                <Dialog.Content>

                    <Dialog.Title>Edytuj Gildię</Dialog.Title>
                    <Dialog.Description>
                        Modyfikuj informacje o gildii &quot;{group?.name}&quot;.
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

                        <Flex gap={"2"} align={"center"}>
                            <Text as="label" size="2" weight="bold">
                                Przypisany
                            </Text>
                            <Select.Root value={organizerId} onValueChange={setOrganizerId}>
                                <Select.Trigger />
                                <Select.Content>
                                    {adminUsers?.map((user) => (
                                        <Select.Item key={user.id} value={user.id}>
                                            {user.name}
                                        </Select.Item>
                                    ))}
                                </Select.Content>
                            </Select.Root>
                        </Flex>

                        <Separator />

                        <div>
                            <Text size="2" weight="bold">Aktualne statystyki:</Text>
                            <Flex gap="4" mt="2">
                                <Badge variant="soft" color="blue">
                                    Kod: {group?.code}
                                </Badge>
                                <Badge variant="soft" color="green">
                                    {group?._count.members} członków
                                </Badge>
                                <Badge variant="soft" color="gold">
                                    💰 {group?.coins} monet
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
                            onClick={handleEditSubmit}
                            disabled={!name?.trim() || updateGroupMutation.isPending}
                        >
                            {updateGroupMutation.isPending ? "Zapisywanie..." : "Zapisz Zmiany"}
                        </Button>
                    </Flex>
                </Dialog.Content>
            </Dialog.Root>
        </Skeleton>
    );
}


export default EditGroupDialog;