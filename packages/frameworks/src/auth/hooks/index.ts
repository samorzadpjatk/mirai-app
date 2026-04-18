/**
 * Auth Hooks
 *
 * React hooks for authentication state and actions.
 * Uses Better Auth store for state management.
 *
 * @module @mirai-app/frameworks/auth/hooks
 */

import { useCallback, useMemo, useState } from "react";
import { useStore } from "zustand";
import { betterAuthStore } from "../../stores/index";

// =============================================================================
// useAuth - Main Auth Hook
// =============================================================================

/**
 * Auth state and methods returned by useAuth hook
 */
export interface UseAuthReturn {
  /** Current user or null if not authenticated */
  user: ExtendedUser | null;
  /** Current session or null if not authenticated */
  session: ExtendedSession | null;
  /** Whether auth state is loading */
  isLoading: boolean;
  /** Whether user is authenticated */
  isAuthenticated: boolean;
  /** Sign in with email/password */
  signInWithPassword: (credentials: { email: string; password: string }) => Promise<void>;
  /** Sign in with OTP (sends email) */
  signInWithOtp: (email: string) => Promise<void>;
  /** Verify OTP and complete sign in */
  verifyOtp: (params: { email: string; token: string }) => Promise<void>;
  /** Sign out */
  signOut: () => Promise<void>;
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
 * Main authentication hook
 * Provides access to auth state and methods
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, isAuthenticated, signOut } = useAuth();
 *
 *   if (!isAuthenticated) {
 *     return <LoginScreen />;
 *   }
 *
 *   return <Profile user={user} />;
 * }
 * ```
 */
export function useAuth(): UseAuthReturn {
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
    async (credentials: { email: string; password: string }) => {
      const result = await store.signInWithPassword(credentials.email, credentials.password);

      if (!result.success) {
        throw new Error(result.error.message);
      }
    },
    [store.signInWithPassword],
  );

  // Sign in with OTP (sends OTP email)
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
    async (params: { email: string; token: string }) => {
      const result = await store.signInWithOtp(params.email, params.token);

      if (!result.success) {
        throw new Error(result.error.message);
      }
    },
    [store.signInWithOtp],
  );

  // Sign out
  const signOut = useCallback(async () => {
    const result = await store.signOut();

    if (!result.success) {
      throw new Error(result.error.message);
    }
  }, [store.signOut]);

  return {
    user: extendedUser,
    session: extendedSession,
    isLoading: store.isLoading,
    isAuthenticated: store.isAuthenticated,
    signInWithPassword,
    signInWithOtp,
    verifyOtp,
    signOut,
  };
}

// =============================================================================
// useUser - User-only Hook
// =============================================================================

/**
 * Hook to get current user
 * Returns null if not authenticated
 *
 * @example
 * ```tsx
 * function Profile() {
 *   const user = useUser();
 *   if (!user) return null;
 *   return <Text>{user.email}</Text>;
 * }
 * ```
 */
export function useUser(): ExtendedUser | null {
  const { user } = useAuth();
  return user;
}

// =============================================================================
// useSession - Session-only Hook
// =============================================================================

/**
 * Hook to get current session
 * Returns null if not authenticated
 *
 * @example
 * ```tsx
 * function TokenDisplay() {
 *   const session = useSession();
 *   if (!session) return null;
 *   return <Text>{session.access_token}</Text>;
 * }
 * ```
 */
export function useSession(): ExtendedSession | null {
  const { session } = useAuth();
  return session;
}

// =============================================================================
// useIsAuthenticated - Boolean Hook
// =============================================================================

/**
 * Hook to check if user is authenticated
 *
 * @example
 * ```tsx
 * function ProtectedRoute({ children }: { children: React.ReactNode }) {
 *   const isAuthenticated = useIsAuthenticated();
 *   return isAuthenticated ? children : <LoginScreen />;
 * }
 * ```
 */
export function useIsAuthenticated(): boolean {
  const store = useStore(betterAuthStore);
  return store.isAuthenticated;
}

// =============================================================================
// useAuthLoading - Loading State Hook
// =============================================================================

/**
 * Hook to check if auth is loading
 *
 * @example
 * ```tsx
 * function App() {
 *   const isLoading = useAuthLoading();
 *   if (isLoading) return <LoadingScreen />;
 *   return <MainApp />;
 * }
 * ```
 */
export function useAuthLoading(): boolean {
  const store = useStore(betterAuthStore);
  return store.isLoading;
}

// =============================================================================
// useLoginForm - Login Form State Hook
// =============================================================================

/**
 * Login form state
 */
export interface LoginFormState {
  /** Email input value */
  email: string;
  /** Whether form is submitting */
  isLoading: boolean;
  /** Whether OTP email was sent */
  isSent: boolean;
  /** Error message or null */
  error: string | null;
}

/**
 * Login form actions
 */
export interface LoginFormActions {
  /** Set email value */
  setEmail: (email: string) => void;
  /** Submit the form (sends OTP) */
  handleSubmit: () => Promise<void>;
  /** Clear the error */
  clearError: () => void;
  /** Clear the isSent state */
  clearSent: () => void;
}

/**
 * Combined login form return type
 */
export type UseLoginFormReturn = {
  formState: LoginFormState;
} & LoginFormActions;

/**
 * Hook for managing login form state
 * Handles email validation and OTP sending
 *
 * @example
 * ```tsx
 * function LoginForm() {
 *   const { formState, setEmail, handleSubmit } = useLoginForm();
 *
 *   return (
 *     <View>
 *       <TextInput
 *         value={formState.email}
 *         onChangeText={setEmail}
 *       />
 *       <Button
 *         onPress={handleSubmit}
 *         disabled={formState.isLoading}
 *         title={formState.isSent ? "Resend Code" : "Send Code"}
 *       />
 *       {formState.error && <Error message={formState.error} />}
 *     </View>
 *   );
 * }
 * ```
 */
export function useLoginForm(): UseLoginFormReturn {
  const [email, setEmailState] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { signInWithOtp } = useAuth();

  const setEmail = useCallback((value: string) => {
    setEmailState(value);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearSent = useCallback(() => {
    setIsSent(false);
  }, []);

  const handleSubmit = useCallback(async () => {
    setError(null);

    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      await signInWithOtp(email.trim());
      setIsSent(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send login code";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [email, signInWithOtp]);

  const formState: LoginFormState = {
    email,
    isLoading,
    isSent,
    error,
  };

  return {
    formState,
    setEmail,
    handleSubmit,
    clearError,
    clearSent,
  };
}
