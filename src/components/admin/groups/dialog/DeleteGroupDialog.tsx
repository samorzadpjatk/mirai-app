"use client"

import { TrashIcon } from "@radix-ui/react-icons";
import { AlertDialog, Flex, Button, Skeleton } from "@radix-ui/themes"
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "~/trpc/react";

const DeleteGroupDialog = ({
    selectedGroupId,
}: {
    selectedGroupId: string;
}) => {
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const router = useRouter();
    const { data: selectedGroup, isLoading } = api.group.getById.useQuery({ id: selectedGroupId });
    const deleteGroupMutation = api.group.delete.useMutation({
        onSuccess: async () => {
            router.refresh();
            setIsDeleteDialogOpen(false);
        },
        onError: (error) => {
            console.error("Error deleting group:", error);
        },
    });
    return (
        <Skeleton loading={isLoading}><AlertDialog.Root open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialog.Trigger>
                <Button
                    size={{ "initial": "1", "xs": "2", "sm": "3" }}
                    variant="soft"
                    color="red"
                    onClick={() => {
                        setIsDeleteDialogOpen(true);
                    }}
                >
                    <TrashIcon />
                </Button>
            </AlertDialog.Trigger>
            <AlertDialog.Content>
                <AlertDialog.Title>Usuń Gildię</AlertDialog.Title>
                <AlertDialog.Description>
                    Czy na pewno chcesz usunąć gildię &quot;{selectedGroup?.name}&quot;?
                    Ta akcja jest nieodwracalna i usunie wszystkich członków oraz historię transakcji.
                </AlertDialog.Description>
                <Flex gap={{ "initial": "1" }} mt="4" justify="end">
                    <AlertDialog.Cancel>
                        <Button variant="soft" color="gray">
                            Anuluj
                        </Button>
                    </AlertDialog.Cancel>
                    <AlertDialog.Action>
                        <Button
                            variant="solid"
                            color="red"
                            onClick={() => selectedGroup && deleteGroupMutation.mutate({ id: selectedGroup.id })}
                            disabled={deleteGroupMutation.isPending}
                        >
                            {deleteGroupMutation.isPending ? "Usuwanie..." : "Usuń"}
                        </Button>
                    </AlertDialog.Action>
                </Flex>
            </AlertDialog.Content>
        </AlertDialog.Root>
        </Skeleton>
    );
}

export default DeleteGroupDialog;