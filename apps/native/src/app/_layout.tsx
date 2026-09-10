import { AuthStoreProvider } from "@mirai-app/auth/client";
import * as Notifications from "expo-notifications";
import { Stack } from "expo-router";
import { useCallback, useEffect } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import LoadingScreen from "~/components/LoadingScreen";
import { useAutoPushSubscription, useNotificationResponse } from "~/hooks/notifications";
import { LocationStoreProvider } from "~/stores/location";

function initNotifications(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

import { IBMPlexSans_600SemiBold, useFonts } from "@expo-google-fonts/ibm-plex-sans";
import { useSession, useSessionLoading } from "@mirai-app/auth/client";
import { resolveRootGate } from "@mirai-app/common/stores";
import { formatDisplayName } from "@mirai-app/common/users";
import {
  QueryProvider,
  cleanupBackgroundORPCClient,
  getBackgroundORPCClient,
  getORPCClient,
} from "@mirai-app/orpc/client";
import { createSupabaseClient } from "@mirai-app/supabase";
import { SupabaseProvider } from "@mirai-app/supabase/react";
import { ORPC_HTTP_URL, ORPC_WS_URL, SUPABASE_ANON_KEY, SUPABASE_URL } from "~/config/runtimeEnv";
import { useSelectedTrip } from "~/hooks/trips/useSelectedTrip";
import {
  createBackgroundTaskDeps,
  initBackgroundLocationTask,
} from "~/services/background/backgroundLocationTask";
import { authStorage } from "~/services/storage/storage";
import { colors } from "~/styles";
import { TripThemeProvider, useTripTheme } from "~/theme/TripThemeProvider";
import "../../global.css";
import "../global.css";

const supabaseClient = createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY, authStorage);

function AutoPushSubscription() {
  useAutoPushSubscription();
  return null;
}

/**
 * Handles taps on delivered push notifications. Mounted alongside the
 * navigator, so `router.push` always has a mounted Stack to push onto.
 */
function NotificationResponseHandler() {
  useNotificationResponse();
  return null;
}

function RootStack({ hasSession }: { hasSession: boolean }) {
  const { palette } = useTripTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        gestureDirection: "horizontal",
        contentStyle: { backgroundColor: palette.backgroundDark },
        headerStyle: {
          backgroundColor: palette.headerBackground,
        },
        headerTintColor: palette.white,
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
  );
}

function App() {
  initNotifications();
  const backgroundTaskDeps = createBackgroundTaskDeps({
    supabaseClient,
    getORPCClient: getBackgroundORPCClient,
    httpUrl: ORPC_HTTP_URL,
    wsUrl: ORPC_WS_URL,
  });
  initBackgroundLocationTask(backgroundTaskDeps);
  // Only the *session* read gates the first frame. Waiting for `user` here used to add
  // a full `user.getMy()` round trip (Keychain read -> token refresh -> oRPC call) to
  // every cold start, during which the app rendered nothing at all. The one first-frame
  // consumer of `user` — the admin tab in `(tabs)/_layout.tsx` — already tolerates
  // `user === null` and simply reveals itself a moment later.
  const isSessionLoading = useSessionLoading();
  const session = useSession();
  const { selectedTripId } = useSelectedTrip();

  useEffect(() => {
    return () => {
      void cleanupBackgroundORPCClient();
    };
  }, []);

  const gate = resolveRootGate({ session, isSessionLoading });
  const hasSession = gate === "authenticated";

  return (
    <View style={{ flex: 1, backgroundColor: colors.backgroundDark }}>
      {gate === "loading" ? (
        // Rendered outside TripThemeProvider on purpose: the context default keeps it on
        // the DEFAULT palette, so it costs no query while the session is being read.
        <LoadingScreen />
      ) : (
        <>
          {hasSession ? <AutoPushSubscription /> : null}
          <TripThemeProvider tripId={selectedTripId}>
            <RootStack hasSession={hasSession} />
            <NotificationResponseHandler />
          </TripThemeProvider>
        </>
      )}
    </View>
  );
}

function AuthStoreProviderWrapper({ children }: { children: React.ReactNode }) {
  // Stable identity: `AuthStoreProvider` re-runs `initialize()` whenever this callback
  // changes, which would re-read the session and open a second auth subscription on
  // every render of this wrapper (e.g. when the font finishes loading).
  const onUserFetch = useCallback(async () => {
    try {
      // Use a client bound to the current access token directly, instead of the
      // globally-mutated `orpc` singleton which may still be tokenless when the
      // auth store triggers this fetch right as the session appears (race -> 401).
      const {
        data: { session },
      } = await supabaseClient.auth.getSession();
      const token = session?.access_token;
      if (!token) return null;

      const { client, cleanup } = getORPCClient(ORPC_HTTP_URL, undefined, token);
      let user: Awaited<ReturnType<typeof client.user.getMy>>;
      try {
        user = await client.user.getMy({});
      } finally {
        await cleanup();
      }
      if (!user) return null;

      const normalizedFirstName = user.firstName ?? "";
      const normalizedLastName = user.lastName ?? "";
      const normalizedEmail = user.email ?? "";

      // Transform database user to AuthUser format
      return {
        id: user.id,
        authUserId: user.authUserId,
        email: normalizedEmail,
        firstName: normalizedFirstName,
        lastName: normalizedLastName,
        name: formatDisplayName(normalizedFirstName, normalizedLastName) ?? "",
        emailVerified: undefined,
        role: user.role,
        hasName: Boolean(normalizedFirstName.trim() || normalizedLastName.trim()),
        hasEmail: Boolean(normalizedEmail.trim()),
        isEmailVerified: false,
      };
    } catch {
      // TODO: Add Sentry crash reporting for production errors
      return null;
    }
  }, []);

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
  // Only the one weight the app actually references (`fontFamily:
  // "IBMPlexSans_600SemiBold"` in the profile and trips stack headers) is loaded, and
  // the tree is NOT gated on it: the previous seven weights were ~1.5 MB of TTF that
  // had to be parsed before a single React element existed. Headers fall back to the
  // system font for the few frames before the face is registered.
  useFonts({ IBMPlexSans_600SemiBold });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SupabaseProvider client={supabaseClient}>
          <QueryProvider httpUrl={ORPC_HTTP_URL} wsUrl={ORPC_WS_URL}>
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
