
import { Card, Flex, Heading, Button, Separator, Container } from "@radix-ui/themes";

import { redirect } from "next/navigation"
import { AuthError } from "next-auth"
import { providerMap, signIn } from "~/server/auth";

const SIGNIN_ERROR_URL = "/error"

export default async function SignInPage(props: {
    searchParams: { callbackUrl: string | undefined }
}) {
    return (
            <Card size="3" style={{ maxWidth: 400 }}>
                <Heading size="4" mb="4">Logowanie</Heading>
                <Separator my="3" size="2" />
                <Flex direction="column" align="center" justify="center">
                    {Object.values(providerMap).map((provider) => (
                        <form
                            key={provider.id}
                            action={async () => {
                                "use server"
                                try {
                                    await signIn(provider.id, {
                                        redirectTo: props.searchParams?.callbackUrl ?? "/",
                                    })
                                } catch (error) {
                                    // Signin can fail for a number of reasons, such as the user
                                    // not existing, or the user not having the correct role.
                                    // In some cases, you may want to redirect to a custom error
                                    if (error instanceof AuthError) {
                                        return redirect(`${SIGNIN_ERROR_URL}?error=${error.type}`)
                                    }

                                    // Otherwise if a redirects happens Next.js can handle it
                                    // so you can just re-thrown the error and let Next.js handle it.
                                    // Docs:
                                    // https://nextjs.org/docs/app/api-reference/functions/redirect#server-component
                                    throw error
                                }
                            }}
                        >
                            <Button type="submit" variant="solid">
                                Zaloguj się przez {provider.name}
                            </Button>
                        </form>
                    ))}
                </Flex>
            </Card>

    )
}