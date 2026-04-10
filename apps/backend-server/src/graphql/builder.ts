/**
 * Pothos Schema Builder
 *
 * Code-first GraphQL schema builder with full TypeScript type inference.
 * Configures scalar types (DateTime), sets up the builder instance,
 * and provides type-safe schema construction.
 *
 * ## Architecture
 *
 * Pothos uses a code-first approach where TypeScript types drive the GraphQL
 * schema definition. This ensures type safety between domain entities and
 * the GraphQL API.
 *
 * ## Usage
 *
 * ```typescript
 * import { builder } from "./builder";
 *
 * builder.objectType("User", {
 *   fields: (t) => ({
 *     id: t.exposeID("id"),
 *     name: t.exposeString("name"),
 *   }),
 * });
 * ```
 *
 * @module builder
 */

import SchemaBuilder from "@pothos/core";
import ScopeAuthPlugin from "@pothos/plugin-scope-auth";
import DataLoaderPlugin from "@pothos/plugin-dataloader";
import RelayPlugin from "@pothos/plugin-relay";
import { DateTimeResolver } from "graphql-scalars";
import type { GetUserOutput } from "@mirai-app/use-cases";
import type { UserRole } from "@mirai-app/domain";

// =============================================================================
// Type Definitions for Pothos
// =============================================================================

/**
 * Pothos type registry
 *
 * These types are used by Pothos for type inference in the schema builder.
 * They map domain entities and DTOs to GraphQL types.
 */
export interface PothosTypes {
  // Context type - available in all resolvers
  Context: {
    container: import("@mirai-app/frameworks/di").AwilixContainer;
    request: Request;
  };

  // Auth scopes for @pothos/plugin-scope-auth
  AuthScopes: {
    public: boolean;
    authenticated: boolean;
    admin: boolean;
    moderator: boolean;
  };

  // Domain types mapped to GraphQL
  Objects: {
    // User domain - mapped from GetUserOutput DTO
    User: GetUserOutput;
  };

  // Scalars
  Scalars: {
    DateTime: {
      Input: Date;
      Output: Date;
    };
    ID: {
      Input: string;
      Output: string;
    };
  };
}

// =============================================================================
// Builder Initialization
// =============================================================================

/**
 * Pothos schema builder instance
 *
 * Configured with:
 * - Scope auth plugin for field-level authorization
 * - DataLoader plugin for N+1 query optimization
 * - Relay plugin for pagination (cursor-based)
 * - DateTime scalar from graphql-scalars
 */
export const builder = new SchemaBuilder<PothosTypes>({
  plugins: [ScopeAuthPlugin, DataLoaderPlugin, RelayPlugin],

  // Scope auth configuration
  scopeAuth: {
    // Default auth scopes initializer
    authScopes: async (context) => ({
      public: true,
      authenticated: false, // Will be set based on auth context
      admin: false,
      moderator: false,
    }),
  },

  // Relay options for pagination
  relay: {
    clientMutationId: "omit",
    cursorType: "String",
  },
});

// =============================================================================
// Scalar Types
// =============================================================================

/**
 * Add DateTime scalar type
 *
 * Provides ISO 8601 DateTime support for GraphQL schema.
 */
builder.addScalarType("DateTime", DateTimeResolver, {});

/**
 * Add UserRole enum type
 *
 * Maps the domain UserRole enum to GraphQL enum.
 */
export const UserRoleEnum = builder.enumType("UserRole", {
  description: "User roles in the system",
  values: {
    USER: { value: "USER" as UserRole },
    MODERATOR: { value: "MODERATOR" as UserRole },
    ADMIN: { value: "ADMIN" as UserRole },
    SERVICE: { value: "SERVICE" as UserRole },
  },
});

// =============================================================================
// Query and Mutation Types
// =============================================================================

/**
 * Create the root Query type
 *
 * This will be extended by individual domain types.
 */
builder.queryType({
  description: "Root query type for fetching data",
  authScopes: {
    public: true,
  },
});

/**
 * Create the root Mutation type
 *
 * This will be extended by individual domain types.
 */
builder.mutationType({
  description: "Root mutation type for modifying data",
  authScopes: {
    authenticated: true,
  },
});

// =============================================================================
// Subscription Type (for future real-time support)
// =============================================================================

/**
 * Create the root Subscription type
 *
 * Reserved for future GraphQL subscription support
 * (currently using WebSocket-based real-time via separate endpoint).
 */
builder.subscriptionType({
  description: "Root subscription type for real-time updates",
  authScopes: {
    authenticated: true,
  },
});

// =============================================================================
// Export
// =============================================================================

export default builder;
