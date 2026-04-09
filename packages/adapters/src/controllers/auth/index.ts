// Auth server logic - interface adapters for authentication
export {
  decodeJwtPayload,
  getAuthServerUser,
  getAuthServerSession,
  mapDatabaseUserToAuthUser,
  parseRolesFromToken,
  hasRequiredRole,
  syncUserToDatabase,
  AuthenticationError,
  AuthorizationError,
  // AuthServer class for dependency injection
  AuthServer,
  // Deprecated standalone functions (use AuthServer class instead)
  /** @deprecated Use AuthServer.getSession method instead */
  getSession,
  /** @deprecated Use AuthServer.requireAuth method instead */
  requireAuth,
  /** @deprecated Use AuthServer.requireAdmin method instead */
  requireAdmin,
  /** @deprecated Use AuthServer.requireModerator method instead */
  requireModerator,
} from "./authServer";

export type { AdminUserWithBan } from "./authServer";
