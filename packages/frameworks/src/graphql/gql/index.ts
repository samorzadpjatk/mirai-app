// =============================================================================
// GraphQL GQL Index
// =============================================================================

/**
 * GraphQL Operations and Subscriptions
 *
 * This directory contains all .graphql/.gql files for the application:
 * - fragments/ - Reusable GraphQL fragments
 * - operations/ - Queries and mutations organized by domain
 * - subscriptions/ - Real-time subscriptions
 *
 * These files are used by graphql-code-generator to create typed urql hooks
 * in the generated/ directory.
 *
 * ## Regeneration
 *
 * ```bash
 * bun run --filter=@mirai-app/frameworks sync:schema
 * ```
 *
 * This will:
 * 1. Generate schema.graphql from Pothos
 * 2. Generate TypeScript types and urql hooks from these .gql files
 */

// Export the glob pattern for documentation
export const GQL_PATTERN = "./src/graphql/gql/**/*.graphql";
