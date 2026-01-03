import { Trash2 } from "@tamagui/lucide-icons";
import { AlertDialog, XStack, Button, Spinner } from "tamagui";
import { useState } from "react";

interface DeleteGroupDialogProps {
    selectedGroupId: string;
    onRefresh?: () => void;
    onDelete?: (id: string) => void;
    isLoading?: boolean;
    groupName?: string;
}

const DeleteGroupDialog = ({
    selectedGroupId,
    onRefresh,
    onDelete,
    isLoading,
    groupName,
}: DeleteGroupDialogProps) => {
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const handleDelete = () => {
        if (onDelete) {
            onDelete(selectedGroupId);
        }
        setIsDeleteDialogOpen(false);
        if (onRefresh) {
            onRefresh();
        }
    };

    return (
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialog.Trigger asChild>
                <Button
                    size="$3"
                    
                    icon={isLoading ? <Spinner /> : <Trash2 size={16} />}
                    disabled={isLoading}
                />
            </AlertDialog.Trigger>
            <AlertDialog.Portal>
                <AlertDialog.Overlay
                    key="overlay"
                    animation="quick"
                    opacity={0.5}
                    enterStyle={{ opacity: 0 }}
                    exitStyle={{ opacity: 0 }}
                />
                <AlertDialog.Content
                    bordered
                    elevate
                    key="content"
                    animation={[
                        'quick',
                        {
                            opacity: {
                                overshootClamping: true,
                            },
                        },
                    ]}
                    enterStyle={{ x: 0, y: -20, opacity: 0, scale: 0.9 }}
                    exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 }}
                    gap="$4"
                >
                    <AlertDialog.Title>Banish the Guild</AlertDialog.Title>
                    <AlertDialog.Description>
                        Are you certain you wish to banish the guild from existence "{groupName ?? 'this guild'}"?
                        Once executed, this action will strike all members from existence and erase the ledger of their deeds.
                    </AlertDialog.Description>
                    <XStack gap="$2" mt="$4" justify="flex-end">
                        <AlertDialog.Cancel asChild>
                            <Button >
                                Cancel
                            </Button>
                        </AlertDialog.Cancel>
                        <AlertDialog.Action asChild>
                            <Button
                                
                                onPress={handleDelete}
                                disabled={isLoading}
                            >
                                {isLoading ? "Banishing..." : "BANISH"}
                            </Button>
                        </AlertDialog.Action>
                    </XStack>
                </AlertDialog.Content>
            </AlertDialog.Portal>
        </AlertDialog>
    );
}

export default DeleteGroupDialog;