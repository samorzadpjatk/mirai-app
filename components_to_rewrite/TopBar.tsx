import { HomeIcon } from "@radix-ui/react-icons";
import { Flex, Avatar, Button, IconButton, Text } from "@radix-ui/themes";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAuth } from "@integral-2025-app/auth";
import { createSupabaseClient } from "@integral-2025-app/supabase";
import { db } from "@integral-2025-app/db";
import { env } from "~/env";

export default async function TopBar() {
  const supabase = createSupabaseClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const { user, dbUser } = await requireAuth(supabase, async (authUserId: string) => {
    const user = await db.user.findFirst({
      where: { authUserId },
    });
    return user;
  });

  async function handleSign() {
    "use server";
    if (user) {
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
        {user && dbUser && (
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
              value={user ? "Sign Out" : "Sign In"}
            />
          </Button>
        </form>
      </Flex>
    </Flex>
  );
}
