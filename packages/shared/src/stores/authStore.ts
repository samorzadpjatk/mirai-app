"use client";

import { createStore } from "zustand/vanilla";

// Supabase types - will be injected at runtime
export type AuthChangeEvent =
  | "SIGNED_IN"
  | "SIGNED_OUT"
  | "TOKEN_REFRESHED"
  | "USER_UPDATED"
  | "PASSWORD_RECOVERY"
  | "INITIAL_SESSION";

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
  session: SupabaseSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface AuthActions {
  signInWithOtp: (email: string) => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  verifyOtp: (email: string, token: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
  setSession: (session: SupabaseSession | null) => void;
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
let _onUserFetch:
  | ((authUserId: string) => Promise<AuthUser | null>)
  | undefined;

/**
 * Reset internal state for testing purposes.
 * @internal - Do not use in production code
 */
export function _resetAuthStoreForTests(): void {
  _supabaseClient = null;
  _onUserFetch = undefined;
}

const fetchAndSetUser = async (
  authUserId: string,
  set: (partial: Partial<AuthState>) => void,
) => {
  if (!_onUserFetch) {
    set({ isLoading: false });
    return;
  }

  set({ isLoading: true });
  try {
    const user = await _onUserFetch(authUserId);
    set({ user, isAuthenticated: !!user, isLoading: false });
  } catch (error) {
    console.error("[AuthStore] Failed to fetch user:", error);
    set({ isLoading: false });
  }
};

export const authStore = createStore<AuthStore>()((set, _get) => ({
  // State
  user: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,

  // Actions
  initialize: ({ client, onUserFetch, storage: _storage }) => {
    _supabaseClient = client;
    _onUserFetch = onUserFetch;

    // Get initial session
    void client.auth.getSession().then(({ data: { session } }) => {
      set({ session });
      if (session?.user && onUserFetch) {
        void fetchAndSetUser(session.user.id, set);
      } else {
        set({ isLoading: false });
      }
    });

    // Subscribe to auth state changes
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event: AuthChangeEvent, session) => {
      set({ session });

      if (session?.user && onUserFetch) {
        void fetchAndSetUser(session.user.id, set);
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
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
      await fetchAndSetUser(data.session.user.id, set);
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
      await fetchAndSetUser(sessionData.session.user.id, set);
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
  },

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setSession: (session) => set({ session }),
  setLoading: (isLoading) => set({ isLoading }),
}));
