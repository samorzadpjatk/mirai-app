"use client"

import { MinusIcon } from "@radix-ui/react-icons";
import { AlertDialog, Flex, Button, Skeleton } from "@radix-ui/themes";
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
    const { data: selectedUser, isLoading: isLoadingUser } = api.user.getByIdWithGroup.useQuery({ id: selectedUserId });
    const removeUserMutation = api.group.removeUserFromGroup.useMutation({
        onSuccess: () => {
            setIsRemoveDialogOpen(false);
            router.refresh();
        },
    });
    return (
        <Skeleton loading={isLoadingUser}>
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
                                Banish from the Guild
                            </>
                        </Button>
                    </AlertDialog.Trigger>
                </AlertDialog.Trigger>
                <AlertDialog.Content>
                    <AlertDialog.Title>Banish from the Guild</AlertDialog.Title>
                    <AlertDialog.Description>
                        Do you dare to banish &quot;{selectedUser?.name}&quot;
                        from the guild &quot;{selectedUser?.groups?.[0]?.group?.name ?? "Unknown"}&quot;?
                    </AlertDialog.Description>
                    <Flex gap="3" mt="4" justify="end">
                        <AlertDialog.Cancel>
                            <Button variant="soft" color="gray">
                                Cancel
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
                                {removeUserMutation.isPending ? "Banishing..." : "BANISH"}
                            </Button>
                        </AlertDialog.Action>
                    </Flex>
                </AlertDialog.Content>
            </AlertDialog.Root>
        </Skeleton>
    );
}

export default RemoveUserFromGroupFormDialog;