"use client"

import useDebounce from "~/utils/debounce";
import { GearIcon, MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { Card, Flex, Heading, DataList, Strong, Badge, Text, TextField, Select, Popover, Button } from "@radix-ui/themes";
import { Suspense, useState } from "react";
import { formatAmount, formatDate } from "~/utils/format";
import { api } from "~/trpc/react";

const TransactionCardList = () => {
    const [open, setOpen] = useState(false);
    const [selectedGroupId, setSelectedGroupId] = useState<string>("all");
    const [limit, setLimit] = useState(50);

    const { data: groups } = api.group.getAll.useQuery();
    const { data: transactions } = api.coinTransaction.getCoinTransactions.useQuery({
        groupId: selectedGroupId && selectedGroupId !== "all" ? selectedGroupId : undefined,
        limit,
    });
    const [filteredTransactions, setFilteredTransactions] = useState(transactions);
    const debouncedFilteredTransactions = useDebounce(filteredTransactions, 300);

    if (!transactions) return null;
    return (
        <Suspense fallback={<Flex direction="column" align="center" justify="center" style={{ padding: "1rem", width: "100%" }}>
            <Text>Ładowanie transakcji...</Text>
        </Flex>}>
            <Card>
                <Flex direction={"column"} gap="2">
                    <Heading size={{ "initial": "1", "xs": "2", "sm": "3" }}>Transakcje</Heading>
                    <Flex direction={"row"} gap={"1"} align="center" justify={"center"}>
                        <Flex width="100%">
                            <TextField.Root
                                style={{ width: "100%" }}
                                placeholder="Filtruj transakcje..."
                                size={{ "initial": "1", "xs": "2", "sm": "3" }}
                                onChange={(e) => {
                                    const value = e.target.value.toLowerCase();
                                    setFilteredTransactions(
                                        transactions.filter((transaction) =>
                                            (selectedGroupId !== "all" && transaction.id == selectedGroupId) ||
                                            transaction.group.name.toLowerCase().includes(value) ||
                                            transaction.admin.name?.toLowerCase().includes(value)
                                        )
                                    );
                                }}
                            >
                                <TextField.Slot>
                                    <MagnifyingGlassIcon />
                                </TextField.Slot>
                            </TextField.Root>
                        </Flex>

                        <Popover.Root open={open} onOpenChange={setOpen}>
                            <Popover.Trigger>
                                <Button size={{ "initial": "1", "xs": "2", "sm": "3" }} onClick={() => setOpen(!open)}>
                                    <GearIcon />
                                </Button>
                            </Popover.Trigger>
                            <Popover.Content>
                                <Flex direction="column" gap="2">
                                    <>
                                        <Text as="label" size={{ "initial": "1", "xs": "2", "sm": "3" }} weight="bold">
                                            Gildia
                                        </Text>
                                        <Select.Root size={{ "initial": "1", "xs": "2", "sm": "3" }} value={selectedGroupId} onValueChange={setSelectedGroupId}>
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
                                    </>

                                    <>
                                        <Text as="label" size={{ "initial": "1", "xs": "2", "sm": "3" }} weight="bold">
                                            Limit wyników
                                        </Text>
                                        <Select.Root size={{ "initial": "1", "xs": "2", "sm": "3" }} value={limit.toString()} onValueChange={(value) => setLimit(parseInt(value))}>
                                            <Select.Trigger />
                                            <Select.Content>
                                                <Select.Item value="10">10 ostatnich</Select.Item>
                                                <Select.Item value="25">25 ostatnich</Select.Item>
                                                <Select.Item value="50">50 ostatnich</Select.Item>
                                                <Select.Item value="100">100 ostatnich</Select.Item>
                                            </Select.Content>
                                        </Select.Root>
                                    </></Flex>
                            </Popover.Content>
                        </Popover.Root>
                    </Flex>
                    {debouncedFilteredTransactions?.map((transaction) => {
                        const amountInfo = formatAmount(transaction.amount);
                        return (
                            <Card key={transaction.id}>
                                <DataList.Root size={{ initial: "1" }}>
                                    <DataList.Item>
                                        <DataList.Label>Data</DataList.Label>
                                        <DataList.Value>
                                            <Text size={{ "initial": "1", "xs": "2", "sm": "3" }}>
                                                {formatDate(transaction.createdAt)}
                                            </Text>
                                        </DataList.Value>
                                    </DataList.Item>
                                    <DataList.Item>
                                        <DataList.Label>Gildia</DataList.Label>
                                        <DataList.Value>
                                            <Strong>{transaction.group.name}</Strong>
                                        </DataList.Value>
                                    </DataList.Item>
                                    <DataList.Item>
                                        <DataList.Label>Kwota</DataList.Label>
                                        <DataList.Value>
                                            <Badge
                                                variant="solid"
                                                color={amountInfo.color as "green" | "red" | "orange" | "blue"}
                                            >
                                                {amountInfo.icon} {amountInfo.value}
                                            </Badge>
                                        </DataList.Value>
                                    </DataList.Item>
                                    <DataList.Item>
                                        <DataList.Label>Administrator</DataList.Label>
                                        <DataList.Value>
                                            <Text size={{ "initial": "1", "xs": "2", "sm": "3" }}>
                                                {transaction.admin.name ?? "Nieznany admin"}
                                            </Text>
                                        </DataList.Value>
                                    </DataList.Item>
                                    <DataList.Item>
                                        <DataList.Label>Stan po transakcji</DataList.Label>
                                        <DataList.Value>
                                            <Badge variant="soft" color="blue">
                                                💰 {transaction.group.coins ?? 0}
                                            </Badge>
                                        </DataList.Value>
                                    </DataList.Item>
                                    {transaction.reason && (
                                        <DataList.Item>
                                            <DataList.Label>Powód</DataList.Label>
                                            <DataList.Value>
                                                <Text size={{ "initial": "1", "xs": "2", "sm": "3" }}>
                                                    {transaction.reason}
                                                </Text>
                                            </DataList.Value>
                                        </DataList.Item>
                                    )}
                                </DataList.Root>
                            </Card>
                        );
                    })}
                </Flex>
                {
                    debouncedFilteredTransactions?.length === 0 && (
                        <Flex direction="column" justify="center" style={{ padding: "4rem" }}>
                            <Text size={{ "initial": "1", "xs": "2", "sm": "3" }} style={{ opacity: 0.6 }}>
                                Brak transakcji do wyświetlenia
                            </Text>
                            <Text size={{ "initial": "1", "xs": "2", "sm": "3" }} style={{ opacity: 0.5 }}>
                                {selectedGroupId
                                    ? "Ta gildia nie ma jeszcze żadnych transakcji"
                                    : "Nie ma jeszcze żadnych transakcji w systemie"
                                }
                            </Text>
                        </Flex>
                    )
                }
            </Card >
        </Suspense >
    )
}

export default TransactionCardList;