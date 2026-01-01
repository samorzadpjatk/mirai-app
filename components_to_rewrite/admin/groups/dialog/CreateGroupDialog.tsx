import { Dialog, YStack, XStack, Input, Select, Button, Paragraph, Label, Spinner, Adapt, Sheet } from "tamagui";
import { useState } from "react";
import { Plus } from "@tamagui/lucide-icons";

interface Admin {
    id: string;
    name: string | null;
}

interface CreateGroupDialogProps {
    adminUsers?: Admin[];
    isLoading?: boolean;
    onRefresh?: () => void;
    onCreate?: (name: string, organizerId?: string) => void;
}

const CreateGroupDialog = ({ adminUsers, isLoading, onRefresh, onCreate }: CreateGroupDialogProps) => {
    const [name, setName] = useState("");
    const [organizerId, setOrganizerId] = useState("");
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    const handleCreateSubmit = async () => {
        if (name.trim() && onCreate) {
            setIsCreating(true);
            const finalOrganizerId = organizerId === "__default__" ? undefined : organizerId || undefined;
            onCreate(name.trim(), finalOrganizerId);
            setIsCreating(false);
            setName("");
            setOrganizerId("");
            setIsCreateDialogOpen(false);
            if (onRefresh) {
                onRefresh();
            }
        }
    };

    return (
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <Dialog.Trigger asChild>
                <Button size="$4" icon={isLoading ? <Spinner /> : <Plus size={20} />} disabled={isLoading}>
                    <Paragraph>Forge the Guild</Paragraph>
                </Button>
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
                    <Dialog.Title>Forge a new Guild</Dialog.Title>
                    <Dialog.Description>
                        Forge a new Guild for the brave participants of the event.
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
                                Assigned <Paragraph size="$2" color="$gray11">(optional)</Paragraph>
                            </Label>
                            <Select value={organizerId} onValueChange={setOrganizerId}>
                                <Select.Trigger width="$20" iconAfter={null}>
                                    <Select.Value placeholder="Leave empty = you become organizer" />
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
                                        <Select.Item value="__default__" index={0}>
                                            <Select.ItemText color="$gray11">(The role of organizer falls upon you)</Select.ItemText>
                                        </Select.Item>
                                        {adminUsers?.map((user, index) => (
                                            <Select.Item key={user.id} value={user.id} index={index + 1}>
                                                <Select.ItemText>{user.name ?? "Unknown"}</Select.ItemText>
                                            </Select.Item>
                                        ))}
                                    </Select.Viewport>
                                    <Select.ScrollDownButton />
                                </Select.Content>
                            </Select>
                        </XStack>
                    </YStack>

                    <XStack gap="$2" marginTop="$4" justifyContent="flex-end">
                        <Dialog.Close asChild>
                            <Button theme="alt1">
                                Cancel
                            </Button>
                        </Dialog.Close>
                        <Button
                            onPress={handleCreateSubmit}
                            disabled={!name.trim() || isCreating}
                        >
                            {isCreating ? "Forging..." : "Forge the Guild"}
                        </Button>
                    </XStack>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog>
    );
}

export default CreateGroupDialog;
