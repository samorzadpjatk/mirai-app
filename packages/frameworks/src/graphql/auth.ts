import type { GraphQLContext } from "./context.js";

/**
 * Authentication Scopes
 *
 * Defines the authorization scopes available for field-level
 * access control using the Pothos Scope Auth plugin.
 */
export interface AuthScopeMap {
  /** Public access - always allowed */
  public: boolean;
  /** Requires authentication */
  authenticated: boolean;
  /** Requires admin role */
  admin: boolean;
  /** Requires moderator or admin role */
  moderator: boolean;
  /** Requires ownership of the resource */
  owner: boolean;
  /** Requires membership in the resource */
  member: boolean;
}

/**
 * Create auth scopes for a request context
 *
 * This function is called by Pothos to determine auth scopes
 * for each request.
 */
export function createAuthScopes(ctx: GraphQLContext): AuthScopeMap {
  return {
    public: true,
    authenticated: ctx.authContext !== undefined,
    admin: ctx.authContext?.role === "ADMIN",
    moderator:
      ctx.authContext?.role === "MODERATOR" ||
      ctx.authContext?.role === "ADMIN",
    owner: false, // Set per-field based on resource ownership
    member: false, // Set per-field based on resource membership
  };
}
