import { YStack, Card, H2, Paragraph } from "tamagui";

const Unauthorized = () => {
    return (
        <YStack flex={1} alignItems="center" justifyContent="center" padding="$4" minHeight="60vh">
            <Card elevate bordered padding="$6" maxWidth={500}>
                <YStack alignItems="center" gap="$4">
                    <H2 color="$red10" textAlign="center">
                        🚫 Access Denied
                    </H2>
                    <Paragraph size="$5" textAlign="center">
                        You are not granted the rights to access this chamber.
                    </Paragraph>
                    <Paragraph size="$4" opacity={0.7} textAlign="center">
                        Seek the counsel of the system administrator should you deem this an error.
                    </Paragraph>
                </YStack>
            </Card>
        </YStack>
    );
}

export default Unauthorized;