import { useEffect, useState } from "react";
import { Platform } from "react-native";
import Constants from "expo-constants";
import { Slot } from "expo-router";
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

// Validate Supabase configuration
if (!SUPABASE_ANON_KEY) {
  console.error(
    "[Supabase] EXPO_PUBLIC_SUPABASE_ANON_KEY is missing. Please set it in your .env file."
  );
}
// Both HTTP and WebSocket tRPC are served by the Fastify server
// under the same path. Only the protocol differs.
const TRPC_HTTP_URL: string =
  process.env.EXPO_PUBLIC_TRPC_API_URL ?? "http://localhost:2022/api/trpc";
const TRPC_WS_URL: string = TRPC_HTTP_URL.replace(/^http/, "ws");

// Prefer EXPO_PUBLIC_ env for bundlers, fallback to plain MAPBOX_ACCESS_TOKEN
const MAPBOX_ACCESS_TOKEN: string =
  process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ?? process.env.MAPBOX_ACCESS_TOKEN ?? "";

// Mapbox configuration is done in useEffect to avoid errors in Expo Go
// where native code is not available

// Clear stale Supabase session when the base URL changes (helps when switching
// between 54321 CLI default and 8000 Kong reverse proxy).
if (typeof window !== "undefined" && window.localStorage) {
  const lastUrlKey = "supabase.last_url";
  const lastUrl = window.localStorage.getItem(lastUrlKey);
  if (lastUrl && lastUrl !== SUPABASE_URL) {
    window.localStorage.removeItem("supabase.auth.token");
    window.localStorage.removeItem("supabase.auth.expires_at");
  }
  window.localStorage.setItem(lastUrlKey, SUPABASE_URL);
}

const supabaseClient = createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY, authStorage);

export default function RootLayout() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    // Load Mapbox GL CSS for Web platform via CDN
    if (Platform.OS === "web") {
      const linkId = "mapbox-gl-css";
      if (typeof document !== "undefined" && !document.getElementById(linkId)) {
        const link = document.createElement("link");
        link.id = linkId;
        link.rel = "stylesheet";
        link.href = "https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css";
        document.head.appendChild(link);
      }
    }

    const isExpoGo = Constants.appOwnership === "expo";
    const hasToken =
      MAPBOX_ACCESS_TOKEN && MAPBOX_ACCESS_TOKEN !== "your_mapbox_token_here";

    // Configure Mapbox only on native builds (not Expo Go), with token present.
    if (Platform.OS !== "web" && hasToken && !isExpoGo) {
      (async () => {
        try {
          const mod = require("@rnmapbox/maps");
          const MapboxGL = mod?.default ?? mod;
          if (MapboxGL?.setAccessToken) {
            MapboxGL.setAccessToken(MAPBOX_ACCESS_TOKEN);
          }
          if (MapboxGL?.setConnected) {
            MapboxGL.setConnected(true);
          }
        } catch (err) {
          console.warn(
            "[Mapbox] Failed to init native module. Build a dev client to use maps.",
          );
        }
      })();
    } else if (Platform.OS !== "web") {
      console.warn(
        "[Mapbox] Running in Expo Go or missing token. Maps disabled (requires dev build + token).",
      );
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
            <Slot />
          </YStack>
        </APIProvider>
      </AuthProvider>
    </TamaguiProvider>
  );
}
