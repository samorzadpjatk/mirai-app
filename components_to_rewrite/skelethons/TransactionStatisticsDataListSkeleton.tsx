import { YStack, Card, Spinner } from "tamagui";

const TransactionStatisticsDataListSkeleton = () => {
    return (
        <YStack justifyContent="center" alignItems="center" padding="$6">
            <Card bordered padding="$6" alignItems="center" justifyContent="center">
                <Spinner size="large" color="$gray10" />
            </Card>
        </YStack>
    );
}

export default TransactionStatisticsDataListSkeleton;
