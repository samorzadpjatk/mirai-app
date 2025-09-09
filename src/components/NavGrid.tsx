import { Button, Grid, Text } from "@radix-ui/themes";
import Link from "next/link";
import { auth } from "~/server/auth";

export default async function NavGrid() {
  const session = await auth();
  return (<>
    {session?.user && (
      <>
        <Grid
          columns={"1"}
          gap={"2"}
          rows={"repeat(2, 1fr)"}
          width={"100%"}
        >
          <Button size={"4"} variant="outline">
            <Link href={"/group/my"}>
              <Text>Your Guild Hall</Text>
            </Link>
          </Button>
          <Button size={"4"} variant="outline">
            <Link href={"/ranking"}>
              <Text>Leaderboard of Guilds</Text>
            </Link>
          </Button>
          {(session?.user.isAdmin || session?.user.isModerator) && (
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
        </Grid>
      </>
    )}
  </>
  );
}