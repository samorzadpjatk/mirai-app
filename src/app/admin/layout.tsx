import { Card, Flex, Heading, Text } from "@radix-ui/themes";
import { redirect } from "next/navigation";
import { auth } from "~/server/auth";

import Unauthorized from "~/components/Unauthorized";
import AdminNavMenu from "~/components/admin/AdminNavMenu";

export default async function AdminDashboard({ children }: Readonly<{ children: React.ReactNode }>) {
    const session = await auth();

    if (!session?.user) {
        redirect("/auth/login?callbackUrl=/admin");
    }

    const isAdmin = session.user.isAdmin;
    const isModerator = session.user.isModerator;

    if (!isAdmin && !isModerator) {
        return <Unauthorized />;
    }

    return (
        <Flex direction="column" gap={{ "initial": "1" }}>
            {/* Header */}
            <Card size={{ "initial": "1", "xs": "2", "sm": "3" }}>
                <Flex direction="column" align="center" gap="3">
                    <Heading size={{ "initial": "4" }} style={{ fontFamily: "var(--font-robotoslab)" }}>
                        🏰 Chamber of Administration
                    </Heading>
                    <Text size={{ "initial": "1", "xs": "2", "sm": "3" }} align="center" style={{ opacity: 0.8 }}>
                        Manage guilds, users, and coins in the Kingdom
                    </Text>
                </Flex>
            </Card>

            {/* Admin Dashboard Tabs */}
            <Card size={{ "initial": "1", "xs": "2", "sm": "3" }}>
                <AdminNavMenu />
                {children}
            </Card>
        </Flex>
    );

}
