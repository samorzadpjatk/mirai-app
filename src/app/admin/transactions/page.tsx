import {
    Flex,
    Heading, Text
} from "@radix-ui/themes";
import TransactionsAdditionalInsights from "~/components/admin/coinTransaction/TransactionsAdditionalInsights";
import TransactionStatisticsDataList from "~/components/admin/coinTransaction/TransactionStatisticsDataList";
import TransactionCardList from "~/components/admin/coinTransaction/TransactionCardList";
import RefreshButton from "~/components/RefreshButton";
import { Suspense } from "react";


export default function TransactionHistory() {
    return (
        <Suspense fallback={<Flex direction="column" align="center" justify="center" style={{ width: "100%", padding: "1rem" }}>
            <Text size={{ "initial": "1", "xs": "2", "sm": "3" }}>Ładowanie transakcji...</Text>
        </Flex>}>
            <Flex direction="column" gap="2" style={{ marginTop: "1em" }}>
                {/* Header */}
                <Flex justify="between" align="center">
                    <Heading size={{ "initial": "1", "xs": "2", "sm": "3" }}>Historia Transakcji</Heading>
                    <RefreshButton />
                </Flex>

                {/* Additional Insights */}
                <TransactionsAdditionalInsights />

                {/* Statistics Cards */}
                <TransactionStatisticsDataList />

                {/* Transactions Table */}
                <TransactionCardList />
            </Flex></Suspense>
    );
}
