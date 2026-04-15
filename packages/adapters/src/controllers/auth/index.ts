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
} from "./authServer";

export type { AdminUserWithBan } from "./authServer";
