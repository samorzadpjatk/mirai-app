"use client"

import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { Card, Flex, Heading, DataList, Strong, Badge, Text, TextField } from "@radix-ui/themes";
import { Suspense, useState } from "react";
import useDebounce from "~/app/utils/debounce";
import { formatAmount, formatDate } from "~/app/utils/format";
import type { CoinTransactionWithAllFields } from "~/types/schema";

const TransactionCardList = ({ transactions, selectedGroupId }: { transactions: CoinTransactionWithAllFields[], selectedGroupId: string }) => {
    const [filteredTransactions, setFilteredTransactions] = useState(transactions);
    const debouncedFilteredTransactions = useDebounce(filteredTransactions, 300);

    return (
        <Suspense fallback={<Flex direction="column" align="center" justify="center" style={{ padding: "1rem", width: "100%" }}>
            <Text>Ładowanie transakcji...</Text>
        </Flex>}>
            <>
                <Flex direction="column" gap={"2"}>
                    <Heading size={{ "initial": "1" }}>Transakcje</Heading>
                    <TextField.Root
                        placeholder="Filtruj transakcje..."
                        size={{ initial: "1" }}
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
                    {debouncedFilteredTransactions?.map((transaction) => {
                        const amountInfo = formatAmount(transaction.amount);
                        return (
                            <Card key={transaction.id}>
                                <DataList.Root size={{ initial: "1" }}>
                                    <DataList.Item>
                                        <DataList.Label>Data</DataList.Label>
                                        <DataList.Value>
                                            <Text size={{ "initial": "1" }}>
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
                                            <Text size={{ "initial": "1" }}>
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
                                                <Text size={{ "initial": "1" }}>
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

                {debouncedFilteredTransactions?.length === 0 && (
                    <Flex direction="column" justify="center" style={{ padding: "4rem" }}>
                        <Text size={{ "initial": "1" }} style={{ opacity: 0.6 }}>
                            Brak transakcji do wyświetlenia
                        </Text>
                        <Text size={{ "initial": "1" }} style={{ opacity: 0.5 }}>
                            {selectedGroupId
                                ? "Ta gildia nie ma jeszcze żadnych transakcji"
                                : "Nie ma jeszcze żadnych transakcji w systemie"
                            }
                        </Text>
                    </Flex>
                )}
            </>
        </Suspense>
    )
}

export default TransactionCardList;