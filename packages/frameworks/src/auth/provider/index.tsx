/**
 * Auth Store Provider
 *
 * React context provider for Better Auth authentication.
 * Handles initialization and user data fetching.
 *
 * @module @mirai-app/frameworks/auth/provider
 */

import React, { useEffect, useRef, useState } from "react";
import {
  betterAuthStore,
  type BetterAuthClient,
  type BetterAuthUser,
} from "../../stores/index";

// =============================================================================
// Provider Props
// =============================================================================

/**
 * Props for AuthStoreProvider
 */
export interface AuthStoreProviderProps {
  /** Better Auth client instance */
  client: BetterAuthClient;
  /** Callback to fetch full user data from your API */
  onUserFetch?: (authUserId: string) => Promise<ExtendedUser | null>;
  /** Child components */
  children: React.ReactNode;
}

/**
 * Extended user type with legacy fields
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
// Provider Component
// =============================================================================

/**
 * Auth Store Provider
 *
 * Initializes Better Auth store and manages authentication state.
 * Wrap your app with this provider to enable authentication.
 *
 * @example
 * ```tsx
 * function App() {
 *   const betterAuthClient = createBetterAuthClient({
 *     baseURL: "https://api.example.com",
 *   });
 *
 *   const fetchUser = async (authUserId: string) => {
 *     // Fetch user from your GraphQL API
 *     const result = await urqlClient.query(GET_ME_QUERY, {}).toPromise();
 *     return result.data?.me ?? null;
 *   };
 *
 *   return (
 *     <AuthStoreProvider
 *       client={betterAuthClient}
 *       onUserFetch={fetchUser}
 *     >
 *       <YourApp />
 *     </AuthStoreProvider>
 *   );
 * }
 * ```
 */
export const AuthStoreProvider: React.FC<AuthStoreProviderProps> = ({
  client,
  onUserFetch,
  children,
}) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const cleanupRef = useRef<(() => void) | null>(null);

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

  // Don't render children until initialized
  if (!isInitialized) {
    return null;
  }

  return <>{children}</>;
};
