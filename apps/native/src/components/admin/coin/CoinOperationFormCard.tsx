import { Plus, Minus } from "@tamagui/lucide-icons";
import { Card, H3, YStack, XStack, Button, Select, Input, TextArea, Paragraph, Label, Adapt, Sheet } from "tamagui";
import { useState } from "react";

interface Group {
    id: string;
    name: string;
    coins: number;
}

interface CoinOperationFormCardProps {
    groups?: Group[];
    isLoading?: boolean;
    onAddCoins?: (groupId: string, amount: number, reason?: string) => void;
    onRemoveCoins?: (groupId: string, amount: number, reason?: string) => void;
}

const CoinOperationFormCard = ({
    groups,
    isLoading,
    onAddCoins,
    onRemoveCoins,
}: CoinOperationFormCardProps) => {
    const [selectedGroupId, setSelectedGroupId] = useState("");
    const [amount, setAmount] = useState("");
    const [reason, setReason] = useState("");
    const [operation, setOperation] = useState<"add" | "remove">("add");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const resetForm = () => {
        setSelectedGroupId("");
        setAmount("");
        setReason("");
    };

    const handleSubmit = () => {
        if (!selectedGroupId || !amount || parseInt(amount) <= 0) return;

        setIsSubmitting(true);
        const coinData = {
            groupId: selectedGroupId,
            amount: parseInt(amount),
            reason: reason || undefined,
        };

        if (operation === "add" && onAddCoins) {
            onAddCoins(coinData.groupId, coinData.amount, coinData.reason);
        } else if (operation === "remove" && onRemoveCoins) {
            onRemoveCoins(coinData.groupId, coinData.amount, coinData.reason);
        }

        resetForm();
        setIsSubmitting(false);
    };

    const selectedGroup = groups?.find(g => g.id === selectedGroupId);
    const requestedAmount = parseInt(amount) || 0;
    const currentCoins = selectedGroup?.coins ?? 0;
    const showWarning = operation === "remove" && selectedGroupId && amount && requestedAmount > currentCoins;

    return (
        <Card bordered p="$4">
            <H3 mb="$4">Treasury Operations</H3>

            <YStack gap="$4">
                <XStack gap="$3">
                    <Button
                        flex={1}
                        
                        onPress={() => setOperation("add")}
                        icon={<Plus size={16} />}
                    >
                        Add coins
                    </Button>
                    <Button
                        flex={1}
                        
                        onPress={() => setOperation("remove")}
                        icon={<Minus size={16} />}
                    >
                        Seize coins
                    </Button>
                </XStack>

                <YStack gap="$2">
                    <Label fontWeight="bold">Select Guild</Label>
                    <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                        <Select.Trigger width="100%" iconAfter={null}>
                            <Select.Value placeholder="Select Guild..." />
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
                                        <Select.ItemText>
                                            {group.name} (💰 {group.coins} coins)
                                        </Select.ItemText>
                                    </Select.Item>
                                ))}
                            </Select.Viewport>
                            <Select.ScrollDownButton />
                        </Select.Content>
                    </Select>
                </YStack>

                <YStack gap="$2">
                    <Label fontWeight="bold">Treasury</Label>
                    <Input
                        keyboardType="numeric"
                        value={amount}
                        onChangeText={(e) => setAmount(e.nativeEvent.text)}
                        placeholder="e.g. 100"
                    />
                </YStack>

                <YStack gap="$2">
                    <Label fontWeight="bold">Justification (optional)</Label>
                    <TextArea
                        value={reason}
                        onChangeText={(e) => setReason(e.nativeEvent.text)}
                        placeholder="e.g. Reward for Victory in the Tournament"
                        numberOfLines={3}
                    />
                </YStack>

                <Button
                    onPress={handleSubmit}
                    disabled={!selectedGroupId || !amount || requestedAmount <= 0 || isSubmitting || isLoading}
                    
                >
                    {isSubmitting || isLoading ? (
                        operation === "add" ? "Adding..." : "Seizing..."
                    ) : (
                        operation === "add" ?
                            `💰 Add ${requestedAmount} coins` :
                            `💸 Seize ${requestedAmount} coins`
                    )}
                </Button>

                {showWarning && (
                    <Card bg="$red2" borderColor="$red6" bordered p="$3">
                        <Paragraph color="$red10">
                            ⚠️ Beware: The guild's treasury holds a mere {currentCoins} coins,
                            yet you dare to seize {requestedAmount} coins!
                        </Paragraph>
                    </Card>
                )}
            </YStack>
        </Card>
    );
}

export default CoinOperationFormCard;
