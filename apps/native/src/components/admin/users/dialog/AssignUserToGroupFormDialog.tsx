import { useState } from "react";
import { Button, YStack, XStack, Select, Dialog, Adapt, Sheet } from "tamagui";
import { Plus } from "@tamagui/lucide-icons";

interface Group {
    id: string;
    name: string;
}

interface AssignUserToGroupFormDialogProps {
    selectedUserId: string;
    groups?: Group[];
    isLoading?: boolean;
    onAssign?: (userId: string, groupId: string) => void;
}

const AssignUserToGroupFormDialog = ({
    selectedUserId,
    groups,
    isLoading,
    onAssign,
}: AssignUserToGroupFormDialogProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedGroupId, setSelectedGroupId] = useState("");

    const handleAssign = () => {
        if (selectedGroupId && onAssign) {
            onAssign(selectedUserId, selectedGroupId);
            setIsOpen(false);
            setSelectedGroupId("");
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <Dialog.Trigger asChild>
                <Button size="$3" icon={<Plus size={16} />} disabled={isLoading}>
                    Assign to Guild
                </Button>
            </Dialog.Trigger>

            <Adapt when={true} platform="touch">
                <Sheet animation="medium" zIndex={200000} modal dismissOnSnapToBottom>
                    <Sheet.Frame p="$4" gap="$4">
                        <Adapt.Contents />
                    </Sheet.Frame>
                    <Sheet.Overlay animation="lazy" enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} />
                </Sheet>
            </Adapt>

            <Dialog.Portal>
                <Dialog.Overlay key="overlay" animation="quick" opacity={0.5} />
                <Dialog.Content bordered elevate key="content" gap="$4">
                    <Dialog.Title>Assign User to Guild</Dialog.Title>
                    <Dialog.Description>
                        Select a guild to assign this user to
                    </Dialog.Description>

                    <YStack gap="$4">
                        <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                            <Select.Trigger width="100%" iconAfter={null}>
                                <Select.Value placeholder="Select a guild" />
                            </Select.Trigger>

                            <Adapt when={true} platform="touch">
                                <Sheet modal dismissOnSnapToBottom>
                                    <Sheet.Frame>
                                        <Sheet.ScrollView>
                                            <Adapt.Contents />
                                        </Sheet.ScrollView>
                                    </Sheet.Frame>
                                    <Sheet.Overlay animation="lazy" enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} />
                                </Sheet>
                            </Adapt>

                            <Select.Content zIndex={200000}>
                                <Select.ScrollUpButton />
                                <Select.Viewport>
                                    {groups?.map((group, index) => (
                                        <Select.Item key={group.id} value={group.id} index={index}>
                                            <Select.ItemText>{group.name}</Select.ItemText>
                                        </Select.Item>
                                    ))}
                                </Select.Viewport>
                                <Select.ScrollDownButton />
                            </Select.Content>
                        </Select>
                    </YStack>

                    <XStack gap="$3" justify="flex-end">
                        <Dialog.Close asChild>
                            <Button >Cancel</Button>
                        </Dialog.Close>
                        <Button onPress={handleAssign} disabled={!selectedGroupId}>
                            Assign
                        </Button>
                    </XStack>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog>
    );
};

export default AssignUserToGroupFormDialog;
