
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
                                    // Wysyłamy pełne dane o błędzie do strony /error
                                    if (error instanceof AuthError) {
                                        const params = new URLSearchParams({
                                            error: String(error.type ?? "Default"),
                                            error_message: String(error.message ?? ""),
                                            error_description: typeof error.cause?.description === "string"
                                                ? error.cause.description
                                                : error.cause?.description
                                                    ? JSON.stringify(error.cause.description)
                                                    : "",
                                            error_details: typeof error.cause?.details === "string"
                                                ? error.cause.details
                                                : error.cause?.details
                                                    ? JSON.stringify(error.cause.details)
                                                    : ""
                                        })
                                        return redirect(`${SIGNIN_ERROR_URL}?${params.toString()}`)
                                    }
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