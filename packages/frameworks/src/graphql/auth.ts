import type { GraphQLContext } from "./context";

/**
 * Auth scope definitions
 * These define the authorization scopes available in the schema
 */
export interface AuthScopeMap {
  /**
   * Public scope - always allowed
   */
  public: boolean;

  /**
   * Authenticated scope - requires valid user session
   */
  authenticated: boolean;

  /**
   * Admin scope - requires admin role
   */
  admin: boolean;

  /**
   * Owner scope - requires ownership of the resource
   */
  owner: boolean;

  /**
   * Member scope - requires membership in a group
   */
  member: boolean;
}

/**
 * Individual auth scope type
 */
export type AuthScope = keyof AuthScopeMap;

/**
 * Function to compute auth scopes from context
 */
export type AuthScopesFunction = (
  context: GraphQLContext,
) => AuthScopeMap | Promise<AuthScopeMap>;

/**
 * Define authorization scopes for the schema
 *
 * This function creates the auth scope resolver that Pothos uses
 * to determine if a user has permission to access a field.
 *
 * ## Usage
 *
 * ```typescript
 * import { builder, defineAuthScopes } from "@mirai-app/frameworks/graphql";
 *
 * builder.queryType({
 *   authScopes: defineAuthScopes((context) => ({
 *     public: true,
 *     authenticated: !!context.authContext?.user,
 *     admin: context.authContext?.user?.role === "admin",
 *     owner: false, // Computed per-field
 *     member: false, // Computed per-field
 *   })),
 *   fields: (t) => ({
 *     // ...
 *   }),
 * });
 * ```
 *
 * @param scopesFn - Function returning scope map
 * @returns Auth scopes configuration
 */
export function defineAuthScopes(scopesFn: AuthScopesFunction): {
  scopes: AuthScopesFunction;
} {
  return {
    scopes: scopesFn,
  };
}

/**
 * Check if a specific auth scope is granted
 *
 * @param context - GraphQL context
 * @param scope - Scope to check
 * @returns True if scope is granted
 */
export async function checkAuthScope(
  context: GraphQLContext,
  scope: AuthScope,
): Promise<boolean> {
  const scopes = await getAuthScopes(context);
  return scopes[scope] ?? false;
}

/**
 * Require authentication - throws if not authenticated
 *
 * @param context - GraphQL context
 * @throws Error if not authenticated
 */
export function requireAuth(context: GraphQLContext): void {
  if (!context.authContext?.user) {
    throw new Error("Authentication required");
  }
}

/**
 * Require any of the specified auth scopes
 *
 * @param context - GraphQL context
 * @param scopes - Scopes to check (any one is sufficient)
 * @returns True if any scope is granted
 */
export async function requireAnyAuth(
  context: GraphQLContext,
  scopes: AuthScope[],
): Promise<boolean> {
  const authScopes = await getAuthScopes(context);
  return scopes.some((scope) => authScopes[scope]);
}

/**
 * Require all of the specified auth scopes
 *
 * @param context - GraphQL context
 * @param scopes - Scopes to check (all required)
 * @returns True if all scopes are granted
 */
export async function requireAllAuth(
  context: GraphQLContext,
  scopes: AuthScope[],
): Promise<boolean> {
  const authScopes = await getAuthScopes(context);
  return scopes.every((scope) => authScopes[scope]);
}

/**
 * Get auth scopes from context (internal helper)
 */
async function getAuthScopes(context: GraphQLContext): Promise<AuthScopeMap> {
  const user = context.authContext?.user;

  return {
    public: true,
    authenticated: !!user,
    admin: user?.role === "admin" || user?.role === "superadmin",
    owner: false, // Must be computed per-resource
    member: false, // Must be computed per-resource
  };
}
