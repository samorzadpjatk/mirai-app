// Supabase auth integration - connects Supabase client to auth store
// Handles Supabase-specific operations and state synchronization

import { createStore } from "zustand/vanilla";
import type {
  AuthUser,
  AuthStore,
  AuthSession,
  SupabaseClient,
  SupabaseSession,
} from "./types";
import type { CoreAuthState } from "./core";
import { coreAuthStore, syncAuthState } from "./core";

// Internal state not exposed in the store type but used within actions
let _supabaseClient: SupabaseClient | null = null;
let _onUserFetch:
  | ((authUserId: string) => Promise<AuthUser | null>)
  | undefined;

const fetchAndSetUser = async (
  authUserId: string,
  setState: (state: Partial<CoreAuthState>) => void,
) => {
  if (!_onUserFetch) {
    setState({ isLoading: false });
    return;
  }

  setState({ isLoading: true });
  try {
    const user = await _onUserFetch(authUserId);
    syncAuthState(coreAuthStore, coreAuthStore.getState().session, user);
  } catch {
    setState({ isLoading: false });
  }
};

export interface SupabaseAuthActions {
  initialize: (options: {
    client: SupabaseClient;
    onUserFetch?: (authUserId: string) => Promise<AuthUser | null>;
    storage?: {
      getItem: (key: string) => Promise<string | null> | string | null;
      setItem: (key: string, value: string) => Promise<void> | void;
      removeItem: (key: string) => Promise<void> | void;
    };
  }) => () => void;
  signInWithOtp: (email: string) => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  verifyOtp: (email: string, token: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  // Re-export core actions for convenience
  setUser: (user: AuthUser | null) => void;
  setSession: (session: AuthSession | null) => void;
  setLoading: (loading: boolean) => void;
}

export type SupabaseAuthStore = CoreAuthState & SupabaseAuthActions;

export const supabaseAuthStore = createStore<SupabaseAuthStore>()(
  (set, get) => ({
    // Core state (mirrors coreAuthStore)
    ...coreAuthStore.getState(),

    // Core actions
    setUser: (user) => {
      coreAuthStore.getState().setUser(user);
      set({ user, isAuthenticated: !!user });
    },

    setSession: (session) => {
      coreAuthStore.getState().setSession(session);
      set({ session });
    },

    setLoading: (isLoading) => {
      coreAuthStore.getState().setLoading(isLoading);
      set({ isLoading });
    },

    // Supabase-specific actions
    initialize: ({ client, onUserFetch }) => {
      _supabaseClient = client;
      _onUserFetch = onUserFetch;

      // Get initial session
      void client.auth.getSession().then(({ data: { session } }) => {
        syncAuthState(coreAuthStore, session, get().user);
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
      } = client.auth.onAuthStateChange((_event, session) => {
        syncAuthState(coreAuthStore, session, get().user);
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
        throw new Error(
          "[AuthStore] Not initialized. Call initialize() first.",
        );
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
        throw new Error(
          "[AuthStore] Not initialized. Call initialize() first.",
        );
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
        throw new Error(
          "[AuthStore] Not initialized. Call initialize() first.",
        );
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
        throw new Error(
          "[AuthStore] Not initialized. Call initialize() first.",
        );
      }

      const { error } = await _supabaseClient.auth.signOut();

      if (error) {
        throw error;
      }

      coreAuthStore.getState().reset();
      set({ user: null, session: null, isAuthenticated: false });
    },

    refreshSession: async () => {
      if (!_supabaseClient) {
        throw new Error(
          "[AuthStore] Not initialized. Call initialize() first.",
        );
      }

      const { data, error } = await _supabaseClient.auth.refreshSession();

      if (error) {
        throw error;
      }

      set({ session: data?.session });
    },
  }),
);

// Subscribe core store changes to keep supabase store in sync
coreAuthStore.subscribe((state) => {
  const currentState = supabaseAuthStore.getState();
  if (
    currentState.user !== state.user ||
    currentState.session !== state.session ||
    currentState.isLoading !== state.isLoading ||
    currentState.isAuthenticated !== state.isAuthenticated
  ) {
    supabaseAuthStore.setState({
      user: state.user,
      session: state.session,
      isLoading: state.isLoading,
      isAuthenticated: state.isAuthenticated,
    });
  }
});
