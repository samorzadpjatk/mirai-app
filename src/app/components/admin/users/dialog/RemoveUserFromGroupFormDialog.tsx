import type { Group } from "@prisma/client";
import { AlertDialog, Flex, Button } from "@radix-ui/themes";
import type { User } from "next-auth";
import { api } from "~/trpc/react";

const RemoveUserFromGroupFormDialog = ({
    isRemoveDialogOpen,
    setIsRemoveDialogOpen,
    onMutationSuccess,
    selectedUser,
}: {
    isRemoveDialogOpen: boolean;
    setIsRemoveDialogOpen: (open: boolean) => void;
    onMutationSuccess: () => void;
    selectedUser: User & { group: Group } | null;
}) => {

    const removeUserMutation = api.group.removeUserFromGroup.useMutation({
        onSuccess: onMutationSuccess,
    });
    return (
        <AlertDialog.Root open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
            <AlertDialog.Content>
                <AlertDialog.Title>Usuń z Gildii</AlertDialog.Title>
                <AlertDialog.Description>
                    Czy na pewno chcesz usunąć użytkownika &quot;{selectedUser?.name ?? selectedUser?.email}&quot;
                    z gildii &quot;{selectedUser?.group?.name}&quot;?
                </AlertDialog.Description>
                <Flex gap="3" mt="4" justify="end">
                    <AlertDialog.Cancel>
                        <Button variant="soft" color="gray">
                            Anuluj
                        </Button>
                    </AlertDialog.Cancel>
                    <AlertDialog.Action>
                        <Button
                            variant="solid"
                            color="red"
                            onClick={() => {
                                if (selectedUser) {
                                    removeUserMutation.mutate({
                                        userId: selectedUser.id,
                                    });
                                }
                            }}
                            disabled={removeUserMutation.isPending}
                        >
                            {removeUserMutation.isPending ? "Usuwanie..." : "Usuń"}
                        </Button>
                    </AlertDialog.Action>
                </Flex>
            </AlertDialog.Content>
        </AlertDialog.Root>
    );
}

export default RemoveUserFromGroupFormDialog;