import { builder } from "./builder.js";

// =============================================================================
// Scalar Registration (must be imported before types that use them)
// =============================================================================

import "./scalars.js";

// =============================================================================
// Relay Types (must be imported before connection types that use PageInfo)
// =============================================================================

import "./relay.js";

// =============================================================================
// Root Types
// =============================================================================

// Define the Query type - domain modules add fields via side-effect imports
builder.queryType({
  description: "Root Query type",
  fields: () => ({}),
});

// Define the Mutation type - domain modules add fields via side-effect imports
builder.mutationType({
  description: "Root Mutation type",
  fields: () => ({}),
});

// Define the Subscription type - domain modules add fields via side-effect imports
builder.subscriptionType({
  description: "Root Subscription type",
  fields: () => ({}),
});

// =============================================================================
// Domain Module Imports (Side-Effect Registration)
// =============================================================================

// Domain modules register their types with Pothos via side-effect imports.
// Uncomment each domain as it is migrated to the modular structure.
import "./types/user/index.js";
import "./types/sponsor/index.js";
import "./types/coinTransaction/index.js";
import "./types/notification/index.js";
import "./types/reward/index.js";
import "./types/activity/index.js";
import "./types/challenge/index.js";
import "./types/group/index.js";
import "./types/location/index.js";
import "./types/trip/index.js";

// =============================================================================
// Schema Assembly
// =============================================================================

/**
 * Unified GraphQL Schema
 *
 * This is the central schema assembly point for the Mirai App GraphQL API.
 * Domain modules register their types via side-effect imports above,
 * and the builder assembles them into a complete schema.
 *
 * ## Usage
 *
 * ### In Server Setup
 * ```typescript
 * import { schema } from "@mirai-app/frameworks/graphql";
 * import { createGraphQLServer } from "@mirai-app/frameworks/graphql";
 *
 * const yoga = createGraphQLServer({ schema, context });
 * ```
 *
 * ### In Schema Generation
 * ```typescript
 * import { schema } from "@mirai-app/frameworks/graphql/schema.js";
 * import { writeSchemaToFile } from "@mirai-app/frameworks/graphql";
 *
 * await writeSchemaToFile({ schema, outputPath: "./schema.graphql" });
 * ```
 *
 * ## Architecture
 *
 * The schema is built using Pothos's code-first approach with plugins:
 * - @pothos/plugin-relay: Relay-compliant pagination and Node interface
 * - @pothos/plugin-dataloader: DataLoader integration for N+1 prevention
 * - @pothos/plugin-scope-auth: Field-level authorization
 *
 * Domain modules (user, event, sponsor, notification, coinTransaction) each
 * have their own directory under `types/` with:
 * - types.ts: Object type definitions
 * - queries.ts: Query resolvers
 * - mutations.ts: Mutation resolvers
 * - subscriptions.ts: Subscription resolvers
 * - index.ts: Module exports and side-effect registration
 */
export const schema = builder.toSchema();

/**
 * Default export for convenience
 */
export default schema;
