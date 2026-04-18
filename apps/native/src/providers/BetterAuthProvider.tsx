/**
 * Better Auth Provider
 *
 * React Native context provider for Better Auth.
 * Wraps the app and provides authentication context.
 *
 * @module apps/native/providers/BetterAuthProvider
 */

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import {
  betterAuthStore,
  type BetterAuthClient,
  type BetterAuthUser,
  type BetterAuthState,
} from "@mirai-app/frameworks/stores";

// =============================================================================
// Context Types
// =============================================================================

/**
 * Auth context value
 */
interface BetterAuthContextValue extends BetterAuthState {
  /** Initialize the provider with a client */
  initialize: (options: {
    client: BetterAuthClient;
    onUserFetch?: (authUserId: string) => Promise<BetterAuthUser | null>;
  }) => () => void;
  /** Whether the provider is initialized */
  isInitialized: boolean;
}

/**
 * Extended user type with legacy fields for backward compatibility
 */
export interface ExtendedUser {
  id: string;
  authUserId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  emailVerified: Date | null;
  role?: "USER" | "ADMIN" | "MODERATOR" | "SERVICE";
  image?: string;
}

// =============================================================================
// Context
// =============================================================================

const BetterAuthContext = createContext<BetterAuthContextValue | null>(null);

// =============================================================================
// Provider Props
// =============================================================================

/**
 * Props for BetterAuthProvider
 */
export interface BetterAuthProviderProps {
  /** Better Auth client instance */
  client: BetterAuthClient;
  /** Base URL for the Better Auth API */
  baseURL: string;
  /** Callback to fetch full user data from your API */
  onUserFetch?: (authUserId: string) => Promise<ExtendedUser | null>;
  /** Child components */
  children: React.ReactNode;
}

// =============================================================================
// Provider Component
// =============================================================================

/**
 * Better Auth Provider
 *
 * React Native provider for Better Auth authentication.
 * Initializes the auth store and provides context to the app.
 *
 * @example
 * ```tsx
 * // In your app root (_layout.tsx)
 * import { BetterAuthProvider } from "~/providers/BetterAuthProvider";
 * import { createBetterAuthClient } from "@mirai-app/frameworks/better-auth";
 *
 * const betterAuthClient = createBetterAuthClient({
 *   baseURL: "https://api.example.com",
 * });
 *
 * export default function RootLayout() {
 *   return (
 *     <BetterAuthProvider
 *       client={betterAuthClient}
 *       baseURL="https://api.example.com"
 *       onUserFetch={fetchCurrentUser}
 *     >
 *       <YourApp />
 *     </BetterAuthProvider>
 *   );
 * }
 * ```
 */
export const BetterAuthProvider: React.FC<BetterAuthProviderProps> = ({
  client,
  onUserFetch,
  children,
}) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const cleanupRef = useRef<(() => void) | null>(null);
  const storeState = betterAuthStore.getState();

  useEffect(() => {
    // Initialize the store with the client
    const cleanup = betterAuthStore.getState().initialize({
      client,
      onUserFetch: onUserFetch
        ? async (authUserId: string) => {
            const user = await onUserFetch(authUserId);
            if (!user) return null;

            // Transform ExtendedUser to BetterAuthUser
            const betterAuthUser: BetterAuthUser = {
              id: user.authUserId,
              email: user.email,
              emailVerified: user.emailVerified ? true : false,
              name: user.name,
              image: user.image,
            };

            return betterAuthUser;
          }
        : undefined,
    });

    cleanupRef.current = cleanup;
    setIsInitialized(true);

    // Cleanup on unmount
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [client, onUserFetch]);

  const contextValue: BetterAuthContextValue = {
    user: storeState.user,
    session: storeState.session,
    isLoading: storeState.isLoading,
    isAuthenticated: storeState.isAuthenticated,
    lastError: storeState.lastError,
    initialize: betterAuthStore.getState().initialize,
    isInitialized,
  };

  return (
    <BetterAuthContext.Provider value={contextValue}>
      {children}
    </BetterAuthContext.Provider>
  );
};

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook to access the Better Auth context
 *
 * @returns BetterAuthContextValue
 * @throws Error if used outside of BetterAuthProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, isAuthenticated, signOut } = useBetterAuthContext();
 *
 *   if (!isAuthenticated) {
 *     return <LoginScreen />;
 *   }
 *
 *   return (
 *     <View>
 *       <Text>Welcome {user?.email}</Text>
 *       <Button onPress={signOut} title="Sign Out" />
 *     </View>
 *   );
 * }
 * ```
 */
export function useBetterAuthContext(): BetterAuthContextValue {
  const context = useContext(BetterAuthContext);

  if (context === null) {
    throw new Error(
      "useBetterAuthContext must be used within a BetterAuthProvider. " +
        "Wrap your app with <BetterAuthProvider>...</BetterAuthProvider>",
    );
  }

  return context;
}

/**
 * Hook to check if component is within BetterAuthProvider
 *
 * @returns boolean indicating if provider is available
 */
export function useHasBetterAuth(): boolean {
  return useContext(BetterAuthContext) !== null;
}
