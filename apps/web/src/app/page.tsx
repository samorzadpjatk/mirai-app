import { getSession } from "~/server/auth";
import PWAInstallPrompt from "~/components/PWAInstallPrompt";
import UnauthenticatedFrontPage from "~/components/UnauthenticatedFrontPage";
import AuthenticatedFrontPage from "~/components/AuthenticatedFrontPage";
import NotificationSettings from "~/components/NotificationSettings";
import { Flex, ScrollArea } from "@radix-ui/themes";

export default async function Home() {
  const session = await getSession();

  return (
    <ScrollArea type="hover">
      <Flex gap={"1"} direction="column" justify="center">
        {session?.user ? (
          <>
            <AuthenticatedFrontPage />
            <NotificationSettings />
            <PWAInstallPrompt />
          </>
        ) : (
          <UnauthenticatedFrontPage />
        )}
      </Flex>
    </ScrollArea>
  );
}
