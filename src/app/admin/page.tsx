
import { Card, Flex, Heading, Text, Container } from "@radix-ui/themes";
import { redirect } from "next/navigation";
import { auth } from "~/server/auth";

// Import admin dashboard components - we'll make these client components
import AdminDashboardClient from "../components/admin/AdminDashboardClient";

export default async function AdminDashboard() {
    const session = await auth();

    // Redirect if not authenticated
    if (!session?.user) {
        redirect("/auth/login?callbackUrl=/admin");
    }

    // Check admin privileges - either from Authentik groups OR database isAdmin field
    const isAdmin = session.user.groups?.includes("admin-group-name") || session.user.isAdmin;
    
    if (!isAdmin) {
        return (
            <Container>
                <Flex direction="column" align="center" justify="center" style={{ minHeight: "60vh" }}>
                    <Card size="4">
                        <Flex direction="column" align="center" gap="4">
                            <Heading size="6" style={{ color: "var(--red-9)" }}>
                                🚫 Brak dostępu
                            </Heading>
                            <Text align="center">
                                Nie masz uprawnień administratora potrzebnych do dostępu do tego panelu.
                            </Text>
                            <Text size="2" style={{ opacity: 0.7 }} align="center">
                                Skontaktuj się z administratorem systemu, jeśli uważasz, że to błąd.
                            </Text>
                        </Flex>
                    </Card>
                </Flex>
            </Container>
        );
    }

    return <AdminDashboardClient userName={session.user.name} />;
}
