import { YStack, Card, Spinner } from "tamagui";

const TransactionAdditionalInsightsSkelethon = () => {
    return (
        <YStack justifyContent="center" alignItems="center" padding="$6">
            <Card bordered padding="$6" alignItems="center" justifyContent="center">
                <Spinner size="large" />
            </Card>
        </YStack>
    );
}

export default TransactionAdditionalInsightsSkelethon;
