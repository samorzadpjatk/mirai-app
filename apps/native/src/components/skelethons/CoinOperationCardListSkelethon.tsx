import { YStack, Card, Spinner } from "tamagui";

const CoinOperationCardListSkeleton = () => {
    return (
        <YStack justify="center" items="center" p="$6">
            <Card bordered p="$6" items="center" justify="center">
                <Spinner size="large" />
            </Card>
        </YStack>
    );
}

export default CoinOperationCardListSkeleton;
