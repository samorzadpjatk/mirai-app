import type { Group } from "@prisma/client";
import { AlertDialog, Flex, Button } from "@radix-ui/themes"
import type { QueryObserver } from "@tanstack/react-query";
import { api } from "~/trpc/react";

const DeleteGroupDialog = ({
    selectedGroup,
    setSelectedGroup,
    refetch,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen
}: {
    selectedGroup: Group | null;
    setSelectedGroup: (group: Group | null) => void;
    refetch: QueryObserver["refetch"];
    isDeleteDialogOpen: boolean;
    setIsDeleteDialogOpen: (open: boolean) => void;
}) => {
    const deleteGroupMutation = api.group.delete.useMutation({
        onSuccess: async () => {
            await refetch();
            setIsDeleteDialogOpen(false);
            setSelectedGroup(null);
        },
        onError: (error) => {
            console.error("Error deleting group:", error);
        },
    });
    return (
        <AlertDialog.Root open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
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
        </AlertDialog.Root>);
}

export default DeleteGroupDialog;