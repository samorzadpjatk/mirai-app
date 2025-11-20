import { HomeIcon } from "@radix-ui/react-icons";
import { Flex, Avatar, Button, IconButton, Text } from "@radix-ui/themes";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "~/server/auth";
import { createServerSupabaseClient } from "~/lib/supabase/server";
import { db } from "@integral-2025-app/db";

export default async function TopBar() {
  const session = await getSession();
  const dbUser = session?.authUserId
    ? await db.user.findUnique({
        where: { authUserId: session.authUserId },
      })
    : null;

  async function handleSign() {
    "use server";
    if (session?.user) {
      const supabase = await createServerSupabaseClient();
      await supabase.auth.signOut();
      redirect("/");
    } else {
      redirect("/auth/login");
    }
  }

  return (
    <Flex
      position={{ initial: "sticky" }}
      direction="row"
      justify="between"
      align="center"
      gap="2"
      width="100%"
    >
      <Link href="/">
        <IconButton>
          <HomeIcon />
        </IconButton>
      </Link>
      <Flex direction="row" align="center" gap="2">
        {session?.user && dbUser && (
          <Flex direction="row" align="center" justify="center" gap="2">
            <Avatar
              variant={"solid"}
              size={{ initial: "1", xs: "2", sm: "3" }}
              fallback={
                dbUser.name
                  ?.split(" ")
                  .map((name) => name[0])
                  .join("") ?? ""
              }
              src={dbUser.image ?? undefined}
            />
            <Text
              size={{ initial: "1", xs: "2", sm: "3" }}
              weight="bold"
              wrap="pretty"
            >
              {dbUser.name}
            </Text>
          </Flex>
        )}
        <form action={handleSign}>
          <Button>
            <input
              type="submit"
              value={session?.user ? "Sign Out" : "Sign In"}
            />
          </Button>
        </form>
      </Flex>
    </Flex>
  );
}
