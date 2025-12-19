import { useEffect, useState } from "react";
import { Platform } from "react-native";
import { Stack } from "expo-router";
import MapboxGL from "@rnmapbox/maps";
import { TamaguiProvider, YStack } from "tamagui";
import tamaguiConfig from "tamagui.config";
import { ThemeSwitcher } from "~/components/ThemeSwitcher";
import { AuthProvider } from "@integral-2025-app/auth/client";
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

// Prefer EXPO_PUBLIC_ env for bundlers, fallback to plain MAPBOX_ACCESS_TOKEN
const MAPBOX_ACCESS_TOKEN: string =
  process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ?? process.env.MAPBOX_ACCESS_TOKEN ?? "";

// Configure Mapbox access token at module load time so that both native and web
// implementations (including underlying mapbox-gl) see it before any map is created.
if (MAPBOX_ACCESS_TOKEN) {
  try {
    MapboxGL.setAccessToken(MAPBOX_ACCESS_TOKEN);
  } catch (err) {
    console.warn("[Mapbox] Failed to set access token:", err);
  }
} else {
  // This will show up once at startup in Metro / native logs
  console.warn(
    "[Mapbox] Missing MAPBOX_ACCESS_TOKEN / EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN – map tiles will not load.",
  );
}

const supabaseClient = createSupabaseClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  authStorage,
);

export default function RootLayout() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    // Load Mapbox GL CSS for Web platform via CDN
    if (Platform.OS === "web") {
      const linkId = "mapbox-gl-css";
      if (!document.getElementById(linkId)) {
        const link = document.createElement("link");
        link.id = linkId;
        link.rel = "stylesheet";
        link.href = "https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css";
        document.head.appendChild(link);
      }
    }

    // Ensure native side connects to Mapbox services (no-op on web)
    if (Platform.OS !== "web" && typeof (MapboxGL as any).setConnected === "function") {
      // ensure native side connects to Mapbox services
      try {
        (MapboxGL as any).setConnected?.(true);
      } catch {
        // ignore if not supported
      }
    }
  }, []);

  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme={theme}>
      <AuthProvider
        supabaseUrl={SUPABASE_URL}
        supabaseKey={SUPABASE_ANON_KEY}
        supabaseClient={supabaseClient}
      >
        <APIProvider httpUrl={TRPC_HTTP_URL} wsUrl={TRPC_WS_URL}>
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
        </APIProvider>
      </AuthProvider>
    </TamaguiProvider>
  );
}
