import { Stack } from "expo-router";
import { TamaguiProvider, YStack, type TamaguiInternalConfig } from "tamagui";
import tamaguiConfig from "tamagui.config";
import { useState } from "react";
import { ThemeSwitcher } from "~/components/ThemeSwitcher";
import {
  useFonts,
  IBMPlexSans_100Thin,
  IBMPlexSans_200ExtraLight,
  IBMPlexSans_300Light,
  IBMPlexSans_400Regular,
  IBMPlexSans_500Medium,
  IBMPlexSans_600SemiBold,
  IBMPlexSans_700Bold,
} from '@expo-google-fonts/ibm-plex-sans';
import { AuthProvider, useAuthLoading } from "@integral-2025-app/auth/client";
import { authStorage } from "~/lib/storage";
import { createSupabaseClient } from "@integral-2025-app/supabase";
import { APIProvider } from "@integral-2025-app/trpc/client";

const SUPABASE_URL: string =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? "http://localhost:8000";
const SUPABASE_ANON_KEY: string =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";
// Both HTTP and WebSocket tRPC are served by the Fastify server
// under the same path. Only the protocol differs.
const TRPC_HTTP_URL: string =
  process.env.EXPO_PUBLIC_TRPC_API_URL ?? "http://localhost:2022/api/trpc";
const TRPC_WS_URL: string = TRPC_HTTP_URL.replace(/^http/, "ws");

const supabaseClient = createSupabaseClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  authStorage,
);

function RootLayoutContent({ theme, setTheme }: { theme: "light" | "dark", setTheme: (theme: "light" | "dark") => void }) {
  const isAuthLoading = useAuthLoading();

  return (
    <YStack flex={1} bg="$background">
      <YStack p="$4" pt="$6">
        <ThemeSwitcher
          onToggle={() => setTheme(theme === "light" ? "dark" : "light")}
          currentTheme={theme}
        />
      </YStack>
      {!isAuthLoading && (
        <Stack screenOptions={{ headerShown: false }}>
          {/* Routing here */}
        </Stack>
      )}
    </YStack>
  );
}

export default function RootLayout() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  
  const [fontsLoaded] = useFonts({
    IBMPlexSans_100Thin,
    IBMPlexSans_200ExtraLight,
    IBMPlexSans_300Light,
    IBMPlexSans_400Regular,
    IBMPlexSans_500Medium,
    IBMPlexSans_600SemiBold,
    IBMPlexSans_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <TamaguiProvider config={tamaguiConfig as TamaguiInternalConfig} defaultTheme={theme}>
      <AuthProvider
        supabaseUrl={SUPABASE_URL}
        supabaseKey={SUPABASE_ANON_KEY}
        supabaseClient={supabaseClient}
      >
        <APIProvider httpUrl={TRPC_HTTP_URL} wsUrl={TRPC_WS_URL}>
          <RootLayoutContent theme={theme} setTheme={setTheme} />
        </APIProvider>
      </AuthProvider>
    </TamaguiProvider>
  );
}
