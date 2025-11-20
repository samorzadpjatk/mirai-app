import { Button, Grid, Text } from "@radix-ui/themes";
import Link from "next/link";
import { getSession } from "~/server/auth";
import { db } from "@integral-2025-app/db";

export default async function NavGrid() {
  const session = await getSession();
  const dbUser = session?.authUserId
    ? await db.user.findUnique({
        where: { authUserId: session.authUserId },
      })
    : null;
  return (
    <>
      {session?.user && dbUser && (
        <>
          <Grid columns={"1"} gap={"2"} rows={"repeat(2, 1fr)"} width={"100%"}>
            {!dbUser.isAdmin && (
              <Button size={"4"} variant="outline">
                <Link href={"/group/my"}>
                  <Text>Your Guild Hall</Text>
                </Link>
              </Button>
            )}
            <Button size={"4"} variant="outline">
              <Link href={"/ranking"}>
                <Text>Leaderboard of Guilds</Text>
              </Link>
            </Button>
            {(dbUser.isAdmin || dbUser.isModerator) && (
              <Button size={"4"} variant="outline">
                <Link href={"/admin/groups"}>
                  <Text>Chamber of Administration</Text>
                </Link>
              </Button>
            )}
            {/* Notifications section for all users */}
            <Button size={"4"} variant="outline">
              <Link href={"/notifications"}>
                <Text>Notifications</Text>
              </Link>
            </Button>
            <Button size={"4"} variant="outline">
              <Link href={"/map"}>
                <Text>Map Viewer</Text>
              </Link>
            </Button>
          </Grid>
        </>
      )}
    </>
  );
}
