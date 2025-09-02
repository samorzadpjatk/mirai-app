import { Flex, Card, Heading, Text } from "@radix-ui/themes";

const Unauthorized = () => {
    return (
        <Flex direction="column" align="center" justify="center" style={{ minHeight: "60vh" }}>
            <Card size="4">
                <Flex direction="column" align="center" gap="4">
                    <Heading size={{ "initial": "4", "xs": "5", "sm": "6" }} style={{ color: "var(--red-9)" }}>
                        🚫 Access Denied
                    </Heading>
                    <Text size={{ "initial": "1", "xs": "2", "sm": "3" }} align="center">
                        You are not granted the rights to access this chamber.
                    </Text>
                    <Text size={{ "initial": "1", "xs": "2", "sm": "3" }} style={{ opacity: 0.7 }} align="center">
                        Seek the counsel of the system administrator should you deem this an error.
                    </Text>
                </Flex>
            </Card>
        </Flex>
    );
}

export default Unauthorized;