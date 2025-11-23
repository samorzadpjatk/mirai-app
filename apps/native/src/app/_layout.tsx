import { Stack } from "expo-router";
import { TamaguiProvider, YStack } from "tamagui";
import tamaguiConfig from "../../tamagui.config";
import { useState } from "react";
import { ThemeSwitcher } from "../components/ThemeSwitcher";

export default function RootLayout() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme={theme}>
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
    </TamaguiProvider>
  );
}
