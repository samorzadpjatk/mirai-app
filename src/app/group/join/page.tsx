import { Card, Flex, Heading, Text, TextField, Button, Separator } from "@radix-ui/themes";
import { redirect } from "next/navigation";
import { db } from "~/server/db";
import { auth } from "~/server/auth";
import { HydrateClient } from "~/trpc/server";

export default async function JoinGroupPage() {
    const session = await auth();
    
    // Redirect unauthenticated users to login
    if (!session?.user) {
        redirect("/auth/login?callbackUrl=/group/join");
    }
    let message = "";

    async function dolaczDoGrupy(formData: FormData) {
        "use server";
        const currentSession = await auth();
        if (!currentSession?.user) {
            message = "Błąd: Brak sesji użytkownika.";
            return;
        }
        
        const code = formData.get("code") as string;
        try {
            const group = await db.group.findUnique({ where: { code } });
            if (!group) {
                message = "Grupa o podanym kodzie nie istnieje.";
                return;
            }
            await db.userGroup.create({
                data: {
                    userId: currentSession.user.id,
                    groupId: group.id,
                },
            });
            message = "Dołączono do grupy!";
        } catch {
            message = "Błąd dołączania do grupy.";
        }
    }

    return (
        <HydrateClient>
            <Flex direction="column" align="center" justify="center" className="mt-8">
                <Card size="3" style={{ maxWidth: 400, width: "100%" }}>
                    <Heading size="4" mb="4">Dołącz do grupy</Heading>
                    <Separator my="3" size="2" />
                    <form action={dolaczDoGrupy}>
                        <Flex direction="column" gap="3">
                            <label>
                                <Text as="span">Kod dostępu:</Text>
                                <TextField.Root name="code" required placeholder="Wpisz kod dostępu" />
                            </label>
                            <Button type="submit" variant="solid">Dołącz</Button>
                        </Flex>
                    </form>
                    {message && <Text mt="4" >{message}</Text>}
                </Card>
            </Flex>
        </HydrateClient>
    );
}
