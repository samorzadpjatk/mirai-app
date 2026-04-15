/**
 * GraphQL Module
 *
 * Framework Layer - GraphQL API Infrastructure
 *
 * This module provides GraphQL schema, resolvers, and server infrastructure.
 * It is part of the Frameworks layer in Clean Architecture, providing the
 * API adapter implementation that the application layer uses.
 *
 * Architecture:
 * - Pothos: Code-first schema builder with TypeScript type safety
 * - GraphQL Yoga: GraphQL server with subscriptions support
 * - Hono: Lightweight web framework integration
 * - DI integration: Resolvers use Effect-based controllers
 *
 * ## Usage
 *
 * ### In Application Layer (backend-server):
 * ```typescript
 * import {
 *   schema,
 *   createYogaHandler,
 *   createSimpleContextFactory
 * } from "@mirai-app/frameworks/graphql";
 *
 * const yoga = createYogaHandler({
 *   enableGraphiQL: process.env.NODE_ENV === "development",
 *   contextFactory: createSimpleContextFactory(),
 * });
 * ```
 *
 * ### For Client Applications:
 * ```typescript
 * import { GraphQLProvider, useGraphQL } from "@mirai-app/frameworks/graphql";
 * ```
 */

// =============================================================================
// Schema Builder
// =============================================================================

export { builder, UserRoleEnum } from "./builder";
export type { PothosTypes } from "./builder";

// =============================================================================
// Schema
// =============================================================================

export { schema } from "./schema";
export type { Schema } from "./schema";
export { generateSDL, saveSchemaToFile, generateAndSaveSchema } from "./schema";

// =============================================================================
// Context
// =============================================================================

export type { GraphQLContext } from "./context";
export { createContextFactory, createSimpleContextFactory } from "./context";

// =============================================================================
// Server and Handlers
// =============================================================================

export { createYogaHandler, createDefaultYogaHandler } from "./yoga-handler";

// Legacy server (deprecated - use yoga-handler instead)
export { createHonoApp, startHonoServer } from "./server";

// =============================================================================
// Client (for web app)
// =============================================================================

export {
  GraphQLProvider,
  useGraphQL,
  useGraphQLQuery,
  useGraphQLMutation,
  APIProvider,
  useTRPCClient,
  getTRPCClient,
  type GraphQLClient,
  type GraphQLClientConfig,
} from "./client";

// =============================================================================
// Native Client (for React Native with React Query integration)
// =============================================================================

export {
  GraphQLProvider as TRPCProvider,
  useGraphQL as useTRPC,
  useGraphQLClient,
  GraphQLClient as NativeGraphQLClient,
  type Procedure,
  type MutationProcedure,
} from "./native-client";
