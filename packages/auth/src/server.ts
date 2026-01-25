export type {
  User as DatabaseUser,
  Role,
} from "@integral-2025-app/common-types";

export type {
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
