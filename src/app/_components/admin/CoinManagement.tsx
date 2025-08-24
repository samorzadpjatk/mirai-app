"use client";

import { useState } from "react";
import {
    Card,
    Flex,
    Heading,
    Text,
    Button,
    TextField,
    Select,
    Table,
    Badge,
    Strong,
    TextArea,
} from "@radix-ui/themes";
import { PlusIcon, MinusIcon } from "@radix-ui/react-icons";
import { api } from "~/trpc/react";

export default function CoinManagement() {
    const [selectedGroupId, setSelectedGroupId] = useState("");
    const [amount, setAmount] = useState("");
    const [reason, setReason] = useState("");
    const [operation, setOperation] = useState<"add" | "remove">("add");

    // Fetch data
    const { data: groups, isLoading: groupsLoading, refetch } = api.group.getAll.useQuery();

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

    const isLoading = addCoinsMutation.isPending || removeCoinsMutation.isPending;

    if (groupsLoading) {
        return (
            <Flex direction="column" align="center" justify="center" style={{ minHeight: "400px" }}>
                <Text>Ładowanie gildii...</Text>
            </Flex>
        );
    }

    return (
        <Flex direction="column" gap="6">
            {/* Header */}
            <Heading size={{"initial":"1"}}>Zarządzanie Monetami</Heading>

            {/* Coin Operations Form */}
            <Card size={{"initial":"1"}}>
                <Heading size={{"initial":"1"}} mb="4">Operacje na Monetach</Heading>
                
                <Flex direction="column" gap="4">
                    {/* Operation Type */}
                    <Flex gap="3">
                        <Button
                            variant={operation === "add" ? "solid" : "soft"}
                            color="green"
                            onClick={() => setOperation("add")}
                            style={{ flex: 1 }}
                        >
                            <PlusIcon />
                            Dodaj Monety
                        </Button>
                        <Button
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
                        <Text as="label" size={{"initial":"1"}} weight="bold" style={{ display: "block", marginBottom: "8px" }}>
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
                        <Text as="label" size={{"initial":"1"}} weight="bold" style={{ display: "block", marginBottom: "8px" }}>
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
                        <Text as="label" size={{"initial":"1"}} weight="bold" style={{ display: "block", marginBottom: "8px" }}>
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
                        size={{"initial":"1"}}
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
                                        <Text size={{"initial":"1"}} color="red">
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

            {/* Current Groups Status */}
            <Card>
                <Heading size={{"initial":"1"}} mb="4">Aktualny Stan Monet</Heading>
                
                <Table.Root>
                    <Table.Header>
                        <Table.Row>
                            <Table.ColumnHeaderCell>Gildia</Table.ColumnHeaderCell>
                            <Table.ColumnHeaderCell>Kod</Table.ColumnHeaderCell>
                            <Table.ColumnHeaderCell>Organizator</Table.ColumnHeaderCell>
                            <Table.ColumnHeaderCell>Członkowie</Table.ColumnHeaderCell>
                            <Table.ColumnHeaderCell>Monety</Table.ColumnHeaderCell>
                            <Table.ColumnHeaderCell>Ostatnie Transakcje</Table.ColumnHeaderCell>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {groups
                            ?.sort((a, b) => b.coins - a.coins) // Sort by coins descending
                            .map((group, index) => (
                                <Table.Row key={group.id}>
                                    <Table.Cell>
                                        <Flex align="center" gap="2">
                                            {index < 3 && (
                                                <Text>
                                                    {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                                                </Text>
                                            )}
                                            <Strong>{group.name}</Strong>
                                        </Flex>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <Badge variant="soft" color="blue">
                                            {group.code}
                                        </Badge>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <Text size={{"initial":"1"}}>
                                            {group.organizer.name || group.organizer.email || "Nieznany"}
                                        </Text>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <Badge variant="soft" color="green">
                                            {group.members.length}
                                        </Badge>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <Badge 
                                            variant="solid" 
                                            color={group.coins > 0 ? "gold" : "gray"}
                                            size={{"initial":"1"}}
                                        >
                                            💰 {group.coins}
                                        </Badge>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <Flex direction="column" gap="1">
                                            {group.coinTransactions.slice(0, 3).map((transaction) => (
                                                <Text key={transaction.id} size={{"initial":"1"}} style={{ opacity: 0.7 }}>
                                                    {transaction.amount > 0 ? "+" : ""}{transaction.amount} 
                                                    {" "}od {transaction.admin.name}
                                                </Text>
                                            ))}
                                            {group.coinTransactions.length === 0 && (
                                                <Text size={{"initial":"1"}} style={{ opacity: 0.5 }}>
                                                    Brak transakcji
                                                </Text>
                                            )}
                                        </Flex>
                                    </Table.Cell>
                                </Table.Row>
                            ))}
                    </Table.Body>
                </Table.Root>

                {groups?.length === 0 && (
                    <Flex direction="column" align="center" justify="center" style={{ padding: "4rem" }}>
                        <Text size={{"initial":"1"}} style={{ opacity: 0.6 }}>
                            Brak gildii do wyświetlenia
                        </Text>
                        <Text size={{"initial":"1"}} style={{ opacity: 0.5 }}>
                            Najpierw utwórz gildie w zakładce "Gildie"
                        </Text>
                    </Flex>
                )}
            </Card>

            {/* Quick Stats */}
            <Card>
                <Heading size={{"initial":"1"}} mb="4">Statystyki</Heading>
                <Flex gap="6" wrap="wrap">
                    <div>
                        <Text size={{"initial":"1"}} style={{ opacity: 0.7 }}>Łączna liczba monet</Text>
                        <Text size={{"initial":"1"}} weight="bold">
                            💰 {groups?.reduce((sum, group) => sum + group.coins, 0) || 0}
                        </Text>
                    </div>
                    <div>
                        <Text size={{"initial":"1"}} style={{ opacity: 0.7 }}>Liczba gildii</Text>
                        <Text size={{"initial":"1"}} weight="bold">
                            🏛️ {groups?.length ?? 0}
                        </Text>
                    </div>
                    <div>
                        <Text size={{"initial":"1"}} style={{ opacity: 0.7 }}>Średnia monet na gildię</Text>
                        <Text size={{"initial":"1"}} weight="bold">
                            📊 {groups?.length ? Math.round((groups.reduce((sum, group) => sum + group.coins, 0)) / groups.length) : 0}
                        </Text>
                    </div>
                    <div>
                        <Text size={{"initial":"1"}} style={{ opacity: 0.7 }}>Najbogate gildia</Text>
                        <Text size={{"initial":"1"}} weight="bold">
                            🏆 {groups?.sort((a, b) => b.coins - a.coins)[0]?.name || "Brak"}
                        </Text>
                    </div>
                </Flex>
            </Card>
        </Flex>
    );
}
