export type { AuthState, AuthContextValue, SignInWithOtpOptions } from "./types";

export type { AuthUser } from "@mirai-app/shared/stores";

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
