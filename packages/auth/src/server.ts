export type {
  DatabaseUser,
  Role,
  AuthState,
  SignInWithOtpOptions
} from "./types";

export type { AuthUser } from "@mirai-app/shared";

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
