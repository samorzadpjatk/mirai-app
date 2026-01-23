export type {
  AuthUser,
  AuthState,
  AuthContextValue,
  SignInWithEmailOptions,
  SignUpWithEmailOptions,
  SignInWithOAuthOptions,
} from "./types";

export {
  getAuthServerUser as getServerUser,
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
