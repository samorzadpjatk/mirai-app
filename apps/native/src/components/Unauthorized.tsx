import { YStack, Card, H2, Paragraph } from "tamagui";

const Unauthorized = () => {
    return (
        <YStack flex={1} items="center" justify="center" p="$4" minH="60vh">
            <Card elevate bordered p="$6" maxW={500}>
                <YStack items="center" gap="$4">
                    <H2 text="center">
                        🚫 Access Denied
                    </H2>
                    <Paragraph size="$5" text="center">
                        You are not granted the rights to access this chamber.
                    </Paragraph>
                    <Paragraph size="$4" opacity={0.7} text="center">
                        Seek the counsel of the system administrator should you deem this an error.
                    </Paragraph>
                </YStack>
            </Card>
        </YStack>
    );
}

export default Unauthorized;