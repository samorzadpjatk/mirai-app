import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Stack } from "expo-router";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { SafeAreaInsetsProvider } from "~/contexts/SafeAreaInsetsContext";
import { LocationProvider } from "~/contexts/location";
import * as Notifications from "expo-notifications";

// Global handler for notifications (module-level)
Notifications.setNotificationHandler({
  // eslint-disable-next-line @typescript-eslint/require-await
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

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
} from "@expo-google-fonts/ibm-plex-sans";
import {
  AuthProvider,
  useAuthLoading,
  useAuth,
} from "@integral-2025-app/auth/client";
import { authStorage } from "~/lib/storage";
import { createSupabaseClient } from "@integral-2025-app/supabase";
import { SupabaseProvider } from "@integral-2025-app/supabase/react";
import { APIProvider } from "@integral-2025-app/trpc/client";
import "../../global.css";

// Theme colors
const colors = {
  backgroundDark: "#17181c",
  backgroundLight: "#f1f1f4",
  textDark: "#ffffff",
  textLight: "#000000",
};

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const TRPC_HTTP_URL = process.env.EXPO_PUBLIC_TRPC_API_URL;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error("Missing Supabase configuration");
}

if (!TRPC_HTTP_URL) {
  throw new Error("Missing tRPC API URL");
}

const TRPC_WS_URL = TRPC_HTTP_URL.replace(/^http/, "ws");

const supabaseClient = createSupabaseClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  authStorage,
);

function RootLayoutContent() {
  const isAuthLoading = useAuthLoading();
  const { session } = useAuth();
  
  // Move safe area hook to root layout and provide it to children
  const insets = useSafeAreaInsets();

  // Get theme colors for headers
  const headerBackgroundColor = colors.backgroundDark;
  const headerTintColor = colors.textDark;

  const hasSession = !!session?.access_token;

  return (
    <View style={{ flex: 1, backgroundColor: headerBackgroundColor }}>
      {!isAuthLoading && (
        <SafeAreaInsetsProvider value={insets}>
          <LocationProvider>
            <Stack
              screenOptions={{
                headerShown: false,
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
                },
              }}
            >
              {/* Protected routes for authenticated users */}
              <Stack.Protected guard={hasSession}>
                <Stack.Screen
                  name="(tabs)"
                  options={{
                    headerShown: false,
                  }}
                />
                <Stack.Screen
                  name="alerts"
                  options={{
                    title: "Alerts",
                    headerShown: false,
                    
                  }}
                />
                <Stack.Screen
                  name="admin/challenges"
                  options={{
                    title: "Admin Challenges",
                    headerShown: false,
                    
                  }}
                />
              </Stack.Protected>

              {/* Protected routes for unauthenticated users */}
              <Stack.Protected guard={!hasSession}>
                <Stack.Screen
                  name="auth/login"
                  options={{
                    title: "Sign In",
                    headerShown: false,
                  }}
                />
              </Stack.Protected>

            </Stack>
          </LocationProvider>
        </SafeAreaInsetsProvider>
      )}
    </View>
  );
}

export default function RootLayout() {
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SupabaseProvider client={supabaseClient}>
          <AuthProvider
            supabaseUrl={SUPABASE_URL}
            supabaseKey={SUPABASE_ANON_KEY}
            supabaseClient={supabaseClient}
          >
            <APIProvider httpUrl={TRPC_HTTP_URL} wsUrl={TRPC_WS_URL}>
              <RootLayoutContent />
            </APIProvider>
          </AuthProvider>
        </SupabaseProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
