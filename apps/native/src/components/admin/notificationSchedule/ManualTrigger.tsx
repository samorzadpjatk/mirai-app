import { Card, YStack, H3, Input, TextArea, Select, Button, Adapt, Sheet } from "tamagui";
import { useState } from "react";

interface Group {
    id: string;
    name: string;
}

interface ManualTriggerProps {
    groups?: Group[];
    onSend?: (groupId: string, title: string, message: string) => void;
}

const ManualTrigger = ({ groups, onSend }: ManualTriggerProps) => {
    const [selectedGroupId, setSelectedGroupId] = useState("");
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");

    const handleSend = () => {
        if (selectedGroupId && title && message && onSend) {
            onSend(selectedGroupId, title, message);
            setSelectedGroupId("");
            setTitle("");
            setMessage("");
        }
    };

    return (
        <Card bordered padding="$4">
            <YStack gap="$4">
                <H3>Send Manual Notification</H3>
                
                <YStack gap="$2">
                    <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                        <Select.Trigger width="100%" iconAfter={null}>
                            <Select.Value placeholder="Select a group" />
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

                <Input
                    placeholder="Title"
                    value={title}
                    onChangeText={setTitle}
                />

                <TextArea
                    placeholder="Message"
                    value={message}
                    onChangeText={setMessage}
                    numberOfLines={5}
                />

                <Button
                    onPress={handleSend}
                    disabled={!selectedGroupId || !title || !message}
                >
                    Send Notification
                </Button>
            </YStack>
        </Card>
    );
};

export default ManualTrigger;
