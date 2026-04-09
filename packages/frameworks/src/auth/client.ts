// Primary hooks — backed by Zustand store
export {
  useAuth,
  useUser,
  useSession,
  useIsAuthenticated,
  useAuthLoading,
} from "./store/authHooks";

export { useLoginForm } from "./hooks/useLoginForm";
export type {
  LoginFormData,
  LoginFormState,
  UseLoginFormResult,
} from "./hooks/useLoginForm";

// Zustand store (now in frameworks/stores)
export { authStore } from "../../stores/authStore";
export type {
  AuthStore,
  AuthActions,
  AuthState,
  AuthUser,
  SupabaseClient,
  SupabaseSession,
} from "../../stores/authStore";
export { AuthStoreProvider } from "./store/AuthStoreProvider";
export type { AuthStoreProviderProps } from "./store/AuthStoreProvider";

export type { AuthContextValue } from "./types";
