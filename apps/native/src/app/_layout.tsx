import { AuthStoreProvider } from "@mirai-app/frameworks/auth/client";
import { TamaguiProvider } from "@mirai-app/ui";
import { config } from "@mirai-app/ui/tamagui.config";
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
import { useAuth, useAuthLoading } from "@mirai-app/frameworks/auth/client";
import { createBetterAuthClient } from "@mirai-app/frameworks/better-auth";
import { BETTER_AUTH_URL } from "~/config/runtimeEnv";
import { urqlClient } from "~/lib/urql-client";
import "~/services/background/backgroundLocationTask";
import "../../global.css";
import "../global.css";

// Theme colors
const colors = {
  backgroundDark: "#17181c",
  backgroundLight: "#f1f1f4",
  textDark: "#ffffff",
  textLight: "#000000",
};

// Create Better Auth client
const betterAuthClient = createBetterAuthClient({
  baseURL: BETTER_AUTH_URL,
  basePath: "/api/auth",
});

function AutoPushSubscription() {
  useAutoPushSubscription();
  return null;
}

function App() {
  const isAuthLoading = useAuthLoading();
  const { session } = useAuth();
  const {
    showUpdatePopup,
    startUpdate,
    skipUpdate,
    isDownloading,
    downloadProgress,
  } = useExpoUpdates();

  // Get theme colors for headers
  const headerBackgroundColor = colors.backgroundDark;
  const headerTintColor = colors.textDark;

  // Check for valid session using access_token (from extended session format)
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

/**
 * Fetch current user via GraphQL using urql
 */
async function fetchCurrentUser(): Promise<{
  id: string;
  authUserId: string;
  email: string;
  firstName: string;
  lastName: string;
  emailVerified: boolean | null;
  role: string;
} | null> {
  const GET_ME_QUERY = `
    query GetMe {
      me {
        id
        authUserId
        email
        firstName
        lastName
        emailVerified
        role
      }
    }
  `;

  try {
    const result = await urqlClient.query(GET_ME_QUERY, {}).toPromise();

    if (result.error) {
      throw result.error;
    }

    const user = result.data?.me;
    if (!user) return null;

    return {
      id: user.id,
      authUserId: user.authUserId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      emailVerified: user.emailVerified ?? null,
      role: user.role,
    };
  } catch {
    return null;
  }
}

function AuthStoreProviderWrapper({ children }: { children: React.ReactNode }) {
  const onUserFetch = async () => {
    const user = await fetchCurrentUser();
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
      emailVerified: user.emailVerified ? new Date() : null,
      role: user.role as "USER" | "ADMIN" | "MODERATOR" | "SERVICE",
    };
  };

  return (
    <AuthStoreProvider
      client={betterAuthClient}
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
        <TamaguiProvider config={config} defaultTheme="dark">
          <AuthStoreProviderWrapper>
            <LocationStoreProvider>
              <App />
            </LocationStoreProvider>
          </AuthStoreProviderWrapper>
        </TamaguiProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
