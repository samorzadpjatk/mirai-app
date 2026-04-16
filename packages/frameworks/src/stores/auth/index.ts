// Auth store - split into core and provider-specific layers

// Types (framework-agnostic)
export type {
  AuthUser,
  AuthState,
  AuthSession,
  AuthActions,
  AuthStore,
  AuthProviderClient,
  SupabaseSession,
  SupabaseClient,
} from "./types";

// Core state management (pure Zustand)
export {
  coreAuthStore,
  syncAuthState,
  type CoreAuthStore,
  type CoreAuthActions,
  type CoreAuthState,
} from "./core";

// Supabase integration (provider-specific)
export {
  supabaseAuthStore,
  type SupabaseAuthStore,
  type SupabaseAuthActions,
} from "./supabase";

// Legacy export - the original combined store (for backward compatibility)
// New code should use either coreAuthStore or supabaseAuthStore directly
export { supabaseAuthStore as authStore } from "./supabase";
