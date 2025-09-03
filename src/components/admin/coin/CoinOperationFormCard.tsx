"use client"

import { PlusIcon, MinusIcon } from "@radix-ui/react-icons"
import { Card, Heading, Flex, Button, Select, TextField, TextArea, Text } from "@radix-ui/themes"
import { useRouter } from "next/navigation"

import { useState } from "react"
import { api } from "~/trpc/react"
import { useOfflineCoinMutation } from "~/hooks/useUniversalOfflineMutation"

const CoinOperationFormCard = () => {
    const router = useRouter();
    const { data: groups } = api.group.getAll.useQuery();
    const [selectedGroupId, setSelectedGroupId] = useState("");
    const [amount, setAmount] = useState("");
    const [reason, setReason] = useState("");
    const [operation, setOperation] = useState<"add" | "remove">("add");

    // Enhanced mutations with universal offline handling
    const offlineAddCoins = useOfflineCoinMutation('add');
    const offlineRemoveCoins = useOfflineCoinMutation('remove');
    
    const { mutation: addCoinsMutation, offlineStatus: addOfflineStatus } = offlineAddCoins(() => 
        api.coin.addCoins.useMutation({
            onSuccess: () => {
                resetForm();
                router.refresh();
            }
        })
    );

    const { mutation: removeCoinsMutation, offlineStatus: removeOfflineStatus } = offlineRemoveCoins(() => 
        api.coin.removeCoins.useMutation({
            onSuccess: () => {
                resetForm();
                router.refresh();
            }
        })
    );

    // Combined offline status
    const offlineStatus = addOfflineStatus || removeOfflineStatus;

    const isLoading = addCoinsMutation.isPending || removeCoinsMutation.isPending;

    const resetForm = () => {
        setSelectedGroupId("");
        setAmount("");
        setReason("");
    };

    const handleSubmit = () => {
        if (!selectedGroupId || !amount || parseInt(amount) <= 0) return;

        const coinData = {
            groupId: selectedGroupId,
            amount: parseInt(amount),
            reason: reason || undefined,
        };

        if (operation === "add") {
            addCoinsMutation.mutate(coinData);
        } else {
            removeCoinsMutation.mutate(coinData);
        }
    };

    return (
        <Card size={{ "initial": "1", "xs": "2", "sm": "3" }}>
            <Heading size={{ "initial": "1", "xs": "2", "sm": "3" }} mb="4">Treasury Operations</Heading>

            <Flex direction="column" gap="4">
                {/* Operation Type */}
                <Flex gap="3">
                    <Button
                        size={{ "initial": "1", "xs": "2", "sm": "3" }}
                        variant={operation === "add" ? "solid" : "soft"}
                        color="green"
                        onClick={() => setOperation("add")}
                        style={{ flex: 1 }}
                    >
                        <PlusIcon />
                        Add coins
                    </Button>
                    <Button
                        size={{ "initial": "1", "xs": "2", "sm": "3" }}
                        variant={operation === "remove" ? "solid" : "soft"}
                        color="red"
                        onClick={() => setOperation("remove")}
                        style={{ flex: 1 }}
                    >
                        <MinusIcon />
                        Seize coins
                    </Button>
                </Flex>

                {/* Group Selection */}
                <div>
                    <Text as="label" size={{ "initial": "1", "xs": "2", "sm": "3" }} weight="bold" style={{ display: "block", marginBottom: "8px" }}>
                        Select Guild
                    </Text>
                    <Select.Root value={selectedGroupId} onValueChange={setSelectedGroupId}>
                        <Select.Trigger placeholder="Select Guild..." />
                        <Select.Content>
                            {groups?.map((group) => (
                                <Select.Item key={group.id} value={group.id}>
                                    {group.name} (💰 {group.coins} coins)
                                </Select.Item>
                            ))}
                        </Select.Content>
                    </Select.Root>
                </div>

                {/* Amount */}
                <div>
                    <Text as="label" size={{ "initial": "1", "xs": "2", "sm": "3" }} weight="bold" style={{ display: "block", marginBottom: "8px" }}>
                        Treasury
                    </Text>
                    <TextField.Root
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="np. 100"
                        min="1"
                    />
                </div>

                {/* Reason (Optional) */}
                <div>
                    <Text as="label" size={{ "initial": "1", "xs": "2", "sm": "3" }} weight="bold" style={{ display: "block", marginBottom: "8px" }}>
                        Justification (optional)
                    </Text>
                    <TextArea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="e.g. Reward for Victory in the Tournament"
                        rows={3}
                    />
                </div>

                {/* Submit Button */}
                <Button
                    size={{ "initial": "1", "xs": "2", "sm": "3" }}
                    onClick={handleSubmit}
                    disabled={!selectedGroupId || !amount || parseInt(amount) <= 0 || isLoading}
                    color={operation === "add" ? "green" : "red"}
                    variant="solid"
                >
                    {isLoading ? (
                        operation === "add" ? "Adding..." : "Seizing..."
                    ) : (
                        operation === "add" ?
                            `💰 Add ${amount || 0} coins` :
                            `💸 Seize ${amount || 0} coins`
                    )}
                </Button>

                {/* Show validation warnings */}
                {operation === "remove" && selectedGroupId && amount && groups && (
                    (() => {
                        const selectedGroup = groups.find(g => g.id === selectedGroupId);
                        const requestedAmount = parseInt(amount);
                        const currentCoins = selectedGroup?.coins ?? 0;

                        if (requestedAmount > currentCoins) {
                            return (
                                <Card variant="surface" style={{ backgroundColor: "var(--red-2)", border: "1px solid var(--red-6)" }}>
                                    <Text size={{ "initial": "1", "xs": "2", "sm": "3" }} color="red">
                                        ⚠️ Beware: The guild’s treasury holds a mere {currentCoins} coins,
                                        yet you dare to seize {requestedAmount} coins!
                                    </Text>
                                </Card>
                            );
                        }

                        return null;
                    })()
                )}

                {/* Offline Status Indicator */}
                {offlineStatus && (
                    <Card 
                        variant="surface" 
                        style={{ 
                            backgroundColor: offlineStatus.includes('saved for later') ? "var(--orange-2)" : "var(--red-2)", 
                            border: offlineStatus.includes('saved for later') ? "1px solid var(--orange-6)" : "1px solid var(--red-6)" 
                        }}
                    >
                        <Text 
                            size={{ "initial": "1", "xs": "2", "sm": "3" }} 
                            color={offlineStatus.includes('saved for later') ? "orange" : "red"}
                        >
                            {offlineStatus}
                        </Text>
                        {offlineStatus.includes('saved for later') && (
                            <Text size="1" color="gray" style={{ display: 'block', marginTop: '8px' }}>
                                Request will be automatically retried when connection is restored.
                            </Text>
                        )}
                    </Card>
                )}
            </Flex>
        </Card>
    )
}

export default CoinOperationFormCard;