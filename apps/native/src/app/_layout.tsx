import { Stack } from "expo-router";
import { TamaguiProvider, YStack } from "tamagui";
import tamaguiConfig from "tamagui.config";
import { useState } from "react";
import { ThemeSwitcher } from "~/components/ThemeSwitcher";
import { AuthProvider } from "@integral-2025-app/auth";
import { authStorage } from "~/lib/storage";
import { TRPCProvider, createTRPCClientConfig } from "~/lib/trpc";
import { createSupabaseClient } from "@integral-2025-app/supabase";

const SUPABASE_URL: string = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "http://localhost:8000";  
const SUPABASE_ANON_KEY: string = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";  

const supabaseClient = createSupabaseClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  authStorage,
);

const createAuthHeaders = async (): Promise<Record<string, string>> => {
  const { data, error } = await supabaseClient.auth.getSession();

  if (error) {
    console.error("Failed to read Supabase session for tRPC headers:", error);
    return {};
  }

  const accessToken = data.session?.access_token;
  if (!accessToken) {
    return {};
  }

  return {
    Authorization: `Bearer ${accessToken}`,
  };
};

export default function RootLayout() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  return (
    <TRPCProvider
      client={{
        ...createTRPCClientConfig(),
        headers: createAuthHeaders,
      }}
    >
      <TamaguiProvider config={tamaguiConfig} defaultTheme={theme}>
        <AuthProvider
          supabaseUrl={SUPABASE_URL}
          supabaseKey={SUPABASE_ANON_KEY}
          supabaseClient={supabaseClient}
        >
          <YStack flex={1} backgroundColor="$background">
            <YStack padding="$4" paddingTop="$6">
              <ThemeSwitcher
                onToggle={() => setTheme(theme === "light" ? "dark" : "light")}
                currentTheme={theme}
              />
            </YStack>
            <Stack screenOptions={{ headerShown: false }}>
              {/* Routing here */}
            </Stack>
          </YStack>
        </AuthProvider>
      </TamaguiProvider>
    </TRPCProvider>
  );
}
