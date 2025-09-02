import { HomeIcon } from "@radix-ui/react-icons";
import { Flex, Avatar, Button, IconButton, Text } from "@radix-ui/themes";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "~/server/auth";
import LoadingIndicator from "./LoadingIndicator";

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
    <Flex p={{ "initial": "2" }} position={{ "initial": "sticky" }} direction="row" justify="between" align="center" gap="2" width="100%">
      <Link href="/">
        <IconButton>
          <HomeIcon />
        </IconButton>
      </Link>
      <Flex direction="row" align="center" gap="2">
        {session?.user && (
          <Flex direction="row" align="center" justify="center" gap="2">
            <Avatar
              variant={"solid"}
              size={{ "initial": "1", "xs": "2", "sm": "3" }}
              fallback={session.user.name?.split(" ").map((name) => name[0]).join("") ?? ""}
              src={session.user.image ?? undefined}
            />
            <Text size={{ "initial": "1", "xs": "2", "sm": "3" }} weight="bold" wrap="pretty">
              {session.user.name}
            </Text>
          </Flex>
        )}
        <LoadingIndicator />
        <form action={handleSign}>
          <Button>
            <input type="submit" value={session?.user ? "Sign Out" : "Sign In"} />
          </Button>
        </form>
      </Flex>
    </Flex>
  );
}