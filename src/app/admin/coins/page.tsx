"use client"

import {
    Flex,
    Heading,
    Text,
} from "@radix-ui/themes";

import { api } from "~/trpc/react";

import { Suspense } from "react";
import CoinQuickStatsCard from "~/app/components/admin/coin/CoinQuickStatsCard";
import CoinOperationFormCard from "~/app/components/admin/coin/CoinOperationFormCard";
import CoinOperationCardList from "~/app/components/admin/coin/CoinOperationCardList";

export default function CoinManagement() {

    // Fetch data
    const {data: groups, refetch} = api.group.getAll.useQuery();

    return (
        <Suspense fallback={<><Flex direction="column" align="center" justify="center" style={{ width: "100%", padding: "1rem" }}><Text>Ładowanie gildii...</Text></Flex></>}>
            <Flex direction="column" gap="4" style={{ marginTop: "1rem" }}>
                {/* Quick Stats */}
                <CoinQuickStatsCard groups={groups} />

                {/* Header */}
                <Heading size={{ "initial": "1" }}>Zarządzanie Monetami</Heading>

                <CoinOperationFormCard refetch={refetch} groups={groups} />

                {/* Current Groups Status */}
                <CoinOperationCardList groups={groups} />
            </Flex>
        </Suspense>
    );
}
