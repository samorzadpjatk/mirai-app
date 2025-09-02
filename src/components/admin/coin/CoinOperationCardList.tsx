"use client"

import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { Card, Heading, Flex, Strong, Badge, Text, DataList, TextField } from "@radix-ui/themes";
import { Suspense } from "react";
import useDebounce from "~/utils/debounce";
import { api } from "~/trpc/react";
import CoinOperationCardListSkeleton from "~/components/skelethons/CoinOperationCardListSkelethon";

const CoinOperationCardList = () => {
    const { data: groups } = api.group.getAll.useQuery();
    const [filteredGroups, setFilteredGroups] = useDebounce(groups, 300);

    if (!groups) return null;

    return (<Suspense fallback={<CoinOperationCardListSkeleton />}>
        <Heading size={{ "initial": "1", "xs": "2", "sm": "3" }}>Coins in Possession</Heading>
        <TextField.Root
            placeholder="Filter Guilds..."
            size={{ initial: "1" }}
            onChange={(e) => {
                const value = e.target.value.toLowerCase();
                setFilteredGroups(
                    groups.filter((group) =>
                        group.name.toLowerCase().includes(value) ||
                        group.organizer.name?.toLowerCase().includes(value)
                    )
                );
            }}
        >
            <TextField.Slot>
                <MagnifyingGlassIcon />
            </TextField.Slot>
        </TextField.Root>
        <Flex direction="column" justify="center">
            {filteredGroups?.length === 0 && (<>
                <Text size={{ "initial": "1", "xs": "2", "sm": "3" }} style={{ opacity: 0.6 }}>
                    The realm holds no guilds to display.
                </Text>
                <Text size={{ "initial": "1", "xs": "2", "sm": "3" }} style={{ opacity: 0.5 }}>
                    Begin by creating a guild under the &quot;Guilds&quot; section;
                </Text>
            </>
            )}
            {filteredGroups
                ?.sort((a, b) => b.coins - a.coins) // Sort by coins descending
                .map((group, index) => (
                    <Card key={group.id}>
                        <DataList.Root >
                            <DataList.Item>
                                <DataList.Label>Guild</DataList.Label>
                                <DataList.Value>
                                    <Flex align="center" gap="2">
                                        {index < 3 && (
                                            <Text>
                                                {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                                            </Text>
                                        )}
                                        <Strong>{group.name}</Strong>
                                    </Flex>
                                </DataList.Value>
                            </DataList.Item>
                            <DataList.Item>
                                <DataList.Label>Organizer</DataList.Label>
                                <DataList.Value>{group.organizer.name}</DataList.Value>
                            </DataList.Item>
                            <DataList.Item>
                                <DataList.Label>Companions</DataList.Label>
                                <DataList.Value>
                                    <Badge variant="soft" color="green">
                                        {group.members.length} members
                                    </Badge>
                                </DataList.Value>
                            </DataList.Item>
                            <DataList.Item>
                                <DataList.Label>Coins</DataList.Label>
                                <DataList.Value>{group.coins}</DataList.Value>
                            </DataList.Item>
                            <DataList.Item>
                                <DataList.Label>Recent Transactions</DataList.Label>
                                <DataList.Value>
                                    <Flex direction="column" gap="1">
                                        {group.coinTransactions.slice(0, 3).map((transaction) => (
                                            <Text key={transaction.id} size={{ "initial": "1", "xs": "2", "sm": "3" }} style={{ opacity: 0.7 }}>
                                                {transaction.amount > 0 ? "+" : ""}{transaction.amount}
                                                {" "}od {transaction.admin.name}
                                            </Text>
                                        ))}
                                        {group.coinTransactions.length === 0 && (
                                            <Text size={{ "initial": "1", "xs": "2", "sm": "3" }} style={{ opacity: 0.5 }}>
                                                No Transactions
                                            </Text>
                                        )}
                                    </Flex>
                                </DataList.Value>
                            </DataList.Item>
                        </DataList.Root>
                    </Card>
                ))}
        </Flex>
    </Suspense>
    );
};

export default CoinOperationCardList;
