import {
  Card,
  Flex,
  Heading,
  Button,
  Separator,
  DataList,
  Text,
} from "@radix-ui/themes";
import { createServerSupabaseClient } from "~/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function SignInPage(props: {
  searchParams: Promise<{ callbackUrl: string | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const callbackUrl = searchParams?.callbackUrl ?? "/";

  async function signInWithAuthentik() {
    "use server";
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "keycloak",
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:11000"}/auth/callback?callbackUrl=${encodeURIComponent(callbackUrl)}`,
      },
    });

    if (error) {
      console.error("Sign in error:", error);
      return;
    }

    if (data.url) {
      redirect(data.url);
    }
  }

  return (
    <Flex direction="column" gap={"1"}>
      <Card size={"5"}>
        <Flex direction="column" align="center" justify="center">
          <Heading size={"7"}>Enter the Realm</Heading>
          <Separator my="3" size="2" />
          <form action={signInWithAuthentik}>
            <Button size={"2"} type="submit" variant="solid">
              Log in via Student Council Page
            </Button>
          </form>
        </Flex>
      </Card>
      <Card size={"5"}>
        <DataList.Root orientation="vertical">
          <DataList.Item>
            <DataList.Label>
              You provided the Student ID during registration:
            </DataList.Label>
            <DataList.Value>
              <Text>
                Log in with your university e-mail (
                <Text weight={"bold"}>XXXXXX</Text>@pjwstk.edu.pl), where{" "}
                <Text weight={"bold"}>XXXXXX</Text> is your Student ID provided
                during registration for the camp
              </Text>
            </DataList.Value>
          </DataList.Item>
          <DataList.Item>
            <DataList.Label>New student without their IDs:</DataList.Label>
            <DataList.Value>
              Log in with the e-mail provided during registration for the camp
            </DataList.Value>
          </DataList.Item>
        </DataList.Root>
      </Card>
    </Flex>
  );
}
