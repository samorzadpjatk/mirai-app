
import { Card, Flex, Heading, Button, Separator } from "@radix-ui/themes";

import { signIn } from "~/server/auth";

export default async function SignInPage(props: {
    searchParams: Promise<{ callbackUrl: string | undefined }>
}) {
    const searchParams = await props.searchParams;

    return (
        <Card size="3">
            <Flex direction="column" align="center" justify="center">
                <Heading size="4">Logowanie</Heading>
                <Separator my="3" size="2" />
                <form
                    action={async () => {
                        "use server"
                        await signIn("authentik", {
                            redirectTo: searchParams?.callbackUrl ?? "/",
                        })
                    }}
                >
                    <Button type="submit" variant="solid">
                        Zaloguj się przez Samorząd
                    </Button>
                </form>

            </Flex>
        </Card>

    )
}