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
import { UpdatePopup } from "~/components/updates/UpdatePopup";
import { useExpoUpdates } from "~/hooks/useExpoUpdates";

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
import {
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
  TRPC_HTTP_URL,
  TRPC_WS_URL,
} from "~/lib/runtimeEnv";
import { useAutoPushSubscription } from "~/hooks/notifications";
import "../../global.css";
import "~/tasks/backgroundLocationTask";
import Constants from "expo-constants";

// Theme colors
const colors = {
  backgroundDark: "#17181c",
  backgroundLight: "#f1f1f4",
  textDark: "#ffffff",
  textLight: "#000000",
};

const supabaseClient = createSupabaseClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  authStorage,
);

function AutoPushSubscriptionBootstrap() {
  useAutoPushSubscription();
  return null;
}

function RootLayoutContent() {
  const isAuthLoading = useAuthLoading();
  const { session } = useAuth();
  const {
    showUpdatePopup,
    startUpdate,
    skipUpdate,
    isDownloading,
    downloadProgress,
  } = useExpoUpdates();

  // Move safe area hook to root layout and provide it to children
  const insets = useSafeAreaInsets();

  // Get theme colors for headers
  const headerBackgroundColor = colors.backgroundDark;
  const headerTintColor = colors.textDark;

  const hasSession = !!session?.access_token;

  return (
    <View style={{ flex: 1, backgroundColor: headerBackgroundColor }}>
      {!isAuthLoading && hasSession ? <AutoPushSubscriptionBootstrap /> : null}
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

      {/* Update Popup */}
      <UpdatePopup
        visible={showUpdatePopup}
        onUpdate={startUpdate}
        onSkip={skipUpdate}
        isDownloading={isDownloading}
        downloadProgress={downloadProgress}
      />
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
            <APIProvider httpUrl={TRPC_HTTP_URL} wsUrl={TRPC_WS_URL} getUserAgent={Constants.getWebViewUserAgentAsync}>
              <RootLayoutContent />
            </APIProvider>
          </AuthProvider>
        </SupabaseProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
