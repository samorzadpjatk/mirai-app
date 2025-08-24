"use client";

import { useState } from "react";
import {
    Card,
    Flex,
    Heading,
    Text,
    Select,
    Button,
} from "@radix-ui/themes";
import { ReloadIcon } from "@radix-ui/react-icons";
import { api } from "~/trpc/react";
import TransactionsAdditionalInsights from "~/app/components/admin/coinTransaction/TransactionsAdditionalInsights";
import TransactionStatisticsDataList from "~/app/components/admin/coinTransaction/TransactionStatisticsDataList";
import TransactionCardList from "~/app/components/admin/coinTransaction/TransactionCardList";


export default function TransactionHistory() {
    const [selectedGroupId, setSelectedGroupId] = useState<string>("all");
    const [limit, setLimit] = useState(50);

    // Fetch data
    const { data: groups } = api.group.getAll.useQuery();
    const {
        data: transactions,
        isLoading,
        refetch
    } = api.coinTransaction.getCoinTransactions.useQuery({
        groupId: selectedGroupId && selectedGroupId !== "all" ? selectedGroupId : undefined,
        limit,
    });

    return (
        <Flex direction="column" gap="2" style={{ marginTop: "1em" }}>
            {/* Header */}
            <Flex justify="between" align="center">
                <Heading size={{ "initial": "1" }}>Historia Transakcji</Heading>
                <Button
                    variant="soft"
                    onClick={() => refetch()}
                    disabled={isLoading}
                >
                    <ReloadIcon />
                    Odśwież
                </Button>
            </Flex>

            {/* Additional Insights */}
            <TransactionsAdditionalInsights transactions={transactions} />

            {/* Statistics Cards */}
            <TransactionStatisticsDataList transactions={transactions} />

            {/* Filters */}
            <Heading size={{ "initial": "1" }}>Filtry</Heading>
            <Card>
                <Flex direction={"column"} gap="2">
                    <>
                        <Text as="label" size={{ "initial": "1" }} weight="bold">
                            Gildia
                        </Text>
                        <Select.Root size={{ "initial": "1" }} value={selectedGroupId} onValueChange={setSelectedGroupId}>
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
                        <Text as="label" size={{ "initial": "1" }} weight="bold">
                            Limit wyników
                        </Text>
                        <Select.Root size={{ "initial": "1" }} value={limit.toString()} onValueChange={(value) => setLimit(parseInt(value))}>
                            <Select.Trigger />
                            <Select.Content>
                                <Select.Item value="10">10 ostatnich</Select.Item>
                                <Select.Item value="25">25 ostatnich</Select.Item>
                                <Select.Item value="50">50 ostatnich</Select.Item>
                                <Select.Item value="100">100 ostatnich</Select.Item>
                            </Select.Content>
                        </Select.Root>
                    </>
                </Flex>
            </Card>

            {/* Transactions Table */}
            <TransactionCardList selectedGroupId={selectedGroupId} transactions={transactions} />
        </Flex>
    );
}
