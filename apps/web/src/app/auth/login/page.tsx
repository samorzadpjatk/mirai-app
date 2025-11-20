import {
  Card,
  Flex,
  Heading,
  Button,
  Separator,
  Text,
  TextField,
  Box,
  Callout,
} from "@radix-ui/themes";
import { createServerSupabaseClient } from "~/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@integral-2025-app/db";
import { env } from "~/env";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { syncUserToDatabase } from "@integral-2025-app/auth";
import type { DatabaseUser } from "@integral-2025-app/auth";

export default async function SignInPage(props: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const searchParams = await props.searchParams;
  const callbackUrl = searchParams?.callbackUrl ?? "/";
  const error = searchParams?.error;
  const isDevelopment = env.NODE_ENV === "development";

  async function signInWithEmail(formData: FormData) {
    "use server";
    const supabase = await createServerSupabaseClient();

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Sign in error:", error);
      redirect(
        `/auth/login?error=${encodeURIComponent(error.message)}&callbackUrl=${encodeURIComponent(callbackUrl)}`,
      );
    }

    // Sync user to database using auth package utility
    if (data.user) {
      await syncUserToDatabase(data.user, async (userData) => {
        return (await db.user.upsert({
          where: { authUserId: userData.authUserId },
          create: userData,
          update: userData,
        })) as DatabaseUser;
      });
    }

    // Refresh the session to ensure cookies are set
    if (data.session) {
      await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });
    }

    revalidatePath("/", "layout");
    redirect(callbackUrl);
  }

  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      minHeight="100vh"
      p="4"
    >
      <Box maxWidth="420px" width="100%">
        <Flex direction="column" gap="4">
          <Card size="4">
            <Flex direction="column" gap="5">
              <Box>
                <Heading size="7" align="center" mb="2">
                  Welcome Back
                </Heading>
                <Text size="2" color="gray" align="center">
                  Sign in to your account to continue
                </Text>
              </Box>

              <Separator size="4" />

              {error && (
                <Callout.Root color="red" size="1">
                  <Callout.Icon>
                    <ExclamationTriangleIcon />
                  </Callout.Icon>
                  <Callout.Text>{error}</Callout.Text>
                </Callout.Root>
              )}

              <form action={signInWithEmail}>
                <Flex direction="column" gap="4">
                  <Box>
                    <Text as="label" size="2" weight="medium" mb="1">
                      Email
                    </Text>
                    <TextField.Root
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      required
                      size="3"
                      autoComplete="email"
                    />
                  </Box>

                  <Box>
                    <Text as="label" size="2" weight="medium" mb="1">
                      Password
                    </Text>
                    <TextField.Root
                      name="password"
                      type="password"
                      placeholder="Enter your password"
                      required
                      size="3"
                      autoComplete="current-password"
                    />
                  </Box>

                  <Button size="3" type="submit" variant="solid">
                    Sign In
                  </Button>
                </Flex>
              </form>
            </Flex>
          </Card>

          {isDevelopment && (
            <Card size="2" variant="surface">
              <Flex direction="column" gap="2">
                <Text size="2" weight="bold" color="gray">
                  Development Accounts
                </Text>
                <Text size="1" color="gray" style={{ lineHeight: 1.6 }}>
                  <strong>Admin:</strong> admin@pjatk.dev / admin123
                  <br />
                  <strong>Developer:</strong> dev@pjatk.dev / dev123
                  <br />
                  <strong>User:</strong> user@pjatk.dev / user123
                  <br />
                  <strong>Student:</strong> student@pjatk.dev / student123
                  <br />
                  <strong>Staff:</strong> staff@pjatk.dev / staff123
                </Text>
              </Flex>
            </Card>
          )}
        </Flex>
      </Box>
    </Flex>
  );
}
