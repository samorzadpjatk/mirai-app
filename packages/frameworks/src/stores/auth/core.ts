// Core auth state management - pure Zustand, framework-agnostic
// Handles state transitions only, no external dependencies

import { createStore } from "zustand/vanilla";
import type { AuthState, AuthUser, AuthSession, AuthStore } from "./types";

export interface CoreAuthActions {
  setUser: (user: AuthUser | null) => void;
  setSession: (session: AuthSession | null) => void;
  setLoading: (isLoading: boolean) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  reset: () => void;
}

export interface CoreAuthState extends AuthState {
  isAuthenticated: boolean;
}

export type CoreAuthStore = CoreAuthState & CoreAuthActions;

const initialState: CoreAuthState = {
  user: null,
  session: null,
  isLoading: false,
  isAuthenticated: false,
};

export const coreAuthStore = createStore<CoreAuthStore>()((set) => ({
  ...initialState,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
    }),

  setSession: (session) => set({ session }),

  setLoading: (isLoading) => set({ isLoading }),

  setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),

  reset: () => set(initialState),
}));

// Helper to sync external auth state to core store
export function syncAuthState(
  store: typeof coreAuthStore,
  session: AuthSession | null,
  user: AuthUser | null,
) {
  store.setState({
    session,
    user,
    isAuthenticated: !!user,
    isLoading: false,
  });
}
