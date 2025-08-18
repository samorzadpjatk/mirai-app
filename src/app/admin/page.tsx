
import { Card, Flex, Heading, Text, TextField, Button, Separator } from "@radix-ui/themes";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { HydrateClient } from "~/trpc/server";

export default async function AdminPanel() {
    const session = await auth();

    let message = "";

    async function grantCoins(formData: FormData) {
        "use server";
        const groupId = formData.get("groupId") as string;
        const amount = Number(formData.get("amount"));
        if (!session?.user?.groups?.includes("admin-group-name")) {
            message = "Brak uprawnień administratora.";
            return;
        }
        try {
            await db.group.update({
                where: { id: groupId },
                data: { coins: { increment: amount } },
            });
            await db.coinTransaction.create({
                data: {
                    groupId,
                    amount,
                    adminId: session.user.id,
                },
            });
            message = "Monety zostały przyznane!";
        } catch {
            message = "Błąd przyznawania monet.";
        }
    }

    if (!session?.user?.groups?.includes("admin-group-name")) {
        return <div>Brak uprawnień administratora.</div>;
    }

    return (
        <HydrateClient>
            <Flex direction="column" align="center" justify="center" className="mt-8">
                <Card size="3" style={{ maxWidth: 400, width: "100%" }}>
                    <Heading size="4" mb="4">Panel administratora: przyznawanie monet</Heading>
                    <Separator my="3" size="2" />
                    <form action={grantCoins}>
                        <Flex direction="column" gap="3">
                            <label>
                                <Text as="span">ID grupy:</Text>
                                <TextField.Root name="groupId" required placeholder="Wpisz ID grupy" />
                            </label>
                            <label>
                                <Text as="span">Liczba monet:</Text>
                                <TextField.Root name="amount" type="number" required min={1} placeholder="Wpisz liczbę monet" />
                            </label>
                            <Button type="submit" variant="solid">Przyznaj monety</Button>
                        </Flex>
                    </form>
                    {message && <Text mt="4">{message}</Text>}
                </Card>
            </Flex>
        </HydrateClient>
    );
}
