import { useEffect } from "react";
import { Platform, useColorScheme, View } from "react-native";
import Constants from "expo-constants";
import { Stack, useRouter, useSegments } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../global.css";
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
import { AuthProvider, useAuthLoading, useAuth } from "@integral-2025-app/auth/client";
import { authStorage } from "~/lib/storage";
import { createSupabaseClient } from "@integral-2025-app/supabase";
import { APIProvider } from "@integral-2025-app/trpc/client";
import "../../global.css";

// Theme colors
const colors = {
  backgroundDark: "#17181c",
  backgroundLight: "#f1f1f4",
  textDark: "#ffffff",
  textLight: "#000000",
};

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
  const { session } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark" || colorScheme === null; // Default to dark

  // Get theme colors for headers
  const headerBackgroundColor = isDark ? colors.backgroundDark : colors.backgroundLight;
  const headerTintColor = isDark ? colors.textDark : colors.textLight;

  useEffect(() => {
    if (isAuthLoading) return;

    const inAuthGroup = segments[0] === "auth";
    const hasSession = !!session?.access_token;

    if (!hasSession && !inAuthGroup) {
      router.replace("/auth/login");
    } else if (hasSession && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [session, segments, isAuthLoading, router]);

  return (
    <View style={{ flex: 1, backgroundColor: headerBackgroundColor }}>
      {!isAuthLoading && (
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "fade",
            gestureEnabled: true,
            gestureDirection: "horizontal",
            contentStyle: { backgroundColor: headerBackgroundColor },
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
            name="(tabs)"
            options={{
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
            name="alerts"
            options={{
              title: "Alerts",
              headerShown: false,
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="challenges"
            options={{
              title: "Challenges",
              headerShown: false,
              animation: "slide_from_right",
            }}
          />
        </Stack>
      )}
    </View>
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
    // Load MapLibre GL CSS for Web platform via CDN
    if (Platform.OS === "web") {
      const linkId = "maplibre-gl-css";
      if (typeof document !== "undefined" && !document.getElementById(linkId)) {
        const link = document.createElement("link");
        link.id = linkId;
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/maplibre-gl@3.7.0/dist/maplibre-gl.css";
        document.head.appendChild(link);
      }
    }

    const appOwnership: string = Constants.appOwnership ?? "unknown";
    const isExpoGo = appOwnership === "expo";

    // Configure native map module only on native builds (not Expo Go).
    if (Platform.OS !== "web" && !isExpoGo) {
      void (async () => {
        try {
          // Try to load MapLibre native module if present; no token configuration required.
          const mod = await import("@maplibre/maplibre-react-native");
          // If module exposes helpers in the future, adapt here.
          // No-op for now.
        } catch (err: unknown) {
          console.warn(
            "[Map] Native map module not available. Build a dev client to use native maps.",
            err,
          );
        }
      })();
    } else if (Platform.OS !== "web") {
      console.warn(
        "[Map] Running in Expo Go or native module missing. Maps disabled (requires dev build).",
      );
    }
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <AuthProvider
        supabaseUrl={SUPABASE_URL}
        supabaseKey={SUPABASE_ANON_KEY}
        supabaseClient={supabaseClient}
      >
        <APIProvider httpUrl={TRPC_HTTP_URL} wsUrl={TRPC_WS_URL}>
          <RootLayoutContent />
        </APIProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
