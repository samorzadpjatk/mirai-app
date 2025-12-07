"use client"

import { TrashIcon } from "@radix-ui/react-icons";
import { AlertDialog, Flex, Button, Skeleton } from "@radix-ui/themes"
import { useRouter } from "next/navigation";
import { useState } from "react";

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
                <AlertDialog.Title>Banish the Guild</AlertDialog.Title>
                <AlertDialog.Description>
                    Are you certain you wish to banish the guild from existence &quot;{selectedGroup?.name}&quot;?
                    Once executed, this action will strike all members from existence and erase the ledger of their deeds.
                </AlertDialog.Description>
                <Flex gap={{ "initial": "1" }} mt="4" justify="end">
                    <AlertDialog.Cancel>
                        <Button variant="soft" color="gray">
                            Cancel
                        </Button>
                    </AlertDialog.Cancel>
                    <AlertDialog.Action>
                        <Button
                            variant="solid"
                            color="red"
                            onClick={() => selectedGroup && deleteGroupMutation.mutate({ id: selectedGroup.id })}
                            disabled={deleteGroupMutation.isPending}
                        >
                            {deleteGroupMutation.isPending ? "Banishing..." : "BANISH"}
                        </Button>
                    </AlertDialog.Action>
                </Flex>
            </AlertDialog.Content>
        </AlertDialog.Root>
        </Skeleton>
    );
}

export default DeleteGroupDialog;