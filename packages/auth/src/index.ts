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
} from "./authServer";

export { useAuth, useUser, useSession, useIsAuthenticated } from "./authHooks";

export { AuthProvider, AuthContext } from "./AuthContext";
export type { AuthProviderProps } from "./AuthContext";
