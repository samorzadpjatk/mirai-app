import { useEffect } from "react";
import { Platform, useColorScheme } from "react-native";
import Constants from "expo-constants";
import { Stack } from "expo-router";
import { TamaguiProvider, YStack, type TamaguiInternalConfig, useTheme } from "tamagui";
import tamaguiConfig from "tamagui.config";
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

interface MapboxModule {
  setAccessToken?: (token: string) => void;
  setConnected?: (connected: boolean) => void;
}

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

const supabaseClient = createSupabaseClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  authStorage,
);

function RootLayoutContent() {
  const isAuthLoading = useAuthLoading();
  const tamaguiTheme = useTheme();

  // Get theme colors for headers
  const headerBackgroundColor = tamaguiTheme.background.get();
  const headerTintColor = tamaguiTheme.color.get();
  const headerBorderColor = tamaguiTheme.borderColor.get();

  return (
    <YStack flex={1} bg="$background">
      {!isAuthLoading && (
        <Stack 
          screenOptions={{ 
            headerShown: false,
            animation: "slide_from_right",
            contentStyle: { backgroundColor: "transparent" },
            headerStyle: {
              backgroundColor: headerBackgroundColor,
            },
            headerTintColor: headerTintColor,
            headerShadowVisible: true,
            headerTitleStyle: {
              fontWeight: "600",
            }
          }}
        >
          <Stack.Screen 
            name="index" 
            options={{ 
              title: "Home",
              headerShown: false
            }} 
          />
          <Stack.Screen 
            name="auth/login" 
            options={{ 
              title: "Sign In",
              headerShown: false,
              animation: "fade"
            }} 
          />
          <Stack.Screen 
            name="auth/signup" 
            options={{ 
              title: "Sign Up",
              headerShown: false,
              animation: "fade"
            }} 
          />
          <Stack.Screen 
            name="users/index" 
            options={{ 
              title: "Users",
              headerShown: true,
              headerTitle: "Users Management",
              headerStyle: {
                backgroundColor: headerBackgroundColor,
              },
              headerTintColor: headerTintColor,
            }} 
          />
          <Stack.Screen 
            name="groups/index" 
            options={{ 
              title: "Guilds",
              headerShown: true,
              headerTitle: "Guilds",
              headerStyle: {
                backgroundColor: headerBackgroundColor,
              },
              headerTintColor: headerTintColor,
            }} 
          />
          <Stack.Screen 
            name="coins/index" 
            options={{ 
              title: "Coin Operations",
              headerShown: true,
              headerTitle: "Treasury Management",
              headerStyle: {
                backgroundColor: headerBackgroundColor,
              },
              headerTintColor: headerTintColor,
            }} 
          />
          <Stack.Screen 
            name="transactions/index" 
            options={{ 
              title: "Transactions",
              headerShown: true,
              headerTitle: "Transaction History",
              headerStyle: {
                backgroundColor: headerBackgroundColor,
              },
              headerTintColor: headerTintColor,
            }} 
          />
          <Stack.Screen 
            name="notifications/index" 
            options={{ 
              title: "Notifications",
              headerShown: true,
              headerTitle: "Notification Schedules",
              headerStyle: {
                backgroundColor: headerBackgroundColor,
              },
              headerTintColor: headerTintColor,
            }} 
          />
        </Stack>
      )}
    </YStack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? "dark" : "light";
  
  const [fontsLoaded] = useFonts({
    IBMPlexSans_100Thin,
    IBMPlexSans_200ExtraLight,
    IBMPlexSans_300Light,
    IBMPlexSans_400Regular,
    IBMPlexSans_500Medium,
    IBMPlexSans_600SemiBold,
    IBMPlexSans_700Bold,
  });

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

    const appOwnership: string = Constants.appOwnership ?? "unknown";
    const isExpoGo = appOwnership === "expo";
    const hasToken =
      MAPBOX_ACCESS_TOKEN && MAPBOX_ACCESS_TOKEN !== "your_mapbox_token_here";

    // Configure Mapbox only on native builds (not Expo Go), with token present.
    if (Platform.OS !== "web" && hasToken && !isExpoGo) {
      void (async () => {
        try {
          const mod = (await import("@rnmapbox/maps")) as MapboxModule;
          mod?.setAccessToken?.(MAPBOX_ACCESS_TOKEN);
          mod?.setConnected?.(true);
        } catch (err: unknown) {
          console.warn(
            "[Mapbox] Failed to init native module. Build a dev client to use maps.",
            err,
          );
        }
      })();
    } else if (Platform.OS !== "web") {
      console.warn(
        "[Mapbox] Running in Expo Go or missing token. Maps disabled (requires dev build + token).",
      );
    }
  }, []);

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
          <RootLayoutContent />
        </APIProvider>
      </AuthProvider>
    </TamaguiProvider>
  );
}
