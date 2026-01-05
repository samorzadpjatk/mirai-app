import { useState } from "react";
import { Button, XStack, AlertDialog } from "tamagui";
import { Minus } from "@tamagui/lucide-icons";

interface RemoveUserFromGroupFormDialogProps {
    selectedUserId: string;
    isLoading?: boolean;
    onRemove?: (userId: string) => void;
}

const RemoveUserFromGroupFormDialog = ({
    selectedUserId,
    isLoading,
    onRemove,
}: RemoveUserFromGroupFormDialogProps) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleRemove = () => {
        if (onRemove) {
            onRemove(selectedUserId);
            setIsOpen(false);
        }
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
            <AlertDialog.Trigger asChild>
                <Button
                    size="$3"
                    
                    icon={<Minus size={16} />}
                    disabled={isLoading}
                >
                    Remove from Guild
                </Button>
            </AlertDialog.Trigger>

            <AlertDialog.Portal>
                <AlertDialog.Overlay key="overlay" animation="quick" opacity={0.5} />
                <AlertDialog.Content bordered elevate key="content" gap="$4">
                    <AlertDialog.Title>Remove from Guild</AlertDialog.Title>
                    <AlertDialog.Description>
                        Are you sure you want to remove this user from their guild?
                    </AlertDialog.Description>

                    <XStack gap="$3" justify="flex-end">
                        <AlertDialog.Cancel asChild>
                            <Button >Cancel</Button>
                        </AlertDialog.Cancel>
                        <AlertDialog.Action asChild>
                            <Button  onPress={handleRemove}>
                                Remove
                            </Button>
                        </AlertDialog.Action>
                    </XStack>
                </AlertDialog.Content>
            </AlertDialog.Portal>
        </AlertDialog>
    );
};

export default RemoveUserFromGroupFormDialog;
