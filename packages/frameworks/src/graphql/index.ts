/**
 * GraphQL Framework Package
 *
 * Pothos-based GraphQL schema builder with plugins:
 * - @pothos/plugin-relay: Relay-compliant pagination and node interface
 * - @pothos/plugin-dataloader: DataLoader integration for N+1 prevention
 * - @pothos/plugin-scope-auth: Authorization based on scopes
 * - graphql-scalars: Custom scalar types (DateTime, EmailAddress, etc.)
 *
 * ## Architecture
 *
 * ```
 * ┌─────────────────────────────────────────────┐
 * │           Schema Builder (builder.ts)         │
 * │  ┌─────────┐ ┌─────────┐ ┌───────────────┐  │
 * │  │  Relay  │ │Loaders  │ │     Auth      │  │
 * │  │ Plugin  │ │Plugin   │ │    Plugin     │  │
 * │  └─────────┘ └─────────┘ └───────────────┘  │
 * └─────────────────────────────────────────────┘
 *                      │
 *         ┌────────────┼────────────┐
 *         ▼            ▼            ▼
 *    ┌────────┐  ┌────────┐  ┌──────────┐
 *    │Scalars │  │Context │  │  Errors  │
 *    └────────┘  └────────┘  └──────────┘
 * ```
 *
 * ## Usage
 *
 * ### Building a Schema
 * ```typescript
 * import { builder } from "@mirai-app/frameworks/graphql";
 * import "./types/user"; // Register types
 *
 * export const schema = builder.toSchema();
 * ```
 *
 * ### Creating a Server
 * ```typescript
 * import { createGraphQLServer } from "@mirai-app/frameworks/graphql";
 * import { schema } from "./schema";
 *
 * const yoga = createGraphQLServer({
 *   schema,
 *   context: async ({ request }) => ({
 *     user: await authenticate(request),
 *   }),
 * });
 * ```
 *
 * ### Defining Types
 * ```typescript
 * import { builder } from "@mirai-app/frameworks/graphql";
 *
 * builder.objectType("User", {
 *   interfaces: [builder.nodeInterface],
 *   isTypeOf: (obj) => obj.__typename === "User",
 *   fields: (t) => ({
 *     id: t.exposeID("id"),
 *     email: t.exposeString("email"),
 *     createdAt: t.field({
 *       type: "DateTime",
 *       resolve: (user) => user.createdAt,
 *     }),
 *   }),
 * });
 * ```
 */

// =============================================================================
// Core Schema Builder
// =============================================================================

export { builder, type BuilderType, type SchemaBuilderConfig } from "./builder";

// =============================================================================
// Custom Scalars
// =============================================================================

export {
  scalars,
  type ScalarName,
  type ScalarsConfig,
  registerScalars,
  parseDateTime,
  serializeDateTime,
} from "./scalars";

// =============================================================================
// Context Types and Utilities
// =============================================================================

export {
  type GraphQLContext,
  type AuthContext,
  type GraphQLContextFactory,
  type GraphQLContextConfig,
  createGraphQLContext,
} from "./context";

// =============================================================================
// Error Handling
// =============================================================================

export {
  type GraphQLErrorCode,
  GraphQLErrorExtensions,
  createGraphQLError,
  formatError,
  mapDomainErrorToGraphQL,
} from "./errors";

// =============================================================================
// Server Setup (Yoga)
// =============================================================================

export {
  createGraphQLServer,
  type GraphQLServerConfig,
  type GraphQLServer,
  type YogaContext,
} from "./server";

// =============================================================================
// Schema Utilities
// =============================================================================

export {
  type NodeType,
  type ConnectionType,
  type EdgeType,
  type PageInfo,
  createConnectionType,
  createEdgeType,
  toGlobalId,
  fromGlobalId,
  isValidGlobalId,
} from "./relay";

// =============================================================================
// Connection Pagination Utilities
// =============================================================================

export type {
  CursorDataWithDate,
  ConnectionItem,
  GatewayConnectionResult,
  EncodeCursorFn,
} from "./utils/connections";

export {
  decodeCursorWithDate,
  buildConnectionResponse,
  buildEdges,
  buildPageInfo,
  createEmptyConnection,
  clampFirst,
  PAGINATION_LIMITS,
} from "./utils/connections";

// =============================================================================
// DataLoader Utilities
// =============================================================================

export {
  type LoaderConfig,
  type LoaderCache,
  createLoader,
  createCachedLoader,
  batchLoadFn,
} from "./loaders";

// =============================================================================
// Authorization Utilities
// =============================================================================

export {
  type AuthScope,
  type AuthScopeMap,
  type AuthScopesFunction,
  defineAuthScopes,
  checkAuthScope,
  requireAuth,
  requireAnyAuth,
  requireAllAuth,
} from "./auth";

// =============================================================================
// Schema Generation
// =============================================================================

export {
  printSchemaToSDL,
  writeSchemaToFile,
  type SchemaOutputConfig,
} from "./schema-output";

// =============================================================================
// Re-exports from Pothos (for convenience)
// =============================================================================

export {
  type ObjectTypeOptions,
  type InterfaceTypeOptions,
} from "@pothos/core";
export { type RelayPluginOptions } from "@pothos/plugin-relay";
