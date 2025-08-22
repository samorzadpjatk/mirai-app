import { HomeIcon } from "@radix-ui/react-icons";
import { Flex, Avatar, Button, IconButton, Text } from "@radix-ui/themes";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "~/server/auth";

export default async function TopBar() {
  const session = await auth();

  async function handleSign() {
    "use server";
    if (session?.user) {
      await signOut({
        redirectTo: "/"
      });
    } else {
      redirect("/auth/login");
    }
  }

  return (
    <Flex direction="row" justify="between" align="center" gap="2" width="100%">
      <IconButton>
        <Link href="/">
          <HomeIcon />
        </Link>
      </IconButton>
      <Flex direction="row" align="center" gap="2">
        {session?.user && (
          <Flex direction="row" align="center" justify="center" gap="2">
            <Avatar
              fallback={session.user.name?.split(" ").map((name) => name[0]).join("") ?? ""}
              src={session.user.image ?? undefined}
            />
            <Text weight="bold" wrap="pretty">
              {session.user.name}
            </Text>
          </Flex>
        )}
        <form action={handleSign}>
          <Button>
            <input type="submit" value={session?.user ? "Wyloguj się" : "Zaloguj się"} />
          </Button>
        </form>
      </Flex>
    </Flex>
  );
}