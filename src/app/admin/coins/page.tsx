import {
    Flex,
    Heading,
    Text,
} from "@radix-ui/themes";

import { Suspense } from "react";
import CoinQuickStatsCard from "~/components/admin/coin/CoinQuickStatsCard";
import CoinOperationFormCard from "~/components/admin/coin/CoinOperationFormCard";
import CoinOperationCardList from "~/components/admin/coin/CoinOperationCardList";

export default function CoinManagement() {

    return (
        <Suspense fallback={<><Flex direction="column" align="center" justify="center" style={{ width: "100%", padding: "1rem" }}><Text size={{ "initial": "1", "xs": "2", "sm": "3" }}>Ładowanie gildii...</Text></Flex></>}>
            <Flex direction="column" gap="4" style={{ marginTop: "1rem" }}>
                {/* Quick Stats */}
                <CoinQuickStatsCard />

                {/* Header */}
                <Heading size={{ "initial": "1", "xs": "2", "sm": "3" }}>Zarządzanie Monetami</Heading>

                <CoinOperationFormCard />

                {/* Current Groups Status */}
                <CoinOperationCardList />
            </Flex>
        </Suspense>
    );
}
