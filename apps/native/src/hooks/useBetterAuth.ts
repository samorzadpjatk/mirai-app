/**
 * useBetterAuth Hook
 *
 * React hook for accessing Better Auth state and methods.
 * Drop-in replacement for useSupabase and useAuth hooks.
 *
 * @module apps/native/hooks/useBetterAuth
 */

import { useCallback, useMemo } from "react";
import { useStore } from "zustand";
import {
  betterAuthStore,
  type BetterAuthUser,
  type BetterAuthSession,
} from "@mirai-app/frameworks/stores";

// =============================================================================
// Types
// =============================================================================

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

/**
 * Extended session type with legacy fields for backward compatibility
 */
export interface ExtendedSession {
  user?: { id: string; email: string };
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
}

/**
 * Return type for useBetterAuth hook
 */
export interface UseBetterAuthReturn {
  /** Current user or null if not authenticated */
  user: ExtendedUser | null;
  /** Current session or null if not authenticated */
  session: ExtendedSession | null;
  /** Whether auth state is loading */
  isLoading: boolean;
  /** Whether user is authenticated */
  isAuthenticated: boolean;
  /** Sign in with email and password */
  signInWithPassword: (email: string, password: string) => Promise<void>;
  /** Sign in with OTP (sends email) */
  signInWithOtp: (email: string) => Promise<void>;
  /** Verify OTP and complete sign in */
  verifyOtp: (email: string, token: string) => Promise<void>;
  /** Sign up with email and password */
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  /** Sign out */
  signOut: () => Promise<void>;
  /** Refresh the current session */
  refreshSession: () => Promise<void>;
}

// =============================================================================
// Hook
// =============================================================================

/**
 * useBetterAuth - Main authentication hook
 *
 * Provides access to auth state and methods.
 * Compatible with the old useSupabase and useAuth APIs.
 *
 * @example
 * ```tsx
 * function LoginScreen() {
 *   const { signInWithPassword, isLoading } = useBetterAuth();
 *
 *   const handleLogin = async (email: string, password: string) => {
 *     try {
 *       await signInWithPassword(email, password);
 *       // Navigate to main screen
 *     } catch (error) {
 *       // Handle error
 *     }
 *   };
 *
 *   return (
 *     <View>
 *       <Button
 *         onPress={() => handleLogin(email, password)}
 *         disabled={isLoading}
 *         title="Sign In"
 *       />
 *     </View>
 *   );
 * }
 * ```
 */
export function useBetterAuth(): UseBetterAuthReturn {
  const store = useStore(betterAuthStore);

  // Transform Better Auth user to extended format
  const extendedUser = useMemo<ExtendedUser | null>(() => {
    if (!store.user) return null;

    return {
      id: store.user.id,
      authUserId: store.user.id,
      email: store.user.email,
      name: store.user.name,
      emailVerified: store.user.emailVerified ? new Date() : null,
    };
  }, [store.user]);

  // Transform Better Auth session to extended format
  const extendedSession = useMemo<ExtendedSession | null>(() => {
    if (!store.session) return null;

    return {
      user: store.user ? { id: store.user.id, email: store.user.email } : undefined,
      access_token: store.session.token,
      refresh_token: undefined,
      expires_at: new Date(store.session.expiresAt).getTime(),
    };
  }, [store.session, store.user]);

  // Sign in with password
  const signInWithPassword = useCallback(
    async (email: string, password: string) => {
      const result = await store.signInWithPassword(email, password);

      if (!result.success) {
        throw new Error(result.error.message);
      }
    },
    [store.signInWithPassword],
  );

  // Sign in with OTP (sends email)
  const signInWithOtp = useCallback(
    async (email: string) => {
      const result = await store.sendSignInOtp(email);

      if (!result.success) {
        throw new Error(result.error.message);
      }
    },
    [store.sendSignInOtp],
  );

  // Verify OTP
  const verifyOtp = useCallback(
    async (email: string, token: string) => {
      const result = await store.signInWithOtp(email, token);

      if (!result.success) {
        throw new Error(result.error.message);
      }
    },
    [store.signInWithOtp],
  );

  // Sign up
  const signUp = useCallback(
    async (email: string, password: string, name?: string) => {
      const result = await store.signUp(email, password, name);

      if (!result.success) {
        throw new Error(result.error.message);
      }
    },
    [store.signUp],
  );

  // Sign out
  const signOut = useCallback(async () => {
    const result = await store.signOut();

    if (!result.success) {
      throw new Error(result.error.message);
    }
  }, [store.signOut]);

  // Refresh session
  const refreshSession = useCallback(async () => {
    const result = await store.refreshSession();

    if (!result.success) {
      throw new Error(result.error.message);
    }
  }, [store.refreshSession]);

  return {
    user: extendedUser,
    session: extendedSession,
    isLoading: store.isLoading,
    isAuthenticated: store.isAuthenticated,
    signInWithPassword,
    signInWithOtp,
    verifyOtp,
    signUp,
    signOut,
    refreshSession,
  };
}

// =============================================================================
// Additional Convenience Hooks
// =============================================================================

/**
 * Hook to get current user only
 *
 * @example
 * ```tsx
 * function Profile() {
 *   const user = useBetterAuthUser();
 *   if (!user) return null;
 *   return <Text>{user.email}</Text>;
 * }
 * ```
 */
export function useBetterAuthUser(): ExtendedUser | null {
  const { user } = useBetterAuth();
  return user;
}

/**
 * Hook to get current session only
 *
 * @example
 * ```tsx
 * function TokenDisplay() {
 *   const session = useBetterAuthSession();
 *   if (!session) return null;
 *   return <Text>{session.access_token}</Text>;
 * }
 * ```
 */
export function useBetterAuthSession(): ExtendedSession | null {
  const { session } = useBetterAuth();
  return session;
}

/**
 * Hook to check if user is authenticated
 *
 * @example
 * ```tsx
 * function ProtectedRoute({ children }: { children: React.ReactNode }) {
 *   const isAuthenticated = useBetterAuthIsAuthenticated();
 *   return isAuthenticated ? children : <LoginScreen />;
 * }
 * ```
 */
export function useBetterAuthIsAuthenticated(): boolean {
  const store = useStore(betterAuthStore);
  return store.isAuthenticated;
}

/**
 * Hook to check if auth is loading
 *
 * @example
 * ```tsx
 * function App() {
 *   const isLoading = useBetterAuthIsLoading();
 *   if (isLoading) return <LoadingScreen />;
 *   return <MainApp />;
 * }
 * ```
 */
export function useBetterAuthIsLoading(): boolean {
  const store = useStore(betterAuthStore);
  return store.isLoading;
}
