import { Card, Flex, Heading, Text, TextField, Button, Separator } from "@radix-ui/themes";
import { db } from "~/server/db";
import { HydrateClient } from "~/trpc/server";

export default async function CreateGroupPage() {
    let message = "";
    let code: string | null = null;

    async function utworzGrupe(formData: FormData) {
        "use server";
        const name = formData.get("name") as string;
        try {
            const group = await db.group.create({
                data: {
                    name,
                    organizerId: "TODO_USER_ID", // Uzupełnij pobieranie ID użytkownika z sesji
                    code: Math.random().toString(36).substring(2, 8).toUpperCase(),
                },
            });
            code = group.code;
            message = "Grupa utworzona!";
        } catch {
            message = "Błąd tworzenia grupy.";
        }
    }

    return (
        <HydrateClient>
            <Flex direction="column" align="center" justify="center" className="mt-8">
                <Card size="3" style={{ maxWidth: 400, width: "100%" }}>
                    <Heading size="4" mb="4">Utwórz nową grupę</Heading>
                    <Separator my="3" size="2" />
                    <form action={utworzGrupe}>
                        <Flex direction="column" gap="3">
                            <label>
                                <Text as="span">Nazwa grupy:</Text>
                                <TextField.Root name="name" required placeholder="Wpisz nazwę grupy" />
                            </label>
                            <Button type="submit" variant="solid">Utwórz grupę</Button>
                        </Flex>
                    </form>
                    {message && <Text mt="4" >{message}</Text>}
                    {code && (
                        <Text mt="4">
                            Kod dostępu do grupy: <span style={{ fontWeight: "bold" }}>{code}</span>
                        </Text>
                    )}
                </Card>
            </Flex>
        </HydrateClient>
    );
}
