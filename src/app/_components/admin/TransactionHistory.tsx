"use client";

import { useState } from "react";
import {
    Card,
    Flex,
    Heading,
    Text,
    Select,
    Table,
    Badge,
    Strong,
    Button,
} from "@radix-ui/themes";
import { ReloadIcon, DownloadIcon } from "@radix-ui/react-icons";
import { api } from "~/trpc/react";

export default function TransactionHistory() {
    const [selectedGroupId, setSelectedGroupId] = useState<string>("all");
    const [limit, setLimit] = useState(50);

    // Fetch data
    const { data: groups } = api.admin.getAllGroups.useQuery();
    const { 
        data: transactions, 
        isLoading, 
        refetch 
    } = api.admin.getCoinTransactions.useQuery({
        groupId: selectedGroupId && selectedGroupId !== "all" ? selectedGroupId : undefined,
        limit,
    });

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('pl-PL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(new Date(date));
    };

    const formatAmount = (amount: number) => {
        const isPositive = amount > 0;
        return {
            value: isPositive ? `+${amount}` : `${amount}`,
            color: isPositive ? "green" : "red",
            icon: isPositive ? "💰" : "💸",
        };
    };

    return (
        <Flex direction="column" gap="6">
            {/* Header */}
            <Flex justify="between" align="center">
                <Heading size={{"initial":"1"}}>Historia Transakcji</Heading>
                <Button
                    variant="soft"
                    onClick={() => refetch()}
                    disabled={isLoading}
                >
                    <ReloadIcon />
                    Odśwież
                </Button>
            </Flex>

            {/* Filters */}
            <Card>
                <Heading size={{"initial":"1"}} mb="4">Filtry</Heading>
                <Flex gap="4" wrap="wrap">
                    <div style={{ minWidth: "200px" }}>
                        <Text as="label" size={{"initial":"1"}} weight="bold" style={{ display: "block", marginBottom: "8px" }}>
                            Gildia
                        </Text>
                        <Select.Root value={selectedGroupId} onValueChange={setSelectedGroupId}>
                            <Select.Trigger placeholder="Wszystkie gildie" />
                            <Select.Content>
                                <Select.Item value="all">Wszystkie gildie</Select.Item>
                                {groups?.map((group) => (
                                    <Select.Item key={group.id} value={group.id}>
                                        {group.name}
                                    </Select.Item>
                                ))}
                            </Select.Content>
                        </Select.Root>
                    </div>

                    <div style={{ minWidth: "150px" }}>
                        <Text as="label" size={{"initial":"1"}} weight="bold" style={{ display: "block", marginBottom: "8px" }}>
                            Limit wyników
                        </Text>
                        <Select.Root value={limit.toString()} onValueChange={(value) => setLimit(parseInt(value))}>
                            <Select.Trigger />
                            <Select.Content>
                                <Select.Item value="10">10 ostatnich</Select.Item>
                                <Select.Item value="25">25 ostatnich</Select.Item>
                                <Select.Item value="50">50 ostatnich</Select.Item>
                                <Select.Item value="100">100 ostatnich</Select.Item>
                            </Select.Content>
                        </Select.Root>
                    </div>
                </Flex>
            </Card>

            {/* Statistics Cards */}
            {transactions && (
                <Flex gap="4" wrap="wrap">
                    <Card style={{ flex: 1, minWidth: "200px" }}>
                        <Text size={{"initial":"1"}} style={{ opacity: 0.7 }}>Łączne transakcje</Text>
                        <Text size={{"initial":"1"}} weight="bold">
                            📊 {transactions.length}
                        </Text>
                    </Card>
                    <Card style={{ flex: 1, minWidth: "200px" }}>
                        <Text size={{"initial":"1"}} style={{ opacity: 0.7 }}>Dodane monety</Text>
                        <Text size={{"initial":"1"}} weight="bold" color="green">
                            💰 +{transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0)}
                        </Text>
                    </Card>
                    <Card style={{ flex: 1, minWidth: "200px" }}>
                        <Text size={{"initial":"1"}} style={{ opacity: 0.7 }}>Odebrane monety</Text>
                        <Text size={{"initial":"1"}} weight="bold" color="red">
                            💸 {transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0)}
                        </Text>
                    </Card>
                    <Card style={{ flex: 1, minWidth: "200px" }}>
                        <Text size={{"initial":"1"}} style={{ opacity: 0.7 }}>Bilans netto</Text>
                        <Text size={{"initial":"1"}} weight="bold">
                            ⚖️ {transactions.reduce((sum, t) => sum + t.amount, 0)}
                        </Text>
                    </Card>
                </Flex>
            )}

            {/* Transactions Table */}
            <Card>
                {isLoading ? (
                    <Flex direction="column" align="center" justify="center" style={{ minHeight: "400px" }}>
                        <Text>Ładowanie transakcji...</Text>
                    </Flex>
                ) : (
                    <>
                        <Flex justify="between" align="center" mb="4">
                            <Heading size={{"initial":"1"}}>Transakcje</Heading>
                            {/* Future: Export functionality */}
                            {/*
                            <Button variant="soft" size={{"initial":"1"}}>
                                <DownloadIcon />
                                Eksportuj CSV
                            </Button>
                            */}
                        </Flex>

                        <Table.Root>
                            <Table.Header>
                                <Table.Row>
                                    <Table.ColumnHeaderCell>Data</Table.ColumnHeaderCell>
                                    <Table.ColumnHeaderCell>Gildia</Table.ColumnHeaderCell>
                                    <Table.ColumnHeaderCell>Kwota</Table.ColumnHeaderCell>
                                    <Table.ColumnHeaderCell>Administrator</Table.ColumnHeaderCell>
                                    <Table.ColumnHeaderCell>Stan po transakcji</Table.ColumnHeaderCell>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                {transactions?.map((transaction, index) => {
                                    const amountInfo = formatAmount(transaction.amount);
                                    return (
                                        <Table.Row key={transaction.id}>
                                            <Table.Cell>
                                                <Text size={{"initial":"1"}}>
                                                    {formatDate(transaction.createdAt)}
                                                </Text>
                                            </Table.Cell>
                                            <Table.Cell>
                                                <Strong>{transaction.group.name}</Strong>
                                            </Table.Cell>
                                            <Table.Cell>
                                                <Badge 
                                                    variant="solid" 
                                                    color={amountInfo.color as any}
                                                >
                                                    {amountInfo.icon} {amountInfo.value}
                                                </Badge>
                                            </Table.Cell>
                                            <Table.Cell>
                                                <Text size={{"initial":"1"}}>
                                                    {transaction.admin.name || "Nieznany admin"}
                                                </Text>
                                            </Table.Cell>
                                            <Table.Cell>
                                                <Badge variant="soft" color="blue">
                                                    💰 {transaction.group.coins || 0}
                                                </Badge>
                                            </Table.Cell>
                                        </Table.Row>
                                    );
                                })}
                            </Table.Body>
                        </Table.Root>

                        {transactions?.length === 0 && (
                            <Flex direction="column" align="center" justify="center" style={{ padding: "4rem" }}>
                                <Text size={{"initial":"1"}} style={{ opacity: 0.6 }}>
                                    Brak transakcji do wyświetlenia
                                </Text>
                                <Text size={{"initial":"1"}} style={{ opacity: 0.5 }}>
                                    {selectedGroupId 
                                        ? "Ta gildia nie ma jeszcze żadnych transakcji" 
                                        : "Nie ma jeszcze żadnych transakcji w systemie"
                                    }
                                </Text>
                            </Flex>
                        )}
                    </>
                )}
            </Card>

            {/* Additional Insights */}
            {transactions && transactions.length > 0 && (
                <Card>
                    <Heading size={{"initial":"1"}} mb="4">Analiza</Heading>
                    <Flex direction="column" gap="3">
                        {(() => {
                            // Most active admin
                            const adminStats = transactions.reduce((acc, t) => {
                                const adminName = t.admin.name || "Nieznany";
                                if (!acc[adminName]) acc[adminName] = { count: 0, amount: 0 };
                                acc[adminName].count++;
                                acc[adminName].amount += t.amount;
                                return acc;
                            }, {} as Record<string, { count: number; amount: number }>);

                            const mostActiveAdmin = Object.entries(adminStats)
                                .sort(([,a], [,b]) => b.count - a.count)[0];

                            // Most recent activity
                            const recentTransactions = transactions.slice(0, 5);

                            return (
                                <>
                                    <div>
                                        <Text size={{"initial":"1"}} weight="bold">Najbardziej aktywny administrator:</Text>
                                        <Text size={{"initial":"1"}} style={{ marginLeft: "8px" }}>
                                            {mostActiveAdmin?.[0]} ({mostActiveAdmin?.[1].count} transakcji)
                                        </Text>
                                    </div>
                                    
                                    <div>
                                        <Text size={{"initial":"1"}} weight="bold">Ostatnie 5 transakcji:</Text>
                                        <Flex direction="column" gap="1" style={{ marginTop: "8px" }}>
                                            {recentTransactions.map((t) => {
                                                const amountInfo = formatAmount(t.amount);
                                                return (
                                                    <Text key={t.id} size={{"initial":"1"}} style={{ opacity: 0.8 }}>
                                                        {formatDate(t.createdAt)} - {t.group.name}: {amountInfo.icon} {amountInfo.value}
                                                    </Text>
                                                );
                                            })}
                                        </Flex>
                                    </div>
                                </>
                            );
                        })()}
                    </Flex>
                </Card>
            )}
        </Flex>
    );
}
