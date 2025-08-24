"use client";

import {
    Flex,
    Heading,
    Text,
} from "@radix-ui/themes";

import { api } from "~/trpc/react";
import CoinOperationFormCard from "./CoinOperationFormCard";
import CoinOperationCardList from "./CoinOperationCardList";
import CoinQuickStatsCard from "./CoinQuickStatsCard";

export default function CoinManagement() {

    // Fetch data
    const { data: groups, isLoading, refetch } = api.group.getAll.useQuery();

    if (isLoading) {
        return (
            <Flex direction="column" align="center" justify="center" style={{ width: "100%", padding: "1rem" }}>
                <Text>Ładowanie gildii...</Text>
            </Flex>
        );
    }

    return (
        <Flex direction="column" gap="4" style={{ marginTop: "1rem" }}>
            {/* Quick Stats */}
            <CoinQuickStatsCard groups={groups} />

            {/* Header */}
            <Heading size={{ "initial": "1" }}>Zarządzanie Monetami</Heading>

            <CoinOperationFormCard groups={groups} refetch={refetch} />

            {/* Current Groups Status */}
            <CoinOperationCardList groups={groups} />
        </Flex>
    );
}
