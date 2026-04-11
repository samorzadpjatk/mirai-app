/**
 * GraphQL Module
 *
 * Phase 3: API Layer (Hono + GraphQL + Pothos)
 *
 * This module provides GraphQL API alongside the existing tRPC API.
 * Uses the Strangler Fig pattern for gradual migration.
 *
 * Architecture:
 * - Pothos: Code-first schema builder with TypeScript type safety
 * - GraphQL Yoga: GraphQL server with subscriptions support
 * - Hono: Lightweight web framework
 * - Auth middleware: Validates tokens via AuthPort
 * - DI integration: Resolvers use existing use cases
 *
 * Migration Strategy:
 * - tRPC and GraphQL run concurrently (different ports)
 * - Existing clients continue using tRPC (port 3000)
 * - New polyglot clients use GraphQL (port 4000)
 * - Domain-by-domain migration without breaking changes
 *
 * @example
 * ```typescript
 * // Start GraphQL server
 * import { startHonoServer, schema } from "@mirai-app/frameworks/graphql";
 *
 * await startHonoServer(schema, {
 *   port: 4000,
 *   getDIContext: () => container.createScope(),
 *   authPort: container.resolve("authPort"),
 * });
 * ```
 */

// Schema builder and types
export { builder, schemaBuilder, type GraphQLContext } from "./builder";

// Schema
export { schema, type Schema, generateSDL, writeSDLToFile } from "./schema";

// Server
export { createHonoApp, startHonoServer } from "./server";

// Client (for web app)
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

// Native Client (for React Native with React Query integration)
export {
  GraphQLProvider as TRPCProvider,
  useGraphQL as useTRPC,
  useGraphQLClient,
  type GraphQLClient,
  type GraphQLProcedures,
  type Procedure,
  type MutationProcedure,
} from "./native-client";

// Example query:
// ```graphql
// query GetUser($id: ID!) {
//   user(id: $id) {
//     id
//     firstName
//     lastName
//     fullName
//     role
//     createdAt
//   }
// }
// ```
//
// Example mutation:
// ```graphql
// mutation CreateUser($input: CreateUserInput!) {
//   createUser(input: $input) {
//     id
//     firstName
//     lastName
//     role
//   }
// }
// ```
