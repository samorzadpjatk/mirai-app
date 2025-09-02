import {
    Flex,
    Heading,
} from "@radix-ui/themes";

import CoinQuickStatsCard from "~/components/admin/coin/CoinQuickStatsCard";
import CoinOperationFormCard from "~/components/admin/coin/CoinOperationFormCard";
import CoinOperationCardList from "~/components/admin/coin/CoinOperationCardList";

export default function CoinManagement() {

    return (
        <Flex direction="column" gap="4" style={{ marginTop: "1rem" }}>
            {/* Quick Stats */}
            <CoinQuickStatsCard />

            {/* Header */}
            <Heading size={{ "initial": "1", "xs": "2", "sm": "3" }}>Coins Management</Heading>

            <CoinOperationFormCard />

            {/* Current Groups Status */}
            <CoinOperationCardList />
        </Flex>
    );
}
