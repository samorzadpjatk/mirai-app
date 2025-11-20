import { Box, Card, Flex, Heading, Text } from "@radix-ui/themes";
import { redirect } from "next/navigation";
import { getSession } from "~/server/auth";
import { db } from "@integral-2025-app/db";

import Unauthorized from "~/components/Unauthorized";
import AdminNavMenu from "~/components/admin/AdminNavMenu";

export default async function AdminDashboard({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getSession();

  if (!session?.user) {
    redirect("/auth/login?callbackUrl=/admin");
  }

  const dbUser = await db.user.findUnique({
    where: { authUserId: session.authUserId! },
  });

  const isAdmin = dbUser?.isAdmin ?? false;
  const isModerator = dbUser?.isModerator ?? false;

  if (!isAdmin && !isModerator) {
    return <Unauthorized />;
  }

  return (
    <Flex direction="column" gap={{ initial: "1" }}>
      {/* Header */}
      <Card size={{ initial: "1", xs: "2", sm: "3" }}>
        <Flex direction="column" align="center" gap="3">
          <Heading
            size={{ initial: "4" }}
            style={{ fontFamily: "var(--font-robotoslab)" }}
          >
            🏰 Chamber of Administration
          </Heading>
          <Text
            size={{ initial: "1", xs: "2", sm: "3" }}
            align="center"
            style={{ opacity: 0.8 }}
          >
            Manage guilds, users, and coins in the Kingdom
          </Text>
        </Flex>
      </Card>

      {/* Admin Dashboard Tabs */}
      <Card size={{ initial: "1", xs: "2", sm: "3" }}>
        <AdminNavMenu isAdmin />
        <Box style={{ marginTop: "0.5rem" }}>{children}</Box>
      </Card>
    </Flex>
  );
}
