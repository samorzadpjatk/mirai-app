// =============================================================================
// GraphQL Frameworks Module - Server-Agnostic
// =============================================================================

/**
 * GraphQL Schema and Types for Mirai App
 *
 * This package provides:
 * - GraphQL schema built with Pothos
 * - Types, enums, and inputs
 * - Minimal context interface (implemented by apps)
 * - Resolver helpers
 *
 * ## Server Setup (App Responsibility)
 *
 * The GraphQL package is SERVER-AGNOSTIC. The app (e.g., backend-server)
 * must handle server setup, auth, and runtime injection.
 *
 * ### Example: Hono + Yoga
 *
 * ```typescript
 * // apps/backend-server/src/graphql.ts
 * import { Hono } from "hono";
 * import { createYoga } from "graphql-yoga";
 * import { schema } from "@mirai-app/frameworks/graphql";
 * import { makeAppLayer } from "@mirai-app/frameworks";
 * import { Effect, Layer } from "effect";
 * import { user } from "./auth"; // Your auth module
 * 
 * const app = new Hono();
 * 
 * // Build app layer with dependencies
 * const appLayer = makeAppLayer({ db });
 * const runtime = await Effect.runPromise(Layer.toRuntime(appLayer));
 * 
 * // Create Yoga with Effect DI
 * const yoga = createYoga({
 *   schema,
 *   context: async ({ request }) => {
 *     // App handles AuthN
 *     const token = extractToken(request.headers.get("authorization"));
 *     const authUser = await user.getUser(token); // Uses AuthNPort
 *     
 *     return {
 *       request,
 *       authContext: authUser ? {
 *         userId: authUser.id,
 *         role: authUser.role,
 *       } : undefined,
 *       runtime,  // Pre-built with all deps
 *     };
 *   },
 * });
 * 
 * app.use("/graphql", yoga);
 * ```
 *
 * ## Resolver Pattern
 *
 * ```typescript
 * import { builder } from "@mirai-app/frameworks/graphql";
 * import { GetMyProfileUseCase } from "@mirai-app/use-cases/user";
 * import { requireAuth, runEffect, mapErrorToGraphQL } from "@mirai-app/frameworks/graphql";
 * 
 * builder.queryFields((t) => ({
 *   me: t.field({
 *     type: UserProfileType,
 *     resolve: async (_parent, _args, context) => {
 *       // Auth check
 *       const auth = requireAuth(context);
 *       
 *       // Use case execution
 *       const useCase = new GetMyProfileUseCase();
 *       const effect = useCase.execute({ userId: auth.userId });
 *       
 *       // Execute with app's runtime
 *       return runEffect(context, effect).catch((error) => {
 *         throw mapErrorToGraphQL(error);
 *       });
 *     },
 *   }),
 * }));
 * ```
 *
 * ## AuthN/AuthZ Flow
 *
 * ```
 * 1. HTTP Request
 *    │
 * 2. App extracts token from headers
 *    │
 * 3. App calls AuthN use case (validate token, get user)
 *    ├─ uses AuthNPort → BetterAuthGateway
 *    │
 * 4. App builds AuthContext { userId, role }
 *    │
 * 5. App creates Effect Runtime (Layer.toRuntime)
 *    │
 * 6. App provides both to GraphQL context
 *    │
 * 7. GraphQL resolver receives context
 *    ├─ uses requireAuth() for AuthZ (role checks)
 *    ├─ uses runEffect() with runtime
 *    │
 * 8. Use case executes with injected dependencies
 * ```
 *
 * ## Key Principles
 *
 * 1. **Server-Agnostic**: No server framework dependencies
 * 2. **App Manages Auth**: App extracts and validates tokens
 * 3. **Runtime Injection**: App creates and provides Effect Runtime
 * 4. **Thin Resolvers**: Only authZ check + use case call
 * 5. **Effect for Business**: All complexity in use cases
 */

// =============================================================================
// Core
// =============================================================================

export { builder } from "./builder.js";
export { schema, default as defaultSchema } from "./schema.js";

// =============================================================================
// Context (Interface Only)
// =============================================================================

export {
  requireAuth,
  requireAdmin,
  requireModerator,
  getOptionalAuth,
  runEffect,
  type GraphQLContext,
  type AuthContext,
} from "./context.js";

// =============================================================================
// Errors
// =============================================================================

export {
  mapErrorToGraphQL,
  notFoundError,
  badRequestError,
  forbiddenError,
  unauthorizedError,
  conflictError,
  type GraphQLError,
} from "./errors.js";

// =============================================================================
// Pub/Sub for Subscriptions
// =============================================================================

export { pubsub } from "./types/subscriptions/index.js";

// =============================================================================
// Type Exports
// =============================================================================

export * from "./types/index.js";

// =============================================================================
// Enums
// =============================================================================

export {
  RoleEnum,
  SubmissionTypeEnum,
  ScoringCategoryEnum,
  ChallengeStatusEnum,
  SubmissionStatusEnum,
  VoteTypeEnum,
  NotificationTypeEnum,
  NotificationPriorityEnum,
  CoinTransactionTypeEnum,
} from "./builder.js";

// =============================================================================
// Codegen Configuration
// =============================================================================

/**
 * GraphQL Codegen config for generating client types.
 * Used by: `bun run --filter=@mirai-app/frameworks sync:schema`
 */
export { default as codegenConfig } from "./codegen.js";

// =============================================================================
// Client Types and Hooks (Generated)
// =============================================================================

/**
 * Generated client types and hooks are available at:
 * - @mirai-app/frameworks/graphql/client - Main exports (types, operations, urql hooks)
 * - @mirai-app/frameworks/graphql/client/types - TypeScript types
 * - @mirai-app/frameworks/graphql/client/operations - Operation types
 * - @mirai-app/frameworks/graphql/client/urql - urql hooks
 *
 * Regenerate with: `bun run --filter=@mirai-app/frameworks sync:schema`
 */
