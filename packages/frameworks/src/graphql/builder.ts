import SchemaBuilder from "@pothos/core";
import RelayPlugin from "@pothos/plugin-relay";
import DataloaderPlugin from "@pothos/plugin-dataloader";
import ScopeAuthPlugin from "@pothos/plugin-scope-auth";
import type { DateTimeResolver, EmailAddressResolver } from "graphql-scalars";
import type { GraphQLContext } from "./context";
import type { AuthScopeMap } from "./auth";
import type { FriendLocationEvent } from "./types/location/types.js";

/**
 * Schema builder configuration type
 */
export interface SchemaBuilderConfig {
  relay?: {
    clientMutationId?: "omit" | "include" | "exclude";
    cursorType?: "String" | "ID";
  };
  auth?: {
    authorizeOnSubscribe?: boolean;
  };
  scalars?: {
    DateTime: typeof DateTimeResolver;
    EmailAddress: typeof EmailAddressResolver;
  };
}

/**
 * Default scalars configuration
 * These are registered automatically via graphql-scalars
 */
const defaultScalars = {
  DateTime: "DateTime",
  EmailAddress: "EmailAddress",
  UUID: "UUID",
  JSONObject: "JSONObject",
  URL: "URL",
  BigInt: "BigInt",
} as const;

/**
 * Extended builder type with plugins
 *
 * This type represents the fully configured Pothos builder with:
 * - Relay plugin for pagination
 * - DataLoader plugin for N+1 prevention
 * - Scope Auth plugin for authorization
 */
export type BuilderType = ReturnType<typeof createBuilder>;

/**
 * Create the Pothos schema builder with all plugins
 *
 * This factory function creates a configured SchemaBuilder instance
 * with all required plugins for the Mirai App GraphQL API.
 *
 * ## Plugins
 *
 * ### @pothos/plugin-relay
 * Provides Relay-compliant pagination and the Node interface.
 * All types that implement `nodeInterface` get automatic global ID support.
 *
 * ### @pothos/plugin-dataloader
 * Provides DataLoader integration for solving N+1 query problems.
 * Use `t.loadable()` for fields that need batch loading.
 *
 * ### @pothos/plugin-scope-auth
 * Provides authorization based on auth scopes.
 * Use `authScopes` option to define required permissions.
 *
 * ## Usage
 *
 * ```typescript
 * import { builder } from "@mirai-app/frameworks/graphql";
 *
 * // The builder is pre-configured with all plugins
 * builder.objectType("User", {
 *   interfaces: [builder.nodeInterface],
 *   fields: (t) => ({
 *     id: t.exposeID("id"),
 *     email: t.exposeString("email"),
 *   }),
 * });
 * ```
 */
export function createBuilder() {
  return new SchemaBuilder<{
    // Context type for all resolvers
    Context: GraphQLContext;

    // Scalars from graphql-scalars
    Scalars: {
      DateTime: {
        Input: Date;
        Output: Date;
      };
      EmailAddress: {
        Input: string;
        Output: string;
      };
      UUID: {
        Input: string;
        Output: string;
      };
      JSONObject: {
        Input: Record<string, unknown>;
        Output: Record<string, unknown>;
      };
      URL: {
        Input: string;
        Output: string;
      };
      BigInt: {
        Input: bigint;
        Output: bigint;
      };
    };

    // Auth scopes configuration
    AuthScopes: AuthScopeMap;

    // Auth contexts for field-level auth
    AuthContexts: {
      AuthContext: GraphQLContext & {
        authContext: NonNullable<GraphQLContext["authContext"]>;
      };
    };

    // Relay plugin options
    Objects: {
      Node: {};
      PageInfo: {
        hasNextPage: boolean;
        hasPreviousPage: boolean;
        startCursor: string | null;
        endCursor: string | null;
      };
      FriendLocationEvent: FriendLocationEvent;
    };
    Interfaces: {
      Node: {};
    };
  }>({
    plugins: [RelayPlugin, DataloaderPlugin, ScopeAuthPlugin],

    relay: {
      // Use "omit" to exclude clientMutationId from mutation inputs
      clientMutationId: "omit",
      // Use String for cursor type
      cursorType: "String",
    },

    scopeAuth: {
      // Default auth scopes - can be overridden per-type
      authScopes: () => ({
        public: true,
        authenticated: false,
        admin: false,
        moderator: false,
        owner: false,
        member: false,
      }),
    },
  });
}

/**
 * Global schema builder instance
 *
 * This is the primary builder instance used throughout the application.
 * Import this to define types, queries, mutations, and subscriptions.
 *
 * ## Example
 *
 * ```typescript
 * import { builder } from "@mirai-app/frameworks/graphql";
 *
 * // Define a type
 * builder.objectType("User", {
 *   interfaces: [builder.nodeInterface],
 *   fields: (t) => ({
 *     id: t.exposeID("id"),
 *     email: t.exposeString("email"),
 *   }),
 * });
 *
 * // Define a query
 * builder.queryType({
 *   fields: (t) => ({
 *     user: t.field({
 *       type: "User",
 *       args: {
 *         id: t.arg.id({ required: true }),
 *       },
 *       resolve: async (_parent, args, ctx) => {
 *         return await ctx.controllers.userController.getById({ id: args.id });
 *       },
 *     }),
 *   }),
 * });
 * ```
 */
export const builder = createBuilder();

/**
 * Type export for the builder
 * Use this when you need to reference the builder type explicitly.
 */
export type Builder = typeof builder;
