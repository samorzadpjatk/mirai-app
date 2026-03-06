export type {
  AuthState,
  AuthContextValue,
  SignInWithOtpOptions
} from "./types";

export type { AuthUser } from "@integral-2025-app/shared";

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
