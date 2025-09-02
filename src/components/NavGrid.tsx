import { Button, Flex, Grid, Text } from "@radix-ui/themes";
import Link from "next/link";
import { auth } from "~/server/auth";
import NotificationSettings from "~/components/NotificationSettings";

export default async function NavGrid() {
  const session = await auth();
  return (
      <Flex direction="column" gap="2">
        {session?.user && (
          <>
            <Grid
              columns={"1"}
              gap={"2"}
              rows={"repeat(2, 1fr)"}
              width={"auto"}
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
            </Grid>
            {(session?.user.isAdmin || session?.user.isModerator) && (
              <Button size={"4"} variant="outline">
                <Link href={"/admin/groups"}>
                  <Text>Chamber of Administration</Text>
                </Link>
              </Button>
            )}
            
            {/* Notification Settings for all users */}
            <NotificationSettings showTestFeatures={false} />
          </>
        )}
      </Flex>
  );
}