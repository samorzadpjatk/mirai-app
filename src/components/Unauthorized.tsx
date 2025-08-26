import { Flex, Card, Heading, Text } from "@radix-ui/themes";

const Unauthorized = () => {
    return (
        <Flex direction="column" align="center" justify="center" style={{ minHeight: "60vh" }}>
            <Card size="4">
                <Flex direction="column" align="center" gap="4">
                    <Heading size={{ "initial": "4", "xs": "5", "sm": "6" }} style={{ color: "var(--red-9)" }}>
                        🚫 Brak dostępu
                    </Heading>
                    <Text size={{ "initial": "1", "xs": "2", "sm": "3" }} align="center">
                        Nie masz uprawnień potrzebnych do dostępu do tego panelu.
                    </Text>
                    <Text size={{ "initial": "1", "xs": "2", "sm": "3" }} style={{ opacity: 0.7 }} align="center">
                        Skontaktuj się z administratorem systemu, jeśli uważasz, że to błąd.
                    </Text>
                </Flex>
            </Card>
        </Flex>
    );
}

export default Unauthorized;