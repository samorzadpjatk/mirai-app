import { Stack } from "expo-router";
import { TamaguiProvider, YStack } from "tamagui";
import tamaguiConfig from "../../tamagui.config";
import { useState } from "react";
import { ThemeSwitcher } from "../components/ThemeSwitcher";
import { AuthProvider } from "@integral-2025-app/auth";
import { authStorage } from "../lib/storage";

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const SUPABASE_URL: string =
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? "http://localhost:8000";
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const SUPABASE_ANON_KEY: string =
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

export default function RootLayout() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme={theme}>
      <AuthProvider
        supabaseUrl={SUPABASE_URL}
        supabaseKey={SUPABASE_ANON_KEY}
        storageOptions={{ storage: authStorage }}
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
  );
}
