// Primary hooks — backed by Zustand store
export { useAuth, useUser, useSession, useIsAuthenticated, useAuthLoading } from "./store/authHooks";

export { useLoginForm } from "./hooks/useLoginForm";
export type {
  LoginFormData,
  LoginFormState,
  UseLoginFormResult,
} from "./hooks/useLoginForm";

// Zustand store (moved to @integral-2025-app/shared)
export { authStore } from "@integral-2025-app/shared";
export type { AuthStore, AuthActions, AuthState, AuthUser, SupabaseClient, SupabaseSession } from "@integral-2025-app/shared";
export { AuthStoreProvider } from "./store/AuthStoreProvider";
export type { AuthStoreProviderProps } from "./store/AuthStoreProvider";

export type { AuthContextValue } from "./types";
