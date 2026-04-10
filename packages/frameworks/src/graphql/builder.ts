import SchemaBuilder from "@pothos/core";
import ScopeAuthPlugin from "@pothos/plugin-scope-auth";
import type { DIContext } from "../trpc";

/**
 * GraphQL Context
 *
 * Context passed to all resolvers, containing:
 * - DI container for dependency injection
 * - Auth context for authentication/authorization
 * - Request metadata
 */
export interface GraphQLContext {
  container: DIContext["container"];
  authContext?: {
    userId: string;
    role: string;
  };
  requestId: string;
}

/**
 * Pothos Schema Builder with Scope Auth Plugin
 *
 * Code-first schema construction with TypeScript type safety.
 * Uses Scope Auth plugin for field-level authorization.
 *
 * Phase 3: API Layer
 * - Code-first schema (no SDL maintenance)
 * - Type-safe resolvers
 * - Field-level authorization
 * - Integrates with existing DI container
 *
 * @example
 * ```typescript
 * builder.queryType({
 *   fields: (t) => ({
 *     user: t.field({
 *       type: UserType,
 *       args: { id: t.arg.id({ required: true }) },
 *       resolve: async (_, args, ctx) => {
 *         const useCase = ctx.container.resolve("getUserUseCase");
 *         const result = await useCase.execute({ userId: args.id });
 *         return result;
 *       },
 *     }),
 *   }),
 * });
 * ```
 */
export const builder = new SchemaBuilder<{
  Context: GraphQLContext;
  Scalars: {
    ID: { Input: string; Output: string };
    DateTime: { Input: Date; Output: Date };
  };
  AuthScopes: {
    public: boolean;
    authenticated: boolean;
    admin: boolean;
    moderator: boolean;
  };
}>({
  plugins: [ScopeAuthPlugin],
  scopeAuthOptions: {
    // Default unauthorized behavior
    unauthorizedError: (parent, args, context, info, directive) =>
      new Error("Not authorized"),
  },
});

/**
 * DateTime scalar type
 *
 * Handles Date serialization/deserialization
 */
builder.scalarType("DateTime", {
  serialize: (value) => value.toISOString(),
  parseValue: (value) => {
    if (typeof value === "string") {
      return new Date(value);
    }
    throw new Error("Invalid DateTime value");
  },
});

/**
 * Auth scopes definition
 *
 * Used by @pothos/plugin-scope-auth for field-level authorization
 */
builder.globalFieldOptions("authScopes", (context) => ({
  public: true, // Always accessible
  authenticated: !!context.authContext, // Requires authentication
  admin: context.authContext?.role === "ADMIN", // Requires admin role
  moderator: ["ADMIN", "MODERATOR"].includes(context.authContext?.role || ""), // Requires moderator or admin
}));

/**
 * Re-export builder for type definitions
 */
export { builder as schemaBuilder };
