// Primary hooks — backed by Zustand store

export type {
  AuthActions,
  AuthState,
  AuthStore,
  AuthUser,
  SupabaseClient,
  SupabaseSession,
} from "@mirai-app/common/stores";
// Zustand store (moved to @mirai-app/common)
export { authStore } from "@mirai-app/common/stores";
export type { LoginFormData, LoginFormState, UseLoginFormResult } from "./hooks/useLoginForm";
export { useLoginForm } from "./hooks/useLoginForm";
export type { AuthStoreProviderProps } from "./store/AuthStoreProvider";
export { AuthStoreProvider } from "./store/AuthStoreProvider";
export {
  useAuth,
  useAuthLoading,
  useIsAuthenticated,
  useSession,
  useUser,
} from "./store/authHooks";

export type { AuthContextValue } from "./types";
