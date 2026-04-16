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

// Zustand stores (split into core and provider-specific)
export {
  // Legacy combined store (backward compatibility)
  authStore,
  // Core state management (framework-agnostic)
  coreAuthStore,
  // Supabase integration (provider-specific)
  supabaseAuthStore,
} from "../stores/index.ts";

export type {
  // Legacy types (backward compatibility)
  AuthStore,
  AuthActions,
  AuthState,
  AuthUser,
  SupabaseClient,
  SupabaseSession,
  // New split types
  AuthProviderClient,
  AuthSession,
  CoreAuthStore,
  CoreAuthActions,
  CoreAuthState,
  SupabaseAuthStore,
  SupabaseAuthActions,
} from "../stores/index.ts";

export { AuthStoreProvider } from "./store/AuthStoreProvider";
export type { AuthStoreProviderProps } from "./store/AuthStoreProvider";

export type { AuthContextValue } from "./types";
