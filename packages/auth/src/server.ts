export type {
  DatabaseUser,
  Role,
  AuthUser,
  AuthState,
  SignInWithOtpOptions
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
