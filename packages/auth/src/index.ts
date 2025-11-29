import createSupabaseClient from "./supabaseClient";

export type {
  User as DatabaseUser,
  Role,
} from "@integral-2025-app/common-types";

export type {
  AuthUser,
  AuthState,
  AuthContextValue,
  SignInWithEmailOptions,
  SignUpWithEmailOptions,
  SignInWithOAuthOptions,
  SupabaseClientOptions,
} from "./types";

export { createSupabaseClient };

export {
  getAuthServerUser as getServerUser,
  getAuthServerSession as getServerSession,
  mapDatabaseUserToAuthUser,
  parseRolesFromToken,
  hasRequiredRole,
  AuthenticationError,
  AuthorizationError,
  getSession,
  requireAuth,
  requireAdmin,
  requireModerator,
  syncUserToDatabase,
} from "./authServer";

export { useAuth, useUser, useSession, useIsAuthenticated } from "./authHooks";

export { useLoginForm } from "./hooks/useLoginForm";
export type {
  LoginFormData,
  LoginFormState,
  UseLoginFormResult,
} from "./hooks/useLoginForm";

export { useSignupForm } from "./hooks/useSignupForm";
export type {
  SignupFormData,
  SignupFormState,
  UseSignupFormResult,
} from "./hooks/useSignupForm";

export { AuthProvider, AuthContext } from "./AuthContext";
export type { AuthProviderProps } from "./AuthContext";
