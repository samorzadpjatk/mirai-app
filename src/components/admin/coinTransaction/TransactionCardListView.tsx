"use client"

import useDebounce from "~/utils/debounce";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { Box, Card, Flex, Heading, Text, TextField } from "@radix-ui/themes";
import { useState } from "react";
import { api } from "~/trpc/react";
import TransactionCardList from "./TransactionCardList";
import TransactionListFilterPopover from "./popover/TransactionListFilterPopover";

const TransactionCardListView = () => {
    const [selectedGroupId, setSelectedGroupId] = useState<string>("all");
    const [limit, setLimit] = useState(50);

    const { data: groups, isLoading: isLoadingGroups } = api.group.getAllNames.useQuery();
    const { data: transactions, isLoading: isLoadingTransactions } = api.coinTransaction.getCoinTransactions.useQuery({
        groupId: selectedGroupId && selectedGroupId !== "all" ? selectedGroupId : undefined,
        limit,
    });
    const [filteredTransactions, setFilteredTransactions] = useDebounce(transactions, 300);

    return (
        <Card>
            <Flex direction={"column"} gap="2">
                <Heading size={{ "initial": "1", "xs": "2", "sm": "3" }}>Transakcje</Heading>
                <Flex wrap={"nowrap"} direction={"row"} gap={"1"} align="center" justify={"center"}>
                    <Box width="100%">
                        <TextField.Root
                            style={{ width: "100%" }}
                            placeholder="Filtruj transakcje..."
                            size={{ "initial": "1", "xs": "2", "sm": "3" }}
                            onChange={(e) => {
                                const value = e.target.value.toLowerCase();
                                setFilteredTransactions(
                                    transactions?.filter((transaction) =>
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
                    </Box>

                    <TransactionListFilterPopover
                        groups={groups}
                        selectedGroupId={selectedGroupId}
                        setSelectedGroupId={setSelectedGroupId}
                        limit={limit}
                        setLimit={setLimit}
                        loading={isLoadingGroups}
                    />
                </Flex>

                <TransactionCardList loading={isLoadingTransactions} transactions={filteredTransactions} />

            </Flex>
            {
                filteredTransactions?.length === 0 && (
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

    )
}

export default TransactionCardListView;