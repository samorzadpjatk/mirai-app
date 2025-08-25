"use client"

import { MinusIcon } from "@radix-ui/react-icons";
import { AlertDialog, Flex, Button } from "@radix-ui/themes";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "~/trpc/react";

const RemoveUserFromGroupFormDialog = ({
    selectedUserId,
}: {
    selectedUserId: string;
}) => {
    const router = useRouter();
    const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
    const { data: selectedUser } = api.user.getByIdWithGroup.useQuery({ id: selectedUserId });
    const removeUserMutation = api.group.removeUserFromGroup.useMutation({
        onSuccess: () => {
            setIsRemoveDialogOpen(false);
            router.refresh();
        },
    });
    return (
        <AlertDialog.Root open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
            <AlertDialog.Trigger>
                <AlertDialog.Trigger>
                    <Button
                        size={{ "initial": "1", "xs": "2", "sm": "3" }}
                        variant="soft"
                        onClick={() => {
                            setIsRemoveDialogOpen(true);
                        }}
                    >
                        <>
                            <MinusIcon />
                            Usuń z gildii
                        </>
                    </Button>
                </AlertDialog.Trigger>
            </AlertDialog.Trigger>
            <AlertDialog.Content>
                <AlertDialog.Title>Usuń z Gildii</AlertDialog.Title>
                <AlertDialog.Description>
                    Czy na pewno chcesz usunąć użytkownika &quot;{selectedUser?.name}&quot;
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