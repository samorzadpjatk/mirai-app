import { AuthStoreProvider } from "@mirai-app/auth/client";
import * as Notifications from "expo-notifications";
import { Stack } from "expo-router";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { UpdatePopup } from "~/components/updates/UpdatePopup";
import { useAutoPushSubscription } from "~/hooks/notifications";
import { useExpoUpdates } from "~/hooks/useExpoUpdates";
import { LocationStoreProvider } from "~/stores/location";

// Global handler for notifications (module-level)
Notifications.setNotificationHandler({
   
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

import {
  IBMPlexSans_100Thin,
  IBMPlexSans_200ExtraLight,
  IBMPlexSans_300Light,
  IBMPlexSans_400Regular,
  IBMPlexSans_500Medium,
  IBMPlexSans_600SemiBold,
  IBMPlexSans_700Bold,
  useFonts,
} from "@expo-google-fonts/ibm-plex-sans";
import { useAuth, useAuthLoading } from "@mirai-app/auth/client";
import { createSupabaseClient } from "@mirai-app/supabase";
import { SupabaseProvider } from "@mirai-app/supabase/react";
import { QueryProvider, orpc } from "@mirai-app/orpc/client";
import { SUPABASE_ANON_KEY, SUPABASE_URL, TRPC_HTTP_URL, TRPC_WS_URL } from "~/config/runtimeEnv";
import "~/services/background/backgroundLocationTask";
import { authStorage } from "~/services/storage/storage";
import "../../global.css";
import "../global.css";

// Theme colors
const colors = {
  backgroundDark: "#17181c",
  backgroundLight: "#f1f1f4",
  textDark: "#ffffff",
  textLight: "#000000",
};

const supabaseClient = createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY, authStorage);

function AutoPushSubscription() {
  useAutoPushSubscription();
  return null;
}

function App() {
  const isAuthLoading = useAuthLoading();
  const { session } = useAuth();
  const { showUpdatePopup, startUpdate, skipUpdate, isDownloading, downloadProgress } =
    useExpoUpdates();

  // Get theme colors for headers
  const headerBackgroundColor = colors.backgroundDark;
  const headerTintColor = colors.textDark;

  const hasSession = !!session?.access_token;

  return (
    <View style={{ flex: 1, backgroundColor: headerBackgroundColor }}>
      {!isAuthLoading && hasSession ? <AutoPushSubscription /> : null}
      {!isAuthLoading && (
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

function AuthStoreProviderWrapper({ children }: { children: React.ReactNode }) {
  const onUserFetch = async () => {
    try {
      const user = await orpc.user.getMy.call({});
      if (!user) return null;

      // Transform database user to AuthUser format
      return {
        id: user.id,
        authUserId: user.authUserId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        name:
          user.firstName && user.lastName
            ? `${user.firstName} ${user.lastName}`
            : user.firstName || user.lastName || null,
        emailVerified: null, // TODO: Add email verification logic when available
        role: user.role,
      };
    } catch (error) {
      console.error("Failed to fetch user:", error);
      return null;
    }
  };

  return (
    <AuthStoreProvider
      supabaseUrl={SUPABASE_URL}
      supabaseKey={SUPABASE_ANON_KEY}
      supabaseClient={supabaseClient}
      onUserFetch={onUserFetch}
    >
      {children}
    </AuthStoreProvider>
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
          <QueryProvider httpUrl={TRPC_HTTP_URL} wsUrl={TRPC_WS_URL}>
            <AuthStoreProviderWrapper>
              <LocationStoreProvider>
                <App />
              </LocationStoreProvider>
            </AuthStoreProviderWrapper>
          </QueryProvider>
        </SupabaseProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
