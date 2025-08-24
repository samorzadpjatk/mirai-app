"use client"

import type { Group } from "@prisma/client"
import { PlusIcon, MinusIcon } from "@radix-ui/react-icons"
import { Card, Heading, Flex, Button, Select, TextField, TextArea, Text } from "@radix-ui/themes"
import { useState } from "react"
import { api } from "~/trpc/react"

const CoinOperationFormCard = ({ groups, refetch }: { groups: Group[]; refetch: () => Promise<void> }) => {
    const [selectedGroupId, setSelectedGroupId] = useState("");
    const [amount, setAmount] = useState("");
    const [reason, setReason] = useState("");
    const [operation, setOperation] = useState<"add" | "remove">("add");

    // Mutations
    const addCoinsMutation = api.coin.addCoins.useMutation({
        onSuccess: async () => {
            await refetch();
            resetForm();
        },
    });

    const removeCoinsMutation = api.coin.removeCoins.useMutation({
        onSuccess: async () => {
            await refetch();
            resetForm();
        },
    });

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
        <Card size={{ "initial": "1" }}>
            <Heading size={{ "initial": "1" }} mb="4">Operacje na Monetach</Heading>

            <Flex direction="column" gap="4">
                {/* Operation Type */}
                <Flex gap="3">
                    <Button
                        size={{ "initial": "1" }}
                        variant={operation === "add" ? "solid" : "soft"}
                        color="green"
                        onClick={() => setOperation("add")}
                        style={{ flex: 1 }}
                    >
                        <PlusIcon />
                        Dodaj Monety
                    </Button>
                    <Button
                        size={{ "initial": "1" }}
                        variant={operation === "remove" ? "solid" : "soft"}
                        color="red"
                        onClick={() => setOperation("remove")}
                        style={{ flex: 1 }}
                    >
                        <MinusIcon />
                        Odbierz Monety
                    </Button>
                </Flex>

                {/* Group Selection */}
                <div>
                    <Text as="label" size={{ "initial": "1" }} weight="bold" style={{ display: "block", marginBottom: "8px" }}>
                        Wybierz Gildię
                    </Text>
                    <Select.Root value={selectedGroupId} onValueChange={setSelectedGroupId}>
                        <Select.Trigger placeholder="Wybierz gildię..." />
                        <Select.Content>
                            {groups?.map((group) => (
                                <Select.Item key={group.id} value={group.id}>
                                    {group.name} (💰 {group.coins} monet)
                                </Select.Item>
                            ))}
                        </Select.Content>
                    </Select.Root>
                </div>

                {/* Amount */}
                <div>
                    <Text as="label" size={{ "initial": "1" }} weight="bold" style={{ display: "block", marginBottom: "8px" }}>
                        Liczba Monet
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
                    <Text as="label" size={{ "initial": "1" }} weight="bold" style={{ display: "block", marginBottom: "8px" }}>
                        Powód (opcjonalnie)
                    </Text>
                    <TextArea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="np. Nagroda za wygraną w turnieju"
                        rows={3}
                    />
                </div>

                {/* Submit Button */}
                <Button
                    size={{ "initial": "1" }}
                    onClick={handleSubmit}
                    disabled={!selectedGroupId || !amount || parseInt(amount) <= 0 || isLoading}
                    color={operation === "add" ? "green" : "red"}
                    variant="solid"
                >
                    {isLoading ? (
                        operation === "add" ? "Dodawanie..." : "Odbieranie..."
                    ) : (
                        operation === "add" ?
                            `💰 Dodaj ${amount || 0} monet` :
                            `💸 Odbierz ${amount || 0} monet`
                    )}
                </Button>

                {/* Show validation warnings */}
                {operation === "remove" && selectedGroupId && amount && groups && (
                    (() => {
                        const selectedGroup = groups.find(g => g.id === selectedGroupId);
                        const requestedAmount = parseInt(amount);
                        const currentCoins = selectedGroup?.coins || 0;

                        if (requestedAmount > currentCoins) {
                            return (
                                <Card variant="surface" style={{ backgroundColor: "var(--red-2)", border: "1px solid var(--red-6)" }}>
                                    <Text size={{ "initial": "1" }} color="red">
                                        ⚠️ Ostrzeżenie: Gildia ma tylko {currentCoins} monet,
                                        a próbujesz odebrać {requestedAmount} monet!
                                    </Text>
                                </Card>
                            );
                        }

                        return null;
                    })()
                )}
            </Flex>
        </Card>
    )
}

export default CoinOperationFormCard;