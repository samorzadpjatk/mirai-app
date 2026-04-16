// Auth store types - shared between all auth implementations

export interface AuthUser {
  id: string;
  authUserId: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  /**
   * Convenience display name derived from first/last, kept for backward compatibility.
   */
  name: string | null;
  emailVerified: Date | null;
  role: "USER" | "ADMIN" | "MODERATOR" | "SERVICE";
}

export interface AuthState {
  user: AuthUser | null;
  session: AuthSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface AuthSession {
  user: {
    id: string;
    email?: string;
  };
  access_token?: string;
  refresh_token?: string;
}

export interface AuthActions {
  signInWithOtp: (email: string) => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  verifyOtp: (email: string, token: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
  setSession: (session: AuthSession | null) => void;
  setLoading: (loading: boolean) => void;
  /**
   * Initialize the store with an auth provider client and optional user-fetch callback.
   * Must be called once before using auth actions.
   */
  initialize: (options: {
    client: AuthProviderClient;
    onUserFetch?: (authUserId: string) => Promise<AuthUser | null>;
    storage?: {
      getItem: (key: string) => Promise<string | null> | string | null;
      setItem: (key: string, value: string) => Promise<void> | void;
      removeItem: (key: string) => Promise<void> | void;
    };
  }) => () => void;
}

export type AuthStore = AuthState & AuthActions;

// Generic auth provider interface - can be implemented by Supabase, Firebase, etc.
export interface AuthProviderClient {
  auth: {
    getSession(): Promise<{ data: { session: AuthSession | null } }>;
    onAuthStateChange(
      callback: (event: string, session: AuthSession | null) => void,
    ): { data: { subscription: { unsubscribe(): void } } };
    signInWithOtp(params: {
      email: string;
      options?: { shouldCreateUser?: boolean };
    }): Promise<{ error?: Error | null }>;
    signInWithPassword(params: {
      email: string;
      password: string;
    }): Promise<{
      data?: { session?: AuthSession | null };
      error?: Error | null;
    }>;
    verifyOtp(params: {
      email: string;
      token: string;
      type: string;
    }): Promise<{ error?: Error | null }>;
    signOut(): Promise<{ error?: Error | null }>;
    refreshSession(): Promise<{
      data?: { session?: AuthSession | null };
      error?: Error | null;
    }>;
  };
}

// Supabase-specific types (legacy exports for backward compatibility)
export interface SupabaseSession extends AuthSession {}

export interface SupabaseClient extends AuthProviderClient {}
