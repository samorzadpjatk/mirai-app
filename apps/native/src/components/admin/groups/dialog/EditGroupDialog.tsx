import { Pencil } from "@tamagui/lucide-icons";
import { Dialog, YStack, XStack, Input, Select, Separator, Badge, Button, Paragraph, Label, Spinner, Adapt, Sheet } from "tamagui";
import { useState } from "react";

interface Admin {
    id: string;
    name: string | null;
}

interface Group {
    id: string;
    name: string;
    code: string;
    coins: number;
    organizer: {
        id: string;
        name: string | null;
    };
    _count: {
        members: number;
    };
}

interface EditGroupDialogProps {
    selectedGroupId: string;
    group?: Group;
    adminUsers?: Admin[];
    isLoading?: boolean;
    onRefresh?: () => void;
    onUpdate?: (id: string, name: string, organizerId: string) => void;
}

const EditGroupDialog = ({
    selectedGroupId,
    group,
    adminUsers,
    isLoading,
    onRefresh,
    onUpdate,
}: EditGroupDialogProps) => {
    const [name, setName] = useState<string | undefined>(undefined);
    const [organizerId, setOrganizerId] = useState<string | undefined>(undefined);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    const handleEditSubmit = async () => {
        if (!group || !name?.trim() || !organizerId) return;
        
        setIsUpdating(true);
        if (onUpdate) {
            onUpdate(group.id, name, organizerId);
        }
        setIsUpdating(false);
        setIsEditDialogOpen(false);
        if (onRefresh) {
            onRefresh();
        }
    };

    const handleOpenChange = (open: boolean) => {
        if (open && group) {
            setName(group.name);
            setOrganizerId(group.organizer.id);
        }
        setIsEditDialogOpen(open);
    };

    if (isLoading) {
        return <Spinner />;
    }

    return (
        <Dialog open={isEditDialogOpen} onOpenChange={handleOpenChange}>
            <Dialog.Trigger asChild>
                <Button
                    size="$3"
                    icon={<Pencil size={16} />}
                />
            </Dialog.Trigger>

            <Adapt when="sm" platform="touch">
                <Sheet animation="medium" zIndex={200000} modal dismissOnSnapToBottom>
                    <Sheet.Frame padding="$4" gap="$4">
                        <Adapt.Contents />
                    </Sheet.Frame>
                    <Sheet.Overlay animation="lazy" enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} />
                </Sheet>
            </Adapt>

            <Dialog.Portal>
                <Dialog.Overlay
                    key="overlay"
                    animation="quick"
                    opacity={0.5}
                    enterStyle={{ opacity: 0 }}
                    exitStyle={{ opacity: 0 }}
                />
                <Dialog.Content
                    bordered
                    elevate
                    key="content"
                    animateOnly={['transform', 'opacity']}
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
                    <Dialog.Title>Refine the Guild</Dialog.Title>
                    <Dialog.Description>
                        Alter the Guild's Records "{group?.name}".
                    </Dialog.Description>

                    <YStack gap="$4" marginTop="$4">
                        <YStack gap="$2">
                            <Label htmlFor="name" fontWeight="bold">
                                The Guild's Heralded Name
                            </Label>
                            <Input
                                id="name"
                                value={name}
                                onChangeText={setName}
                                placeholder="e.g. Knights of the Round Table"
                            />
                        </YStack>

                        <XStack gap="$2" alignItems="center" flexWrap="wrap">
                            <Label fontWeight="bold">
                                Assigned
                            </Label>
                            <Select value={organizerId} onValueChange={setOrganizerId}>
                                <Select.Trigger width="$15" iconAfter={null}>
                                    <Select.Value placeholder="Select organizer" />
                                </Select.Trigger>

                                <Adapt when="sm" platform="touch">
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
                                        {adminUsers?.map((user) => (
                                            <Select.Item key={user.id} value={user.id} index={0}>
                                                <Select.ItemText>{user.name ?? "Unknown"}</Select.ItemText>
                                            </Select.Item>
                                        ))}
                                    </Select.Viewport>
                                    <Select.ScrollDownButton />
                                </Select.Content>
                            </Select>
                        </XStack>

                        <Separator />

                        <YStack gap="$2">
                            <Paragraph fontWeight="bold">Current Guild Stats:</Paragraph>
                            <XStack gap="$4" marginTop="$2" flexWrap="wrap">
                                <Badge backgroundColor="$blue10" color="$background">
                                    Code: {group?.code}
                                </Badge>
                                <Badge backgroundColor="$green10" color="$background">
                                    {group?._count.members} companions
                                </Badge>
                                <Badge backgroundColor="$yellow10" color="$background">
                                    💰 {group?.coins} coins
                                </Badge>
                            </XStack>
                        </YStack>
                    </YStack>

                    <XStack gap="$3" marginTop="$4" justifyContent="flex-end">
                        <Dialog.Close asChild>
                            <Button theme="alt1">
                                Cancel
                            </Button>
                        </Dialog.Close>
                        <Button
                            onPress={handleEditSubmit}
                            disabled={!name?.trim() || isUpdating}
                        >
                            {isUpdating ? "Saving..." : "Save changes"}
                        </Button>
                    </XStack>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog>
    );
}

export default EditGroupDialog;
