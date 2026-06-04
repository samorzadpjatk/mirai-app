// Primary hooks — backed by Zustand store
export {
  useAuth,
  useUser,
  useSession,
  useIsAuthenticated,
  useAuthLoading,
} from "./store/authHooks";

export { useLoginForm } from "./hooks/useLoginForm";
export type { LoginFormData, LoginFormState, UseLoginFormResult } from "./hooks/useLoginForm";

// Zustand store (moved to @mirai-app/shared)
export { authStore } from "@mirai-app/shared/stores";
export type {
  AuthStore,
  AuthActions,
  AuthState,
  AuthUser,
  SupabaseClient,
  SupabaseSession,
} from "@mirai-app/shared/stores";
export { AuthStoreProvider } from "./store/AuthStoreProvider";
export type { AuthStoreProviderProps } from "./store/AuthStoreProvider";

export type { AuthContextValue } from "./types";
