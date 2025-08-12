import { Card, Flex, Heading, Button, Separator, Strong } from "@radix-ui/themes";

import { signOut } from "~/server/auth";

export default async function SignOutPage() {
    return (
        <Card size="3" style={{ maxWidth: 400, width: "100%" }}>
            <Heading size="4" mb="4">Wylogowanie</Heading>
            <Strong>Czy na pewno chcesz się wylogować?</Strong>
            <Separator my="3" size="2" />
            <Flex direction="column" align="center" justify="center">
                <form
                    action={async () => {
                        "use server"
                        await signOut({
                            redirectTo: "/"
                        })
                    }}
                >
                    <Button type="submit" variant="solid">
                        Wyloguj się
                    </Button>
                </form>
            </Flex>
        </Card>
    )
}