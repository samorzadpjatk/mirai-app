"use client";

import { createStore } from "zustand/vanilla";
import { clientLogger } from "../utils/client-logger";

// Supabase types - will be injected at runtime
export type AuthChangeEvent =
  | "SIGNED_IN"
  | "SIGNED_OUT"
  | "TOKEN_REFRESHED"
  | "USER_UPDATED"
  | "PASSWORD_RECOVERY"
  | "INITIAL_SESSION"
  | "MFA_CHALLENGE_VERIFIED";

export interface SupabaseClient {
  auth: {
    getSession(): Promise<{ data: { session: SupabaseSession | null } }>;
    onAuthStateChange(
      callback: (event: AuthChangeEvent, session: SupabaseSession | null) => void,
    ): { data: { subscription: { unsubscribe(): void } } };
    signInWithOtp(params: {
      email: string;
      options?: { shouldCreateUser?: boolean };
    }): Promise<{ error?: Error | null }>;
    signInWithPassword(params: {
      email: string;
      password: string;
    }): Promise<{ data?: { session?: SupabaseSession | null }; error?: Error | null }>;
    verifyOtp(params: unknown): Promise<{ error?: Error | null }>;
    signOut(): Promise<{ error?: Error | null }>;
    refreshSession(): Promise<{
      data?: { session?: SupabaseSession | null };
      error?: Error | null;
    }>;
  };
}

export interface SupabaseSession {
  user: {
    id: string;
    email?: string;
  };
  access_token?: string;
  refresh_token?: string;
}

export interface AuthUser {
  id: string;
  authUserId: string;
  email: string;
  firstName: string;
  lastName: string;
  /**
   * Convenience display name derived from first/last, kept for backward compatibility.
   */
  name: string;
  emailVerified?: Date;
  role: "USER" | "ADMIN" | "MODERATOR" | "SERVICE";
  hasName: boolean;
  hasEmail: boolean;
  isEmailVerified: boolean;
}

export interface AuthState {
  user: AuthUser | null;
  session: SupabaseSession | null;
  /**
   * True until the initial Supabase session read resolves. This is the cheap gate:
   * it only covers the local/Keychain session read (plus a possible token refresh),
   * never the backend user profile fetch. UI that just needs to know "is somebody
   * signed in" — e.g. the root navigator picking protected vs. public routes —
   * should gate on this and render as soon as it flips to `false`.
   */
  isSessionLoading: boolean;
  /**
   * True while the backend user profile (`onUserFetch`) is in flight for the current
   * session. Screens that actually read `user` fields should gate on this.
   */
  isUserLoading: boolean;
  /**
   * Combined gate, kept for backward compatibility: `isSessionLoading || isUserLoading`.
   * Prefer the specific flag above — gating the whole app on this makes the first
   * frame wait for a network round trip.
   */
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface AuthActions {
  signInWithOtp: (email: string) => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  verifyOtp: (email: string, token: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  refetchUser: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
  setSession: (session: SupabaseSession | null) => void;
  /**
   * Set every loading phase at once. Kept for backward compatibility with callers
   * that only know about the combined `isLoading` flag.
   */
  setLoading: (loading: boolean) => void;
  /**
   * Initialize the store with a Supabase client and optional user-fetch callback.
   * Must be called once before using auth actions.
   */
  initialize: (options: {
    client: SupabaseClient;
    onUserFetch?: (authUserId: string) => Promise<AuthUser | null>;
    storage?: {
      getItem: (key: string) => Promise<string | null> | string | null;
      setItem: (key: string, value: string) => Promise<void> | void;
      removeItem: (key: string) => Promise<void> | void;
    };
  }) => () => void;
}

export type AuthStore = AuthState & AuthActions;

/**
 * Internal state not exposed in the store type but used within actions.
 */
let _supabaseClient: SupabaseClient | null = null;
let _onUserFetch: ((authUserId: string) => Promise<AuthUser | null>) | undefined;
let _fetchingUserId: string | null = null;
let _fetchingUserPromise: Promise<AuthUser | null> | null = null;

/**
 * Reset internal state for testing purposes.
 * @internal - Do not use in production code
 */
export function _resetAuthStoreForTests(): void {
  _supabaseClient = null;
  _onUserFetch = undefined;
  _fetchingUserId = null;
  _fetchingUserPromise = null;
}

type AuthSetter = (partial: Partial<AuthState>) => void;
type AuthGetter = () => AuthState;

/**
 * Apply a state patch while keeping the combined `isLoading` flag in sync with the two
 * phase flags it aggregates. Every write that touches a loading phase must go through
 * here so `isLoading === isSessionLoading || isUserLoading` always holds.
 */
const applyAuthState = (set: AuthSetter, get: AuthGetter, patch: Partial<AuthState>): void => {
  const isSessionLoading = patch.isSessionLoading ?? get().isSessionLoading;
  const isUserLoading = patch.isUserLoading ?? get().isUserLoading;

  set({
    ...patch,
    isSessionLoading,
    isUserLoading,
    isLoading: isSessionLoading || isUserLoading,
  });
};

const fetchAndSetUser = async (authUserId: string, set: AuthSetter, get: AuthGetter) => {
  if (!_onUserFetch) {
    applyAuthState(set, get, { isUserLoading: false });
    return;
  }

  if (_fetchingUserId === authUserId && _fetchingUserPromise) {
    applyAuthState(set, get, { isUserLoading: true });
    try {
      const user = await _fetchingUserPromise;
      applyAuthState(set, get, { user, isAuthenticated: !!user, isUserLoading: false });
    } catch (error) {
      clientLogger.error("Failed to fetch user", error);
      applyAuthState(set, get, { isUserLoading: false });
    }
    return;
  }

  _fetchingUserId = authUserId;
  _fetchingUserPromise = _onUserFetch(authUserId);

  applyAuthState(set, get, { isUserLoading: true });
  try {
    const user = await _fetchingUserPromise;
    applyAuthState(set, get, { user, isAuthenticated: !!user, isUserLoading: false });
  } catch (error) {
    clientLogger.error("Failed to fetch user", error);
    applyAuthState(set, get, { isUserLoading: false });
  } finally {
    _fetchingUserId = null;
    _fetchingUserPromise = null;
  }
};

export const authStore = createStore<AuthStore>()((set, get) => ({
  // State
  user: null,
  session: null,
  isSessionLoading: true,
  isUserLoading: false,
  isLoading: true,
  isAuthenticated: false,

  // Actions
  initialize: ({ client, onUserFetch, storage: _storage }) => {
    _supabaseClient = client;
    _onUserFetch = onUserFetch;

    // Get initial session
    void client.auth.getSession().then(({ data: { session } }) => {
      const willFetchUser = Boolean(session?.user && onUserFetch);

      // Publish the session the moment it is known so the navigation tree can mount
      // without waiting for the (networked) user profile fetch below.
      applyAuthState(set, get, {
        session,
        isSessionLoading: false,
        isUserLoading: willFetchUser,
      });

      if (session?.user && onUserFetch) {
        void fetchAndSetUser(session.user.id, set, get);
      }
    });

    // Subscribe to auth state changes
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event: AuthChangeEvent, session) => {
      if (session?.user && onUserFetch) {
        applyAuthState(set, get, { session, isSessionLoading: false, isUserLoading: true });
        void fetchAndSetUser(session.user.id, set, get);
      } else {
        applyAuthState(set, get, {
          session,
          user: null,
          isAuthenticated: false,
          isSessionLoading: false,
          isUserLoading: false,
        });
      }
    });

    // Return cleanup function
    return () => {
      subscription.unsubscribe();
    };
  },

  signInWithOtp: async (email) => {
    if (!_supabaseClient) {
      throw new Error("[AuthStore] Not initialized. Call initialize() first.");
    }

    const { error } = await _supabaseClient.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
      },
    });

    if (error) {
      throw error;
    }
  },

  signInWithPassword: async (email, password) => {
    if (!_supabaseClient) {
      throw new Error("[AuthStore] Not initialized. Call initialize() first.");
    }

    const { data, error } = await _supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    if (data?.session) {
      set({ session: data.session });
    }

    if (data?.session?.user && _onUserFetch) {
      await fetchAndSetUser(data.session.user.id, set, get);
    }
  },

  verifyOtp: async (email, token) => {
    if (!_supabaseClient) {
      throw new Error("[AuthStore] Not initialized. Call initialize() first.");
    }

    const { error } = await _supabaseClient.auth.verifyOtp({
      email,
      token,
      type: "email",
    });

    if (error) {
      throw error;
    }

    // Refresh session & fetch user after successful verification
    const { data: sessionData } = await _supabaseClient.auth.getSession();
    set({ session: sessionData.session });

    if (sessionData.session?.user && _onUserFetch) {
      await fetchAndSetUser(sessionData.session.user.id, set, get);
    }
  },

  signOut: async () => {
    if (!_supabaseClient) {
      throw new Error("[AuthStore] Not initialized. Call initialize() first.");
    }

    const { error } = await _supabaseClient.auth.signOut();

    if (error) {
      throw error;
    }

    set({ user: null, session: null, isAuthenticated: false });
  },

  refreshSession: async () => {
    if (!_supabaseClient) {
      throw new Error("[AuthStore] Not initialized. Call initialize() first.");
    }

    const { data, error } = await _supabaseClient.auth.refreshSession();

    if (error) {
      throw error;
    }

    set({ session: data?.session });

    if (data?.session?.user && _onUserFetch) {
      await fetchAndSetUser(data.session.user.id, set, get);
    }
  },

  /**
   * Re-fetch the current user from the backend.
   * Useful when the user fetch mechanism (e.g. oRPC client) becomes available
   * after initial auth store initialization.
   */
  refetchUser: async () => {
    if (!_supabaseClient) {
      throw new Error("[AuthStore] Not initialized. Call initialize() first.");
    }

    const { data: sessionData } = await _supabaseClient.auth.getSession();
    const session = sessionData?.session;

    if (session?.user && _onUserFetch) {
      applyAuthState(set, get, { isUserLoading: true });
      try {
        const user = await _onUserFetch(session.user.id);
        applyAuthState(set, get, { user, isAuthenticated: !!user, isUserLoading: false });
      } catch (error) {
        clientLogger.error("Failed to refetch user", error);
        applyAuthState(set, get, { isUserLoading: false });
      }
    }
  },

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setSession: (session) => set({ session }),
  setLoading: (isLoading) =>
    set({ isLoading, isSessionLoading: isLoading, isUserLoading: isLoading }),
}));
