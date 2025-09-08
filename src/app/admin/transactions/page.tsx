import {
    Flex,
    Heading
} from "@radix-ui/themes";
import TransactionsAdditionalInsights from "~/components/admin/coinTransaction/TransactionsAdditionalInsights";
import TransactionStatisticsDataList from "~/components/admin/coinTransaction/TransactionStatisticsDataList";
import TransactionCardListView from "~/components/admin/coinTransaction/TransactionCardListView";
import RefreshButton from "~/components/RefreshButton";


export default function TransactionHistory() {
    return (
        <Flex direction="column" gap="2">
            {/* Header */}
            <Flex justify="between" align="center">
                <Heading size={{ "initial": "1", "xs": "2", "sm": "3" }}>Transaction History</Heading>
                <RefreshButton />
            </Flex>

            {/* Additional Insights */}
            <TransactionsAdditionalInsights />

            {/* Statistics Cards */}
            <TransactionStatisticsDataList />

            {/* Transactions Table */}
            <TransactionCardListView />
        </Flex>
    );
}
