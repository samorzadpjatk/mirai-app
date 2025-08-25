import { Button, Flex, Grid, Text } from "@radix-ui/themes";
import Link from "next/link";
import { auth } from "~/server/auth";

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
                  <Text>Twoja gildia</Text>
                </Link>
              </Button>
              <Button size={"4"} variant="outline">
                <Link href={"/ranking"}>
                  <Text>Ranking gildii</Text>
                </Link>
              </Button>
            </Grid>
            {session?.user.isAdmin && (
              <Button size={"4"} variant="outline">
                <Link href={"/admin/groups"}>
                  <Text>Panel administracyjny</Text>
                </Link>
              </Button>
            )}
          </>
        )}
      </Flex>
  );
}