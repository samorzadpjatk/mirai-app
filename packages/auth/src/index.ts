export type { AuthUser } from "@mirai-app/common/stores";
export {
  AuthenticationError,
  AuthorizationError,
  getAuthServerUser as getServerUser,
  getSession,
  hasRequiredRole,
  mapDatabaseUserToAuthUser,
  parseRolesFromToken,
  requireAdmin,
  requireAuth,
  requireModerator,
  syncUserToDatabase,
} from "./authServer";
export type { AuthContextValue, AuthState, SignInWithOtpOptions } from "./types";
